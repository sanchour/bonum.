import { db } from "./db";
import { PILLAR_BY_ID, isPillarId } from "./pillars";
import { enqueueInTx } from "./sync";
import type { Axiom, Dialectic, Ritual, Stage } from "./types";
import { nowISO } from "./util";

const FORMAT = "bonum-backup";
const VERSION = 1;
const STAGES: readonly Stage[] = ["Spark", "Crucible", "Canon", "Reforged"];

export interface BackupFile {
  format: typeof FORMAT;
  version: number;
  exportedAt: string;
  axioms: Axiom[];
  rituals: Ritual[];
}

export interface BackupSummary {
  axioms: number;
  canon: number;
  rituals: number;
  exportedAt: string;
}

export async function buildBackup(): Promise<BackupFile> {
  const [axioms, rituals] = await Promise.all([db.axioms.toArray(), db.rituals.toArray()]);
  return { format: FORMAT, version: VERSION, exportedAt: nowISO(), axioms, rituals };
}

/** Triggers a browser download of the full backup as JSON. */
export async function downloadBackup(): Promise<BackupSummary> {
  const backup = await buildBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `bonum-backup-${backup.exportedAt.slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return summarize(backup);
}

function summarize(backup: BackupFile): BackupSummary {
  return {
    axioms: backup.axioms.length,
    canon: backup.axioms.filter((a) => a.stage === "Canon" || a.stage === "Reforged").length,
    rituals: backup.rituals.length,
    exportedAt: backup.exportedAt,
  };
}

const str = (value: unknown, fallback = ""): string => (typeof value === "string" ? value : fallback);

function parseAxiom(raw: unknown): Axiom | null {
  if (typeof raw !== "object" || raw === null) return null;
  const v = raw as Record<string, unknown>;
  if (typeof v.id !== "string" || !v.id || !isPillarId(v.pillarId)) return null;
  const stage = STAGES.includes(v.stage as Stage) ? (v.stage as Stage) : "Spark";
  const dialectics: Dialectic[] = Array.isArray(v.dialectics)
    ? v.dialectics
        .filter(
          (d): d is Dialectic =>
            typeof d === "object" && d !== null && typeof (d as Dialectic).question === "string" && typeof (d as Dialectic).answer === "string",
        )
        .map(({ question, answer }) => ({ question, answer }))
    : [];
  const now = nowISO();
  return {
    id: v.id,
    notionId: typeof v.notionId === "string" ? v.notionId : null,
    title: str(v.title, "Untitled") || "Untitled",
    pillarId: v.pillarId,
    realm: PILLAR_BY_ID[v.pillarId].realm,
    stage,
    thesis: str(v.thesis),
    dialectics,
    bodyMarkdown: str(v.bodyMarkdown),
    antithesisId: typeof v.antithesisId === "string" ? v.antithesisId : null,
    resonance: typeof v.resonance === "number" && v.resonance >= 0 ? Math.floor(v.resonance) : 0,
    lastContemplated: str(v.lastContemplated),
    syncStatus: "pending",
    canonizedAt: typeof v.canonizedAt === "string" ? v.canonizedAt : null,
    createdAt: str(v.createdAt, now),
    updatedAt: str(v.updatedAt, now),
    notionEditedAt: typeof v.notionEditedAt === "string" ? v.notionEditedAt : null,
    notionHash: typeof v.notionHash === "string" ? v.notionHash : null,
  };
}

function parseRitual(raw: unknown): Ritual | null {
  if (typeof raw !== "object" || raw === null) return null;
  const v = raw as Record<string, unknown>;
  if (typeof v.id !== "string" || typeof v.date !== "string" || !Array.isArray(v.cards)) return null;
  if (v.office !== "Matins" && v.office !== "Vespers") return null;
  return raw as Ritual;
}

export class BackupError extends Error {}

export interface ParsedBackup {
  axioms: Axiom[];
  rituals: Ritual[];
  summary: BackupSummary;
}

export function parseBackup(text: string): ParsedBackup {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new BackupError("That file is not valid JSON.");
  }
  const file = data as Partial<BackupFile> | null;
  if (!file || file.format !== FORMAT || !Array.isArray(file.axioms)) {
    throw new BackupError("That file is not a Bonum backup.");
  }
  if (typeof file.version === "number" && file.version > VERSION) {
    throw new BackupError("That backup was made by a newer version of Bonum.");
  }
  const axioms = file.axioms.map(parseAxiom).filter((a): a is Axiom => a !== null);
  const rituals = (Array.isArray(file.rituals) ? file.rituals : []).map(parseRitual).filter((r): r is Ritual => r !== null);
  if (axioms.length === 0 && rituals.length === 0) throw new BackupError("That backup contains no laws.");
  return {
    axioms,
    rituals,
    summary: {
      axioms: axioms.length,
      canon: axioms.filter((a) => a.stage === "Canon" || a.stage === "Reforged").length,
      rituals: rituals.length,
      exportedAt: str(file.exportedAt),
    },
  };
}

/**
 * "merge" keeps everything already here and takes the newer copy of any law present in both.
 * "replace" discards the current canon and offices first.
 */
export async function applyBackup(backup: ParsedBackup, mode: "merge" | "replace"): Promise<void> {
  await db.transaction("rw", [db.axioms, db.rituals, db.syncQueue], async () => {
    if (mode === "replace") {
      await Promise.all([db.axioms.clear(), db.rituals.clear(), db.syncQueue.clear()]);
    }
    const existing = new Map((await db.axioms.bulkGet(backup.axioms.map((a) => a.id))).map((a) => [a?.id, a]));
    const toWrite = backup.axioms.filter((incoming) => {
      const current = existing.get(incoming.id);
      return !current || incoming.updatedAt > current.updatedAt;
    });
    await db.axioms.bulkPut(toWrite);
    for (const axiom of toWrite) await enqueueInTx(axiom.id);

    const existingRituals = new Set((await db.rituals.bulkGet(backup.rituals.map((r) => r.id))).map((r) => r?.id));
    await db.rituals.bulkPut(backup.rituals.filter((r) => !existingRituals.has(r.id)));
  });
}
