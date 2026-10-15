/**
 * Server-only Notion adapter. Imported exclusively by app/api/notion/route.ts.
 *
 * The adapter reads the Axioms database schema first and only reads/writes properties that
 * actually exist, matching them by type and a list of accepted names. A sparse or renamed
 * Notion schema therefore degrades gracefully instead of failing every request with a 400.
 */
import { PILLARS, PILLAR_BY_NAME } from "./pillars";
import type { AxiomWire, Dialectic, PushResult, RemoteAxiom, Stage } from "./types";

/** Overridable for proxies and for local testing against a mock. */
const NOTION_API = (process.env.NOTION_API_BASE ?? "https://api.notion.com/v1").replace(/\/$/, "");
const NOTION_VERSION = process.env.NOTION_VERSION ?? "2022-06-28";
const RICH_TEXT_CHUNK = 2000;
const RICH_TEXT_MAX_CHUNKS = 100;
const SCHEMA_TTL_MS = 5 * 60_000;
/** Notion allows ~3 requests/second per integration. */
const MIN_REQUEST_GAP_MS = 340;
const MAX_PULL_PAGES = 500;

export interface NotionConfig {
  apiKey: string;
  axiomsDbId: string;
  pillarsDbId: string | null;
}

export function getNotionConfig(): NotionConfig | null {
  const apiKey = process.env.NOTION_API_KEY?.trim();
  const axiomsDbId = process.env.NOTION_AXIOMS_DB_ID?.trim();
  if (!apiKey || !axiomsDbId) return null;
  return {
    apiKey,
    axiomsDbId: normalizeId(axiomsDbId),
    pillarsDbId: process.env.NOTION_PILLARS_DB_ID?.trim() ? normalizeId(process.env.NOTION_PILLARS_DB_ID.trim()) : null,
  };
}

/** Accepts a bare id, a dashed uuid, or a full notion.so URL. */
function normalizeId(raw: string): string {
  const match = raw.replace(/-/g, "").match(/[0-9a-f]{32}/i);
  return match ? match[0] : raw;
}

/* ───────────────────────────── HTTP with backoff ───────────────────────────── */

export class NotionError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string | null,
  ) {
    super(message);
    this.name = "NotionError";
  }
}

