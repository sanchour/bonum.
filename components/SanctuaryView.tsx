"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { Anvil, BookOpen, Plus, Sunrise, Sunset } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { affirmAxiom, createAxiom, questionDogma, splitCapture } from "@/lib/actions";
import { canonOrder, db, isCanon } from "@/lib/db";
import { useAxioms, useNow, usePillarStats, useRituals } from "@/lib/hooks";
import { computeStreak, currentOffice, ensureRitual, extendRitual, recordOutcome, ritualIdFor } from "@/lib/liturgy";
import { PILLARS, PILLAR_BY_ID } from "@/lib/pillars";
import { springs } from "@/lib/theme";
import { showToast } from "@/lib/toast";
import type { Axiom, PillarId, RitualCard } from "@/lib/types";
import { isTypingTarget, liturgicalDate, toRoman } from "@/lib/util";
import { useBonumNav } from "./BonumContext";
import { CathedralSigil } from "./CathedralSigil";
import { DealtCard, DeckHint, type DeckCardActions } from "./DailyDeck";
import { GoldBurst } from "./GoldBurst";
import { PillarGlyph } from "./PillarGlyph";

export function SanctuaryView() {
  const nav = useBonumNav();
  const axioms = useAxioms();
  const stats = usePillarStats(axioms);
  const rituals = useRituals();
  const now = useNow(30_000);
  const office = currentOffice(now);
  const ritualId = ritualIdFor(now);
  const ritual = useLiveQuery(async () => (await db.rituals.get(ritualId)) ?? null, [ritualId]);

  const [pulse, setPulse] = useState<{ pillarId: PillarId; key: number } | null>(null);
  const [burst, setBurst] = useState<number | null>(null);
  const [selectedPillar, setSelectedPillar] = useState<PillarId | null>(null);
  const actionRegistry = useRef(new Map<string, { current: DeckCardActions }>()).current;
  const topCardKey = useRef<string | null>(null);

  // Deal the office's deck the first time it is opened.
  useEffect(() => {
    if (axioms && ritual === null) void ensureRitual(now);
  }, [axioms, ritual, now]);

  const axiomById = useMemo(() => new Map((axioms ?? []).map((axiom) => [axiom.id, axiom])), [axioms]);

  const lawNumerals = useMemo(() => {
    const numerals = new Map<string, string>();
    for (const pillar of PILLARS) {
      (axioms ?? [])
        .filter((axiom) => axiom.pillarId === pillar.id && isCanon(axiom))
        .sort(canonOrder)
        .forEach((axiom, index) => numerals.set(axiom.id, toRoman(index + 1)));
    }
    return numerals;
  }, [axioms]);

  const remaining = useMemo<RitualCard[]>(() => {
    if (!ritual) return [];
    return ritual.cards.filter(
      (card) => !ritual.outcomes[card.key] && (card.kind === "void" || axiomById.has(card.axiomId)),
    );
  }, [ritual, axiomById]);

  topCardKey.current = remaining[0]?.key ?? null;

  const streak = useMemo(() => (rituals ? computeStreak(rituals) : 0), [rituals]);
  const totals = useMemo(() => {
    const canon = (axioms ?? []).filter(isCanon);
    return { laws: canon.length, resonance: canon.reduce((sum, axiom) => sum + axiom.resonance, 0) };
  }, [axioms]);

  /* ── card handlers ── */

  const handleAffirm = useCallback(
    (card: RitualCard, axiom: Axiom) => {
      if (!ritual) return;
      const key = Date.now();
      setBurst(key);
      setPulse({ pillarId: axiom.pillarId, key });
      void recordOutcome(ritual.id, card.key, "affirmed");
      void affirmAxiom(axiom.id);
    },
    [ritual],
  );

  const handleQuestion = useCallback(
    (card: RitualCard, axiom: Axiom) => {
      if (!ritual) return;
      void recordOutcome(ritual.id, card.key, "questioned");
      void questionDogma(axiom.id);
      showToast({
        title: `“${axiom.title}” returns to the Crucible`,
        detail: "A law that cannot survive doubt was never law.",
        tone: "crimson",
        action: { label: "Reforge", run: () => nav.openForge({ axiomId: axiom.id }) },
        durationMs: 6500,
      });
    },
    [nav, ritual],
  );

  const handleDefer = useCallback(
    (card: RitualCard) => {
      if (!ritual) return;
      void recordOutcome(ritual.id, card.key, "deferred");
    },
    [ritual],
  );

  const handleKindle = useCallback(
    async (card: RitualCard, text: string) => {
      if (!ritual || card.kind !== "void") return;
      void recordOutcome(ritual.id, card.key, "kindled");
      const { title, thesis } = splitCapture(text);
      const spark = await createAxiom({ title, thesis, pillarId: card.pillarId });
      const key = Date.now();
      setPulse({ pillarId: card.pillarId, key });
      showToast({
        title: `A Spark is kindled in ${PILLAR_BY_ID[card.pillarId].name}`,
        detail: title,
        tone: "gold",
        action: { label: "Forge it", run: () => nav.openForge({ axiomId: spark.id }) },
        durationMs: 6000,
      });
    },
    [nav, ritual],
  );

  const handleForge = useCallback(
    (card: RitualCard, text: string) => {
      if (!ritual || card.kind !== "void") return;
      void recordOutcome(ritual.id, card.key, "forged");
      nav.openForge({ pillarId: card.pillarId, seedText: text.trim() || undefined });
    },
    [nav, ritual],
  );

  // Desktop keyboard liturgy: ← set aside, → affirm/kindle, ↓ question, ↑ forge.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      const top = topCardKey.current ? actionRegistry.get(topCardKey.current) : undefined;
      if (isTypingTarget(event.target) || !top) return;
      const map: Record<string, keyof DeckCardActions> = {
        ArrowRight: "right",
        ArrowLeft: "left",
        ArrowDown: "down",
        ArrowUp: "up",
      };
      const action = map[event.key];
      if (!action) return;
      event.preventDefault();
      top.current[action]();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [actionRegistry]);

  const drawAnother = async () => {
    if (!ritual) return;
    const added = await extendRitual(ritual.id);
    if (!added) showToast({ title: "Every law of the Canon has been contemplated in this office." });
  };

  const OfficeIcon = office === "Matins" ? Sunrise : Sunset;
  const selected = selectedPillar ? PILLAR_BY_ID[selectedPillar] : null;
  const selectedStat = selectedPillar && stats ? stats[selectedPillar] : null;
  const dealtCount = ritual?.cards.length ?? 3;
  const doneCount = ritual ? ritual.cards.filter((card) => ritual.outcomes[card.key]).length : 0;

  return (
    <div className="mb-safe-tabbar pt-safe mx-auto max-w-6xl px-5 md:mb-0 md:px-10 md:pb-16">
      {/* ── Office header ── */}
      <header className="flex flex-wrap items-end justify-between gap-4 pt-14 md:pt-12">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.22em] text-parchment">
            <OfficeIcon size={14} className="text-gold" strokeWidth={1.6} />
            <span>{liturgicalDate(now)}</span>
          </div>
          <h1 className="mt-2 font-serif text-[2.75rem] font-medium leading-none text-vellum md:text-[3.5rem]">
            {office === "Matins" ? "Matins" : "Vespers"}
          </h1>
          <p className="mt-2 font-serif text-lg italic text-parchment">
            {office === "Matins" ? "The morning office: what will you carry into the day?" : "The evening office: what held, and what cracked?"}
          </p>
        </div>
        <div className="flex items-center gap-6 font-mono text-[11px] tracking-[0.18em] text-parchment">
          <div className="text-right">
            <div className="text-[10px]">DIES</div>
            <div className="text-xl text-gold tabular">{streak > 0 ? toRoman(streak) : "—"}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px]">LEGES</div>
            <div className="text-xl text-vellum tabular">{toRoman(totals.laws)}</div>
          </div>
        </div>
      </header>

      <div className="hairline mt-7" />

      <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-14">
        {/* ── The Cathedral Sigil ── */}
        <section aria-labelledby="sigil-heading" className="flex flex-col items-center">
          <h2 id="sigil-heading" className="sr-only">
            Cathedral Sigil
          </h2>
          <div className="w-full max-w-[440px]">
            {stats ? (
              <CathedralSigil
                stats={stats}
                pulse={pulse}
                selectedPillarId={selectedPillar}
                onSelectPillar={(id) => setSelectedPillar((current) => (current === id ? null : id))}
              />
            ) : (
              <div className="aspect-square w-full" />
            )}
          </div>

          <div className="mt-4 min-h-[92px] w-full max-w-[440px] text-center">
            <AnimatePresence mode="wait" initial={false}>
              {selected && selectedStat ? (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={springs.snappy}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="flex items-center gap-2 text-gold">
                    <PillarGlyph pillarId={selected.id} size={15} />
                    <span className="font-serif text-2xl text-vellum">{selected.name}</span>
                    <span className="small-caps text-[12px] text-parchment">{selected.translation}</span>
                  </div>
                  <p className="font-mono text-[11px] tracking-[0.14em] text-parchment">
                    {toRoman(selectedStat.canon)} LEGES · {selectedStat.resonance} RESONANCE · TIER {toRoman(selectedStat.tier)}
                  </p>
                  <button
                    type="button"
                    onClick={() => nav.openTome(selected.id)}
                    className="mt-1 flex items-center gap-1.5 text-[13px] text-gold hover:text-gold-bright"
                  >
                    <BookOpen size={14} /> Open the Tome
                  </button>
                </motion.div>
              ) : (
                <motion.p
                  key="summary"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mx-auto max-w-sm font-serif text-[1.05rem] italic leading-relaxed text-parchment"
                >
                  Six petals for six books. Each one fills with gold as its laws are etched and affirmed.
                  <span className="mt-1 block font-mono text-[10.5px] not-italic tracking-[0.16em] text-parchment/70">
                    TAP A PETAL TO READ ITS LIGHT
                  </span>
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ── The Daily Deal ── */}
        <section aria-labelledby="deal-heading" className="w-full">
          <div className="mb-5 flex items-center justify-between">
            <h2 id="deal-heading" className="small-caps text-[14px] text-vellum/90">
              The Daily Deal
            </h2>
            <div className="flex items-center gap-1.5" aria-label={`${doneCount} of ${dealtCount} cards contemplated`}>
              {Array.from({ length: dealtCount }, (_, i) => (
                <span
                  key={i}
                  className={`h-1 w-5 rounded-full transition-colors duration-500 ${
                    i < doneCount ? "bg-gold" : "bg-white/10"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="relative mx-auto h-[480px] w-full max-w-[400px]">
            <GoldBurst burstKey={burst} />
            <AnimatePresence>
              {remaining.slice(0, 3).map((card, depth) => {
                const axiom = card.kind === "canon" ? axiomById.get(card.axiomId) : undefined;
                return (
                  <DealtCard
                    key={card.key}
                    card={card}
                    axiom={axiom}
                    lawNumeral={axiom ? lawNumerals.get(axiom.id) : undefined}
                    depth={depth}
                    registry={actionRegistry}
                    onAffirm={() => axiom && handleAffirm(card, axiom)}
                    onQuestion={() => axiom && handleQuestion(card, axiom)}
                    onDefer={() => handleDefer(card)}
                    onKindle={(text) => void handleKindle(card, text)}
                    onForge={(text) => handleForge(card, text)}
                    onEmptyKindle={() =>
                      showToast({ title: "Write a first line to kindle it, or take the prompt to the Forge." })
                    }
                  />
                );
              })}
            </AnimatePresence>

            <AnimatePresence>
              {ritual && remaining.length === 0 && (
                <motion.div
                  key="kept"
                  initial={{ opacity: 0, scale: 0.94, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ ...springs.ceremony, delay: 0.25 }}
                  className="stone-panel absolute inset-0 flex flex-col items-center justify-center rounded-[22px] px-8 text-center"
                >
                  <OfficeIcon size={28} strokeWidth={1.2} className="text-gold" />
                  <h3 className="mt-5 font-serif text-[2rem] leading-tight text-vellum">The office is kept.</h3>
                  <p className="mt-3 font-serif text-lg italic text-parchment">
                    {office === "Matins"
                      ? "Go into the day. Vespers opens at three in the afternoon."
                      : "Rest now. Matins opens with the morning."}
                  </p>
                  {streak > 0 && (
                    <p className="mt-5 font-mono text-[11px] tracking-[0.2em] text-gold">
                      DIES {toRoman(streak)} OF THE RULE
                    </p>
                  )}
                  <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => void drawAnother()}
                      className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] text-vellum ring-1 ring-white/15 hover:ring-gold/40"
                    >
                      <Plus size={14} /> Draw another law
                    </button>
                    <button
                      type="button"
                      onClick={() => nav.openForge()}
                      className="flex items-center justify-center gap-2 rounded-xl bg-gold/10 px-4 py-2.5 text-[13px] text-gold ring-1 ring-gold/30 hover:bg-gold/15"
                    >
                      <Anvil size={14} /> Enter the Forge
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <DeckHint />
        </section>
      </div>
    </div>
  );
}
