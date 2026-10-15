import { db, isCanon } from "./db";
import { PILLARS } from "./pillars";
import { VOID_PROMPTS } from "./prompts";
import type { Axiom, CardOutcome, Office, PillarId, Ritual, RitualCard } from "./types";
import { hashString, localDateKey, nowISO, shiftDateKey } from "./util";

/** Matins from 03:00 to 14:59, Vespers from 15:00 until the small hours. */
export function currentOffice(date: Date = new Date()): Office {
  const hour = date.getHours();
  return hour >= 3 && hour < 15 ? "Matins" : "Vespers";
}

/** The liturgical day starts at 03:00, so a late Vespers still belongs to the evening it began in. */
export function liturgicalDayKey(date: Date = new Date()): string {
  const shifted = new Date(date.getTime());
  if (shifted.getHours() < 3) shifted.setDate(shifted.getDate() - 1);
  return localDateKey(shifted);
}

export function ritualIdFor(date: Date = new Date()): string {
  return `${liturgicalDayKey(date)}:${currentOffice(date)}`;
}

export interface PillarStat {
  pillarId: PillarId;
  canon: number;
  resonance: number;
  sparks: number;
  /** 0 → dormant, 5 → fully illuminated tracery. */
  tier: number;
  /** 0–1 progress toward the next tier, for the gold wash. */
  glow: number;
}

const TIER_THRESHOLDS = [0, 1, 3, 6, 10, 15] as const;

/** Illumination grows with canonized laws (weight 1) and accumulated resonance (weight ¼). */
export function computePillarStats(axioms: readonly Axiom[]): Record<PillarId, PillarStat> {
  const stats = Object.fromEntries(
    PILLARS.map((pillar) => [
      pillar.id,
      { pillarId: pillar.id, canon: 0, resonance: 0, sparks: 0, tier: 0, glow: 0 } satisfies PillarStat,
    ]),
  ) as Record<PillarId, PillarStat>;

  for (const axiom of axioms) {
    const stat = stats[axiom.pillarId];
    if (!stat) continue;
    if (isCanon(axiom)) {
      stat.canon += 1;
      stat.resonance += axiom.resonance;
    } else {
      stat.sparks += 1;
    }
  }

  for (const stat of Object.values(stats)) {
    const score = stat.canon + stat.resonance * 0.25;
    let tier = 0;
    for (let i = 1; i < TIER_THRESHOLDS.length; i++) {
      if (score >= TIER_THRESHOLDS[i]) tier = i;
    }
    stat.tier = tier;
    if (tier >= TIER_THRESHOLDS.length - 1) {
      stat.glow = 1;
    } else {
      const floor = TIER_THRESHOLDS[tier];
      const ceiling = TIER_THRESHOLDS[tier + 1];
      stat.glow = Math.min(1, Math.max(0, (score - floor) / (ceiling - floor)));
    }
  }

  return stats;
}

/** The pillars ordered from emptiest to fullest (fewest Canon laws first), ties broken by fewer sparks. */
function pillarsByVoid(axioms: readonly Axiom[]): PillarId[] {
  const stats = computePillarStats(axioms);
  return [...PILLARS]
    .sort((a, b) => {
      const sa = stats[a.id];
      const sb = stats[b.id];
      return sa.canon - sb.canon || sa.resonance - sb.resonance || sa.sparks - sb.sparks || a.order - b.order;
    })
    .map((pillar) => pillar.id);
}

/**
 * Deals (or returns the already-dealt) deck for the current office.
 * Two least-recently-contemplated Canon laws, then a Void Prompt for the emptiest pillar.
 * If the Canon is too young to supply two laws, extra Void cards fill the deck.
 */
export async function ensureRitual(date: Date = new Date()): Promise<Ritual> {
  const id = ritualIdFor(date);
  return db.transaction("rw", db.rituals, db.axioms, async () => {
    const existing = await db.rituals.get(id);
    if (existing) return existing;

    const axioms = await db.axioms.toArray();
    const canon = axioms
      .filter(isCanon)
      .sort((a, b) => (a.lastContemplated || "").localeCompare(b.lastContemplated || "") || b.resonance - a.resonance);

    const cards: RitualCard[] = canon
      .slice(0, 2)
      .map((axiom, index) => ({ key: `canon-${index}`, kind: "canon", axiomId: axiom.id }));

    const voidOrder = pillarsByVoid(axioms);
    let voidIndex = 0;
    while (cards.length < 3) {
      const pillarId = voidOrder[voidIndex % voidOrder.length];
      const prompts = VOID_PROMPTS[pillarId];
      cards.push({
        key: `void-${voidIndex}`,
        kind: "void",
        pillarId,
        promptIndex: hashString(`${id}:${pillarId}`) % prompts.length,
      });
      voidIndex += 1;
    }

    const ritual: Ritual = {
      id,
      date: liturgicalDayKey(date),
      office: currentOffice(date),
      cards,
      outcomes: {},
      createdAt: nowISO(),
      completedAt: null,
    };
    await db.rituals.add(ritual);
    return ritual;
  });
}

export async function recordOutcome(ritualId: string, cardKey: string, outcome: CardOutcome): Promise<void> {
  await db.transaction("rw", db.rituals, async () => {
    const ritual = await db.rituals.get(ritualId);
    if (!ritual) return;
    const outcomes = { ...ritual.outcomes, [cardKey]: outcome };
    const complete = ritual.cards.every((card) => outcomes[card.key]);
    await db.rituals.update(ritualId, {
      outcomes,
      // Once an office is kept it stays kept, even if extra cards are drawn afterwards.
      completedAt: ritual.completedAt ?? (complete ? nowISO() : null),
    });
  });
}

/** "Draw another law": appends the next least-recently-contemplated Canon law not yet in this office. */
export async function extendRitual(ritualId: string): Promise<boolean> {
  return db.transaction("rw", db.rituals, db.axioms, async () => {
    const ritual = await db.rituals.get(ritualId);
    if (!ritual) return false;
    const dealt = new Set(ritual.cards.flatMap((card) => (card.kind === "canon" ? [card.axiomId] : [])));
    const next = (await db.axioms.toArray())
      .filter((axiom) => isCanon(axiom) && !dealt.has(axiom.id))
      .sort((a, b) => (a.lastContemplated || "").localeCompare(b.lastContemplated || ""))[0];
    if (!next) return false;
    const card: RitualCard = { key: `canon-extra-${ritual.cards.length}`, kind: "canon", axiomId: next.id };
    await db.rituals.update(ritualId, { cards: [...ritual.cards, card] });
    return true;
  });
}

/** Consecutive liturgical days with at least one completed office, ending today (or yesterday). */
export function computeStreak(rituals: readonly Ritual[], today: string = liturgicalDayKey()): number {
  const days = new Set(rituals.filter((ritual) => ritual.completedAt).map((ritual) => ritual.date));
  let cursor = days.has(today) ? today : shiftDateKey(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }
  return streak;
}