let nextSlot = 0;
async function throttle(): Promise<void> {
  const now = Date.now();
  const wait = Math.max(0, nextSlot - now);
  nextSlot = Math.max(now, nextSlot) + MIN_REQUEST_GAP_MS;
  if (wait > 0) await sleep(wait);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function notionFetch<T>(config: NotionConfig, path: string, init: RequestInit = {}, attempt = 0): Promise<T> {
  await throttle();
  let response: Response;
  try {
    response = await fetch(`${NOTION_API}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
  } catch (error) {
    if (attempt < 2) {
      await sleep(600 * (attempt + 1));
      return notionFetch<T>(config, path, init, attempt + 1);
    }
    throw new NotionError(`Network error reaching Notion: ${(error as Error).message}`, 0, "network_error");
  }

  if (response.status === 429 || response.status >= 500) {
    if (attempt < 3) {
      const retryAfter = Number(response.headers.get("retry-after"));
      const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 800 * 2 ** attempt;
      await sleep(Math.min(delay, 10_000));
      return notionFetch<T>(config, path, init, attempt + 1);
    }
  }

  if (!response.ok) {
    let message = `Notion responded ${response.status}`;
    let code: string | null = null;
    try {
      const body = (await response.json()) as { message?: string; code?: string };
      if (body.message) message = body.message;
      code = body.code ?? null;
    } catch {
      /* non-JSON error body */
    }
    throw new NotionError(message, response.status, code);
  }

  return (await response.json()) as T;
}

/* ─────────────────────────────── Notion shapes ─────────────────────────────── */

interface RichTextItem {
  plain_text?: string;
  text?: { content: string };
}

interface PropertySchema {
  id: string;
  name: string;
  type: string;
}

interface DatabaseObject {
  id: string;
  title: RichTextItem[];
  properties: Record<string, PropertySchema>;
}

type PropertyValue = { type: string } & Record<string, unknown>;

interface PageObject {
  id: string;
  last_edited_time: string;
  archived?: boolean;
  in_trash?: boolean;
  properties: Record<string, PropertyValue>;
}

interface QueryResponse {
  results: PageObject[];
  has_more: boolean;
  next_cursor: string | null;
}

/* ──────────────────────────── Schema resolution ──────────────────────────── */

type FieldKey =
  | "title"
  | "pillar"
  | "realm"
  | "stage"
  | "thesis"
  | "dialectics"
  | "body"
  | "antithesis"
  | "resonance"
  | "lastContemplated"
  | "canonizedAt"
  | "bonumId";

const FIELD_SPECS: Record<Exclude<FieldKey, "title">, { names: string[]; types: string[] }> = {
  pillar: { names: ["pillar", "pillars", "book", "tome"], types: ["relation", "select", "rich_text"] },
  realm: { names: ["realm"], types: ["select", "rich_text"] },
  stage: { names: ["stage", "status"], types: ["select", "status", "rich_text"] },
  thesis: { names: ["thesis"], types: ["rich_text"] },
  dialectics: { names: ["dialectics", "trials"], types: ["rich_text"] },
  body: { names: ["body", "body markdown", "bodymarkdown", "notes"], types: ["rich_text"] },
  antithesis: { names: ["antithesis", "antithesis id"], types: ["relation", "rich_text"] },
  resonance: { names: ["resonance"], types: ["number"] },
  lastContemplated: { names: ["last contemplated", "lastcontemplated", "contemplated"], types: ["date"] },
  canonizedAt: { names: ["canonized", "canonized at", "canonizedat"], types: ["date"] },
  bonumId: { names: ["bonum id", "bonumid", "local id"], types: ["rich_text"] },
};

export const EXPECTED_PROPERTIES = [
  "Pillar",
  "Realm",
  "Stage",
  "Thesis",
  "Dialectics",
  "Body",
  "Antithesis",
  "Resonance",
  "Last Contemplated",
  "Canonized",
  "Bonum ID",
] as const;

interface ResolvedSchema {
  databaseTitle: string;
  fields: Partial<Record<FieldKey, PropertySchema>>;
  missing: string[];
  fetchedAt: number;
}

let schemaCache: { key: string; schema: ResolvedSchema } | null = null;

export async function getSchema(config: NotionConfig, force = false): Promise<ResolvedSchema> {
  const cacheKey = `${config.axiomsDbId}:${config.apiKey.slice(-6)}`;
  if (!force && schemaCache?.key === cacheKey && Date.now() - schemaCache.schema.fetchedAt < SCHEMA_TTL_MS) {
    return schemaCache.schema;
  }

  const database = await notionFetch<DatabaseObject>(config, `/databases/${config.axiomsDbId}`);
  const properties = Object.entries(database.properties).map(([name, prop]) => ({ ...prop, name }));
  const fields: Partial<Record<FieldKey, PropertySchema>> = {};

  const titleProp = properties.find((prop) => prop.type === "title");
  if (titleProp) fields.title = titleProp;

  for (const [key, spec] of Object.entries(FIELD_SPECS) as [Exclude<FieldKey, "title">, (typeof FIELD_SPECS)[keyof typeof FIELD_SPECS]][]) {
    const match = properties.find(
      (prop) => spec.names.includes(prop.name.trim().toLowerCase()) && spec.types.includes(prop.type),
    );
    if (match) fields[key] = match;
  }

  const missing = EXPECTED_PROPERTIES.filter((name) => {
    const key = (Object.keys(FIELD_SPECS) as Exclude<FieldKey, "title">[]).find((k) =>
      FIELD_SPECS[k].names.includes(name.toLowerCase()),
    );
    return key ? !fields[key] : false;
  });

  const schema: ResolvedSchema = {
    databaseTitle: plainText(database.title) || "Axioms",
    fields,
    missing,
    fetchedAt: Date.now(),
  };
  schemaCache = { key: cacheKey, schema };
  return schema;
}

/* ─────────────────────────────── Pillar pages ─────────────────────────────── */

let pillarPageCache: { dbId: string; byName: Map<string, string>; byId: Map<string, string>; fetchedAt: number } | null =
  null;

async function getPillarPages(config: NotionConfig): Promise<{ byName: Map<string, string>; byId: Map<string, string> }> {
  if (!config.pillarsDbId) return { byName: new Map(), byId: new Map() };
  if (pillarPageCache?.dbId === config.pillarsDbId && Date.now() - pillarPageCache.fetchedAt < SCHEMA_TTL_MS) {
    return pillarPageCache;
  }
  const byName = new Map<string, string>();
  const byId = new Map<string, string>();
  let cursor: string | null = null;
  do {
    const page: QueryResponse = await notionFetch<QueryResponse>(config, `/databases/${config.pillarsDbId}/query`, {
      method: "POST",
      body: JSON.stringify({ page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) }),
    });
    for (const result of page.results) {
      const titleValue = Object.values(result.properties).find((prop) => prop.type === "title");
      const name = titleValue ? plainText(titleValue.title as RichTextItem[]) : "";
      const pillar = PILLAR_BY_NAME.get(name.trim().toLowerCase());
      if (pillar) {
        byName.set(pillar.name, result.id);
        byId.set(stripDashes(result.id), pillar.name);
      }
    }
    cursor = page.has_more ? page.next_cursor : null;
  } while (cursor);
  pillarPageCache = { dbId: config.pillarsDbId, byName, byId, fetchedAt: Date.now() };
  return pillarPageCache;
}

/* ───────────────────────────── Value encoders ───────────────────────────── */

function stripDashes(id: string): string {
  return id.replace(/-/g, "");
}

function plainText(items: RichTextItem[] | undefined): string {
  if (!Array.isArray(items)) return "";
  return items.map((item) => item.plain_text ?? item.text?.content ?? "").join("");
}

function toRichText(value: string): { type: "text"; text: { content: string } }[] {
  if (!value) return [];
  const chunks: { type: "text"; text: { content: string } }[] = [];
  for (let i = 0; i < value.length && chunks.length < RICH_TEXT_MAX_CHUNKS; i += RICH_TEXT_CHUNK) {
    chunks.push({ type: "text", text: { content: value.slice(i, i + RICH_TEXT_CHUNK) } });
  }
  return chunks;
}

function encodeText(prop: PropertySchema, value: string): Record<string, unknown> {
  switch (prop.type) {
    case "title":
      return { title: toRichText(value) };
    case "select":
      return { select: value ? { name: value.replace(/,/g, " ") } : null };
    case "status":
      return { status: value ? { name: value } : null };
    default:
      return { rich_text: toRichText(value) };
  }
}

function decodeText(value: PropertyValue | undefined): string | undefined {
  if (!value) return undefined;
  switch (value.type) {
    case "title":
      return plainText(value.title as RichTextItem[]);
    case "rich_text":
      return plainText(value.rich_text as RichTextItem[]);
    case "select":
      return (value.select as { name?: string } | null)?.name ?? "";
    case "status":
      return (value.status as { name?: string } | null)?.name ?? "";
    default:
      return undefined;
  }
}

function decodeDate(value: PropertyValue | undefined): string | undefined {
  if (!value || value.type !== "date") return undefined;
  const start = (value.date as { start?: string } | null)?.start;
  return start ? new Date(start).toISOString() : "";
}

function decodeRelation(value: PropertyValue | undefined): string[] | undefined {
  if (!value || value.type !== "relation") return undefined;
  return ((value.relation as { id: string }[]) ?? []).map((rel) => rel.id);
}

const STAGES: readonly Stage[] = ["Spark", "Crucible", "Canon", "Reforged"];

function parseStage(raw: string | undefined): Stage | undefined {
  if (raw === undefined) return undefined;
  return STAGES.find((stage) => stage.toLowerCase() === raw.trim().toLowerCase());
}

function parseDialectics(raw: string | undefined): Dialectic[] | undefined {
  if (raw === undefined) return undefined;
  if (!raw.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return undefined;
    return parsed
      .filter(
        (item): item is Dialectic =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as Dialectic).question === "string" &&
          typeof (item as Dialectic).answer === "string",
      )
      .map(({ question, answer }) => ({ question, answer }));
  } catch {
    // Hand-edited in Notion into something that is not JSON: leave the local copy untouched.
    return undefined;
  }
}

/* ─────────────────────────────── Axiom ⇄ page ─────────────────────────────── */

async function buildProperties(config: NotionConfig, schema: ResolvedSchema, axiom: AxiomWire) {
  const { fields } = schema;
  const properties: Record<string, unknown> = {};

  if (fields.title) properties[fields.title.name] = encodeText(fields.title, axiom.title);
  if (fields.realm) properties[fields.realm.name] = encodeText(fields.realm, axiom.realm);
  if (fields.stage) properties[fields.stage.name] = encodeText(fields.stage, axiom.stage);
  if (fields.thesis) properties[fields.thesis.name] = encodeText(fields.thesis, axiom.thesis);
  if (fields.body) properties[fields.body.name] = encodeText(fields.body, axiom.bodyMarkdown);
  if (fields.bonumId) properties[fields.bonumId.name] = encodeText(fields.bonumId, axiom.id);
  if (fields.dialectics) {
    properties[fields.dialectics.name] = encodeText(fields.dialectics, JSON.stringify(axiom.dialectics));
  }
  if (fields.resonance) properties[fields.resonance.name] = { number: axiom.resonance };
  if (fields.lastContemplated) {
    properties[fields.lastContemplated.name] = {
      date: axiom.lastContemplated ? { start: axiom.lastContemplated } : null,
    };
  }
  if (fields.canonizedAt) {
    properties[fields.canonizedAt.name] = { date: axiom.canonizedAt ? { start: axiom.canonizedAt } : null };
  }

  if (fields.pillar) {
    if (fields.pillar.type === "relation") {
      const { byName } = await getPillarPages(config);
      const pageId = byName.get(axiom.pillar);
      if (pageId) properties[fields.pillar.name] = { relation: [{ id: pageId }] };
    } else {
      properties[fields.pillar.name] = encodeText(fields.pillar, axiom.pillar);
    }
  }

  if (fields.antithesis) {
    if (fields.antithesis.type === "relation") {
      properties[fields.antithesis.name] = {
        relation: axiom.antithesisNotionId ? [{ id: axiom.antithesisNotionId }] : [],
      };
    } else {
      properties[fields.antithesis.name] = encodeText(fields.antithesis, axiom.antithesisId ?? "");
    }
  }

  return properties;
}

async function pageToRemote(config: NotionConfig, schema: ResolvedSchema, page: PageObject): Promise<RemoteAxiom> {
  const { fields } = schema;
  const read = (key: FieldKey) => (fields[key] ? page.properties[fields[key]!.name] : undefined);

  let pillar: string | undefined;
  const pillarValue = read("pillar");
  if (pillarValue?.type === "relation") {
    const ids = decodeRelation(pillarValue) ?? [];
    if (ids.length > 0) {
      const { byId } = await getPillarPages(config);
      pillar = byId.get(stripDashes(ids[0]));
    }
  } else {
    const name = decodeText(pillarValue);
    pillar = name ? PILLAR_BY_NAME.get(name.trim().toLowerCase())?.name : undefined;
  }

  let antithesisNotionId: string | null | undefined;
  let antithesisId: string | null | undefined;
  const antithesisValue = read("antithesis");
  if (antithesisValue?.type === "relation") {
    const ids = decodeRelation(antithesisValue) ?? [];
    antithesisNotionId = ids[0] ?? null;
  } else if (antithesisValue) {
    antithesisId = decodeText(antithesisValue) || null;
  }

  const resonanceValue = read("resonance");
  const resonance =
    resonanceValue?.type === "number" && typeof resonanceValue.number === "number"
      ? Math.max(0, Math.round(resonanceValue.number))
      : resonanceValue
        ? 0
        : undefined;

  const canonizedRaw = decodeDate(read("canonizedAt"));

  return {
    notionId: page.id,
    editedAt: page.last_edited_time,
    archived: Boolean(page.archived || page.in_trash),
    id: decodeText(read("bonumId")) || undefined,
    title: decodeText(read("title")),
    pillar,
    stage: parseStage(decodeText(read("stage"))),
    thesis: decodeText(read("thesis")),
    dialectics: parseDialectics(decodeText(read("dialectics"))),
    bodyMarkdown: decodeText(read("body")),
    antithesisId,
    antithesisNotionId,
    resonance,
    lastContemplated: decodeDate(read("lastContemplated")),
    canonizedAt: canonizedRaw === undefined ? undefined : canonizedRaw || null,
  };
}

/* ─────────────────────────────── Operations ─────────────────────────────── */

export async function pullAxioms(
  config: NotionConfig,
  since: string | null,
): Promise<{ axioms: RemoteAxiom[]; complete: boolean; nextSince: string | null }> {
  const schema = await getSchema(config);
  const axioms: RemoteAxiom[] = [];
  let cursor: string | null = null;
  let fetched = 0;

  do {
    const body: Record<string, unknown> = {
      page_size: 100,
      sorts: [{ timestamp: "last_edited_time", direction: "ascending" }],
      ...(cursor ? { start_cursor: cursor } : {}),
      ...(since ? { filter: { timestamp: "last_edited_time", last_edited_time: { on_or_after: since } } } : {}),
    };
    const page: QueryResponse = await notionFetch<QueryResponse>(config, `/databases/${config.axiomsDbId}/query`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    for (const result of page.results) {
      axioms.push(await pageToRemote(config, schema, result));
    }
    fetched += page.results.length;
    cursor = page.has_more ? page.next_cursor : null;
  } while (cursor && fetched < MAX_PULL_PAGES);

  const complete = cursor === null;
  return {
    axioms,
    complete,
    nextSince: complete ? null : (axioms.at(-1)?.editedAt ?? since),
  };
}

async function findPageByBonumId(config: NotionConfig, schema: ResolvedSchema, id: string): Promise<PageObject | null> {
  const prop = schema.fields.bonumId;
  if (!prop) return null;
  const result = await notionFetch<QueryResponse>(config, `/databases/${config.axiomsDbId}/query`, {
    method: "POST",
    body: JSON.stringify({ page_size: 1, filter: { property: prop.name, rich_text: { equals: id } } }),
  });
  return result.results[0] ?? null;
}

export async function pushAxioms(config: NotionConfig, axioms: AxiomWire[]): Promise<PushResult[]> {
  const schema = await getSchema(config);
  const results: PushResult[] = [];

  for (const axiom of axioms) {
    try {
      const properties = await buildProperties(config, schema, axiom);
      const emoji = PILLARS.find((pillar) => pillar.name === axiom.pillar)?.emoji;
      let page: PageObject | null = null;

      if (axiom.notionId) {
        try {
          page = await notionFetch<PageObject>(config, `/pages/${axiom.notionId}`, {
            method: "PATCH",
            body: JSON.stringify({ properties }),
          });
        } catch (error) {
          // The page was deleted or archived in Notion: recreate it rather than failing forever.
          const recoverable =
            error instanceof NotionError && (error.status === 404 || /archived/i.test(error.message));
          if (!recoverable) throw error;
          page = null;
        }
      }

      if (!page) {
        const existing = axiom.notionId ? null : await findPageByBonumId(config, schema, axiom.id);
        page = existing
          ? await notionFetch<PageObject>(config, `/pages/${existing.id}`, {
              method: "PATCH",
              body: JSON.stringify({ properties }),
            })
          : await notionFetch<PageObject>(config, `/pages`, {
              method: "POST",
              body: JSON.stringify({
                parent: { database_id: config.axiomsDbId },
                ...(emoji ? { icon: { type: "emoji", emoji } } : {}),
                properties,
              }),
            });
      }

      results.push({
        id: axiom.id,
        ok: true,
        notionId: page.id,
        remoteEditedAt: page.last_edited_time,
        remote: await pageToRemote(config, schema, page),
      });
    } catch (error) {
      results.push({
        id: axiom.id,
        ok: false,
        error: error instanceof Error ? error.message : "Unknown Notion error",
      });
      // An auth failure will fail every remaining item identically; stop hammering the API.
      if (error instanceof NotionError && (error.status === 401 || error.status === 403)) {
        for (const rest of axioms.slice(results.length)) {
          results.push({ id: rest.id, ok: false, error: error.message });
        }
        break;
      }
    }
  }

  return results;
}
