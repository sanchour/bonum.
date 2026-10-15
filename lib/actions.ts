/**
 * Every write in Bonum goes through here: an optimistic IndexedDB transaction that updates the
 * axiom and enqueues it for Notion atomically, followed by a debounced background flush.
 * Callers never await the network.
 */
import { db } from "./db";
import { PILLAR_BY_ID } from "./pillars";
import { enqueueInTx, syncEngine } from "./sync";
import type { Axiom, Dialectic, PillarId, Stage } from "./types";
import { newId, nowISO } from "./util";

async function commit(ids: string[], mutate: () => Promise<void>): Promise<void> {
  await db.transaction("rw", db.axioms, db.syncQueue, async () => {
    await mutate();
    for (const id of ids) await enqueueInTx(id);
  });
  syncEngine.schedule();
}

async function patchAxiom(id: string, patch: Partial<Axiom>): Promise<void> {
  await commit([id], async () => {
    const changed = await db.axioms.update(id, { ...patch, updatedAt: nowISO(), syncStatus: "pending" });
    if (changed === 0) throw new Error(`Axiom ${id} not found`);
  });
}

export interface NewAxiomInput {
  title: string;
  thesis: string;
  pillarId: PillarId;
  bodyMarkdown?: string;
  stage?: Stage;
  antithesisId?: string | null;
}

export async function createAxiom(input: NewAxiomInput): Promise<Axiom> {
  const now = nowISO();
  const axiom: Axiom = {
    id: newId(),
    notionId: null,
    title: input.title.trim() || "Untitled",
    pillarId: input.pillarId,
    realm: PILLAR_BY_ID[input.pillarId].realm,
    stage: input.stage ?? "Spark",
    thesis: input.thesis.trim(),
    dialectics: [],
    bodyMarkdown: input.bodyMarkdown?.trim() ?? "",
    antithesisId: null,
    resonance: 0,
    lastContemplated: "",
    syncStatus: "pending",
    canonizedAt: null,
    createdAt: now,
    updatedAt: now,
    notionEditedAt: null,
    notionHash: null,
  };
  await commit([axiom.id], async () => {
    await db.axioms.add(axiom);
  });
  if (input.antithesisId) await linkAntithesis(axiom.id, input.antithesisId);
  return axiom;
}

/** Splits a quick capture into a title (first sentence or line) and a thesis (the whole text). */
export function splitCapture(text: string): { title: string; thesis: string } {
  const clean = text.trim().replace(/\s+\n/g, "\n");
  const firstLine = clean.split("\n")[0] ?? "";
  const sentence = firstLine.match(/^(.{8,90}?[.!?;:])(\s|$)/)?.[1] ?? firstLine;
  const title = sentence.length > 90 ? `${sentence.slice(0, 87).trimEnd()}…` : sentence;
  return { title: title.replace(/[.;:]$/, ""), thesis: clean };
}

export async function updateDraft(
  id: string,
  patch: Partial<Pick<Axiom, "title" | "thesis" | "bodyMarkdown" | "pillarId">>,
): Promise<void> {
  const next: Partial<Axiom> = { ...patch };
  if (patch.pillarId) next.realm = PILLAR_BY_ID[patch.pillarId].realm;
  await patchAxiom(id, next);
}

/** Swipe right in the Daily Deal. */
export async function affirmAxiom(id: string): Promise<void> {
  await commit([id], async () => {
    const axiom = await db.axioms.get(id);
    if (!axiom) return;
    const now = nowISO();
    await db.axioms.update(id, {
      resonance: axiom.resonance + 1,
      lastContemplated: now,
      updatedAt: now,
      syncStatus: "pending",
    });
  });
}

/** "Question Dogma": the law returns to the Crucible to be reforged. Its first canonization date is kept. */
export async function questionDogma(id: string): Promise<void> {
  const now = nowISO();
  await patchAxiom(id, { stage: "Crucible", lastContemplated: now });
}

/** Entering the trials places a Spark (or a Canon law being reforged) in the Crucible. */
export async function beginTrial(id: string): Promise<void> {
  const axiom = await db.axioms.get(id);
  if (!axiom || axiom.stage === "Crucible") return;
  await patchAxiom(id, { stage: "Crucible" });
}

export async function appendDialectic(id: string, dialectic: Dialectic): Promise<void> {
  await commit([id], async () => {
    const axiom = await db.axioms.get(id);
    if (!axiom) return;
    await db.axioms.update(id, {
      dialectics: [...axiom.dialectics, { question: dialectic.question.trim(), answer: dialectic.answer.trim() }],
      updatedAt: nowISO(),
      syncStatus: "pending",
    });
  });
}

/** The Canonization Ceremony. Returns the axiom as etched. */
export async function canonize(id: string, finalThesis: string, finalTitle?: string): Promise<Axiom | undefined> {
  let etched: Axiom | undefined;
  await commit([id], async () => {
    const axiom = await db.axioms.get(id);
    if (!axiom) return;
    const now = nowISO();
    const wasCanonBefore = Boolean(axiom.canonizedAt);
    const patch: Partial<Axiom> = {
      stage: wasCanonBefore ? "Reforged" : "Canon",
      thesis: finalThesis.trim() || axiom.thesis,
      title: finalTitle?.trim() || axiom.title,
      canonizedAt: axiom.canonizedAt ?? now,
      lastContemplated: now,
      resonance: axiom.resonance + 1,
      updatedAt: now,
      syncStatus: "pending",
    };
    await db.axioms.update(id, patch);
    etched = { ...axiom, ...patch };
  });
  return etched;
}

/** Links two axioms as each other's antithesis (symmetric), unlinking any previous partners. */
export async function linkAntithesis(id: string, partnerId: string | null): Promise<void> {
  const touched = new Set<string>([id]);
  await db.transaction("rw", db.axioms, db.syncQueue, async () => {
    const axiom = await db.axioms.get(id);
    if (!axiom) return;
    const now = nowISO();

    const unlink = async (otherId: string | null) => {
      if (!otherId) return;
      const other = await db.axioms.get(otherId);
      if (other && other.antithesisId === id) {
        await db.axioms.update(otherId, { antithesisId: null, updatedAt: now, syncStatus: "pending" });
        touched.add(otherId);
      }
    };

    await unlink(axiom.antithesisId);

    if (partnerId) {
      const partner = await db.axioms.get(partnerId);
      if (partner) {
        if (partner.antithesisId && partner.antithesisId !== id) {
          const previous = await db.axioms.get(partner.antithesisId);
          if (previous?.antithesisId === partnerId) {
            await db.axioms.update(previous.id, { antithesisId: null, updatedAt: now, syncStatus: "pending" });
            touched.add(previous.id);
          }
        }
        await db.axioms.update(partnerId, { antithesisId: id, updatedAt: now, syncStatus: "pending" });
        touched.add(partnerId);
      }
    }

    await db.axioms.update(id, { antithesisId: partnerId, updatedAt: now, syncStatus: "pending" });
    for (const touchedId of touched) await enqueueInTx(touchedId);
  });
  syncEngine.schedule();
}
