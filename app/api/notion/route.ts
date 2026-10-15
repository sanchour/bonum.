import { NextResponse, type NextRequest } from "next/server";
import { NotionError, getNotionConfig, getSchema, pullAxioms, pushAxioms } from "@/lib/notion";
import type { AxiomWire, NotionStatus, PullResponse, PushResponse, Stage } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PUSH_BATCH = 25;
const STAGES: readonly Stage[] = ["Spark", "Crucible", "Canon", "Reforged"];

function notConfigured() {
  return NextResponse.json<NotionStatus>(
    { configured: false, ok: false, error: "NOTION_API_KEY and NOTION_AXIOMS_DB_ID are not set." },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}

function failure(error: unknown) {
  const status = error instanceof NotionError && error.status >= 400 && error.status < 500 ? 502 : 503;
  const message = error instanceof Error ? error.message : "Unknown error";
  return NextResponse.json({ configured: true, ok: false, error: message }, { status });
}

/**
 * GET /api/notion?mode=status        → connection + schema health
 * GET /api/notion?since=<ISO>        → pages edited on or after `since` (all pages when absent)
 */
export async function GET(request: NextRequest) {
  const config = getNotionConfig();
  if (!config) return notConfigured();

  const params = request.nextUrl.searchParams;

  if (params.get("mode") === "status") {
    try {
      const schema = await getSchema(config, params.get("refresh") === "1");
      return NextResponse.json<NotionStatus>(
        {
          configured: true,
          ok: true,
          database: schema.databaseTitle,
          missingProperties: schema.missing,
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    } catch (error) {
      return NextResponse.json<NotionStatus>(
        { configured: true, ok: false, error: error instanceof Error ? error.message : "Unknown error" },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  const sinceRaw = params.get("since");
  const since = sinceRaw && !Number.isNaN(Date.parse(sinceRaw)) ? new Date(sinceRaw).toISOString() : null;
  const serverTime = new Date().toISOString();

  try {
    const { axioms, complete, nextSince } = await pullAxioms(config, since);
    return NextResponse.json<PullResponse>(
      { configured: true, axioms, serverTime, complete, nextSince },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}

function isAxiomWire(value: unknown): value is AxiomWire {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.title === "string" &&
    typeof v.pillar === "string" &&
    typeof v.thesis === "string" &&
    typeof v.stage === "string" &&
    STAGES.includes(v.stage as Stage) &&
    Array.isArray(v.dialectics) &&
    typeof v.resonance === "number"
  );
}

/** POST /api/notion  { axioms: AxiomWire[] }  → per-axiom results */
export async function POST(request: NextRequest) {
  const config = getNotionConfig();
  if (!config) {
    return NextResponse.json<NotionStatus>(
      { configured: false, ok: false, error: "Notion is not configured." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ configured: true, ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const raw = (body as { axioms?: unknown }).axioms;
  if (!Array.isArray(raw)) {
    return NextResponse.json({ configured: true, ok: false, error: "Expected { axioms: [...] }." }, { status: 400 });
  }

  const axioms = raw.filter(isAxiomWire).slice(0, MAX_PUSH_BATCH);
  if (axioms.length === 0) {
    return NextResponse.json<PushResponse>({ configured: true, results: [] });
  }

  try {
    const results = await pushAxioms(config, axioms);
    return NextResponse.json<PushResponse>({ configured: true, results }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return failure(error);
  }
}
