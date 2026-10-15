"use client";

import { Anvil, ChevronLeft, MessagesSquare, Repeat2, Sparkles } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion, useDragControls } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { canonOrder, isCanon, isUntested } from "@/lib/db";
import { useAxioms } from "@/lib/hooks";
import { PILLARS, PILLAR_BY_ID } from "@/lib/pillars";
import { realmColor, realmMeta, springs, stageMeta, withAlpha } from "@/lib/theme";
import type { Axiom, Pillar, PillarId, Realm } from "@/lib/types";
import { relativeTime, toRoman } from "@/lib/util";
import { useBonumNav } from "./BonumContext";
import { PillarGlyph } from "./PillarGlyph";
import { Scripture } from "./Scripture";

type RealmFilter = Realm | "All";
const REALM_FILTERS: readonly RealmFilter[] = ["All", "Social", "Self", "Mundo"];
const REALM_ORDER: readonly Realm[] = ["Social", "Self", "Mundo"];
/** The two volumes whose laws are written as mirror images of each other. */
const ANTITHETICAL: ReadonlySet<PillarId> = new Set(["bonus-affectus", "malum-adfectus"]);

interface PillarCounts {
  canon: number;
  untested: number;
}

/** Requests are consumed once, so returning to the shelf later does not reopen an old tome. */
let handledTomeNonce = 0;

export function TomesView() {
  const nav = useBonumNav();
  const axioms = useAxioms();
  const [filter, setFilter] = useState<RealmFilter>("All");
  const [openPillar, setOpenPillar] = useState<PillarId | null>(null);
  const [focusAxiom, setFocusAxiom] = useState<string | null>(null);

  // Respond to "open this tome" requests from elsewhere (sigil, forge, palette).
  useEffect(() => {
    const request = nav.tomeRequest;
    if (!request || request.nonce === handledTomeNonce) return;
    handledTomeNonce = request.nonce;
    setOpenPillar(request.pillarId);
    setFocusAxiom(request.axiomId ?? null);
  }, [nav.tomeRequest]);

  useEffect(() => {
    if (!openPillar) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenPillar(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPillar]);

  const counts = useMemo(() => {
    const result = Object.fromEntries(PILLARS.map((p) => [p.id, { canon: 0, untested: 0 }])) as Record<
      PillarId,
      PillarCounts
    >;
    for (const axiom of axioms ?? []) {
      if (isCanon(axiom)) result[axiom.pillarId].canon += 1;
      else result[axiom.pillarId].untested += 1;
    }
    return result;
  }, [axioms]);

  const visible = filter === "All" ? PILLARS : PILLARS.filter((pillar) => pillar.realm === filter);

  return (
    <LayoutGroup id="tomes">
      <div className="mb-safe-tabbar pt-safe mx-auto max-w-6xl px-5 md:mb-0 md:px-10 md:pb-16">
        <header className="flex flex-wrap items-end justify-between gap-5 pt-14 md:pt-12">
          <div>
            <p className="font-mono text-[11px] tracking-[0.22em] text-parchment">BIBLIOTHECA</p>
            <h1 className="mt-2 font-serif text-[2.75rem] font-medium leading-none md:text-[3.5rem]">The Six Tomes</h1>
            <p className="mt-2 max-w-lg font-serif text-lg italic text-parchment">
              Each volume holds the laws you have tested and kept. Open one to read its canon.
            </p>
          </div>

          <div role="tablist" aria-label="Filter by realm" className="flex rounded-full bg-stone p-1 ring-1 ring-white/[0.06]">
            {REALM_FILTERS.map((option) => {
              const active = option === filter;
              return (
                <button
                  key={option}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => setFilter(option)}
                  className={`relative rounded-full px-3.5 py-1.5 text-[12.5px] transition-colors ${
                    active ? "text-obsidian" : "text-parchment hover:text-vellum"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="realm-filter"
                      transition={springs.snappy}
                      className="absolute inset-0 rounded-full"
                      style={{ background: option === "All" ? "var(--color-gold)" : realmColor(option as Realm) }}
                    />
                  )}
                  <span className={`relative ${active && option !== "All" ? "text-vellum" : ""}`}>{option}</span>
                </button>
              );
            })}
          </div>
        </header>

        <div className="hairline mt-7" />

        {filter === "All" ? (
          REALM_ORDER.map((realm) => (
            <section key={realm} className="mt-10" aria-labelledby={`realm-${realm}`}>
              <div className="mb-5 flex items-baseline gap-3">
                <span className="size-2 rounded-full" style={{ background: realmColor(realm) }} />
                <h2 id={`realm-${realm}`} className="small-caps text-[14px] text-vellum/90">
                  {realmMeta[realm].label}
                </h2>
                <span className="font-serif text-[15px] italic text-parchment">{realmMeta[realm].gloss}</span>
              </div>
              <TomeGrid
                pillars={PILLARS.filter((pillar) => pillar.realm === realm)}
                counts={counts}
                openPillar={openPillar}
                onOpen={(id) => {
                  setFocusAxiom(null);
                  setOpenPillar(id);
                }}
              />
            </section>
          ))
        ) : (
          <div className="mt-10">
            <TomeGrid
              pillars={visible}
              counts={counts}
              openPillar={openPillar}
              onOpen={(id) => {
                setFocusAxiom(null);
                setOpenPillar(id);
              }}
            />
          </div>
        )}
      </div>

      <ReaderPortal>
        <AnimatePresence>
          {openPillar && (
            <TomeReader
              key={openPillar}
              pillar={PILLAR_BY_ID[openPillar]}
              axioms={axioms ?? []}
              focusAxiomId={focusAxiom}
              onClose={() => setOpenPillar(null)}
            />
          )}
        </AnimatePresence>
      </ReaderPortal>
    </LayoutGroup>
  );
}

function ReaderPortal({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => setTarget(document.body), []);
  return target ? createPortal(children, target) : null;
}

/* ═══════════════════════════════ The shelf ═══════════════════════════════ */

function TomeGrid({
  pillars,
  counts,
  openPillar,
  onOpen,
}: {
  pillars: readonly Pillar[];
  counts: Record<PillarId, PillarCounts>;
  openPillar: PillarId | null;
  onOpen: (id: PillarId) => void;
}) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
      <AnimatePresence mode="popLayout" initial={false}>
        {pillars.map((pillar) => (
          <motion.li
            key={pillar.id}
            layout="position"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={springs.card}
            style={{ perspective: 1000 }}
          >
            <Tome pillar={pillar} counts={counts[pillar.id]} hidden={openPillar === pillar.id} onOpen={() => onOpen(pillar.id)} />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}

function Tome({
  pillar,
  counts,
  hidden,
  onOpen,
}: {
  pillar: Pillar;
  counts: PillarCounts;
  hidden: boolean;
  onOpen: () => void;
}) {
  const accent = realmColor(pillar.realm);
  return (
    <motion.button
      type="button"
      layoutId={`tome-${pillar.id}`}
      onClick={onOpen}
      whileHover={{ y: -6, rotateX: 5 }}
      whileTap={{ scale: 0.97 }}
      transition={springs.tome}
      aria-label={`Open ${pillar.name}, ${pillar.translation}. ${counts.canon} laws.`}
      className="group relative block aspect-[3/4] w-full overflow-hidden text-left"
      style={{
        borderRadius: 18,
        background: `linear-gradient(160deg, ${withAlpha(accent, 0.6)} 0%, #17130f 52%, #0d0c0f 100%)`,
        boxShadow: "0 30px 50px -28px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.06)",
        visibility: hidden ? "hidden" : "visible",
      }}
    >
      {/* spine */}
      <span className="absolute inset-y-0 left-0 w-3.5 bg-black/40">
        <span className="absolute inset-x-0 top-[14%] h-px bg-gold/50" />
        <span className="absolute inset-x-0 top-[16%] h-px bg-gold/30" />
        <span className="absolute inset-x-0 bottom-[16%] h-px bg-gold/30" />
        <span className="absolute inset-x-0 bottom-[14%] h-px bg-gold/50" />
      </span>
      {/* tooled borders */}
      <span className="absolute inset-y-2.5 left-6 right-2.5 rounded-[11px] ring-1 ring-gold/40" />
      <span className="absolute inset-y-4 left-[1.9rem] right-4 rounded-[8px] ring-1 ring-gold/15" />
      {/* sheen */}
      <span className="absolute -inset-x-10 -top-1/2 h-full rotate-12 bg-gradient-to-b from-white/[0.07] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <span className="relative flex h-full flex-col items-center px-6 pb-6 pl-9 pt-[18%] text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-black/30 text-gold ring-1 ring-gold/45 md:size-14">
          <PillarGlyph pillarId={pillar.id} size={20} strokeWidth={1.4} />
        </span>
        <span className="mt-5 font-serif text-[1.35rem] font-semibold leading-[1.05] text-vellum md:text-[1.6rem]">
          {pillar.name}
        </span>
        <span className="small-caps mt-2 text-[11px] text-gold/80">{pillar.translation}</span>
        <span className="mt-auto flex w-full justify-between font-mono text-[9.5px] tracking-[0.14em] text-parchment">
          <span>
            LEGES <span className="text-gold">{counts.canon ? toRoman(counts.canon) : "—"}</span>
          </span>
          <span>{counts.untested ? `${counts.untested} ✦` : ""}</span>
        </span>
      </span>
    </motion.button>
  );
}

/* ═══════════════════════════════ The reader ═══════════════════════════════ */

function TomeReader({
  pillar,
  axioms,
  focusAxiomId,
  onClose,
}: {
  pillar: Pillar;
  axioms: Axiom[];
  focusAxiomId: string | null;
  onClose: () => void;
}) {
  const nav = useBonumNav();
  const dragControls = useDragControls();
  const accent = realmColor(pillar.realm);
  const [tab, setTab] = useState<"canon" | "sparks">("canon");
  const [prefaceOpen, setPrefaceOpen] = useState(false);

  const byId = useMemo(() => new Map(axioms.map((axiom) => [axiom.id, axiom])), [axioms]);
  const canon = useMemo(
    () => axioms.filter((axiom) => axiom.pillarId === pillar.id && isCanon(axiom)).sort(canonOrder),
    [axioms, pillar.id],
  );
  const untested = useMemo(
    () =>
      axioms
        .filter((axiom) => axiom.pillarId === pillar.id && isUntested(axiom))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [axioms, pillar.id],
  );

  // Numerals for every canon law in every pillar, so an antithesis shows its own "Lex".
  const numerals = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of PILLARS) {
      axioms
        .filter((axiom) => axiom.pillarId === p.id && isCanon(axiom))
        .sort(canonOrder)
        .forEach((axiom, index) => map.set(axiom.id, toRoman(index + 1)));
    }
    return map;
  }, [axioms]);

  useEffect(() => {
    if (focusAxiomId && untested.some((axiom) => axiom.id === focusAxiomId)) setTab("sparks");
  }, [focusAxiomId, untested]);

  const preface = pillar.description.split("\n\n");
  const list = tab === "canon" ? canon : untested;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`${pillar.name} — Tome Reader`}>
      <motion.div
        className="absolute inset-0 bg-obsidian/80 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
      />

      <motion.div
        layoutId={`tome-${pillar.id}`}
        transition={springs.tome}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.7 }}
        dragSnapToOrigin
        onDragEnd={(_, info) => {
          if (info.offset.y > 140 || info.velocity.y > 800) onClose();
        }}
        className="absolute inset-x-0 bottom-0 top-[max(env(safe-area-inset-top),14px)] flex flex-col overflow-hidden bg-stone md:inset-x-8 md:inset-y-6 md:mx-auto md:max-w-[900px]"
        style={{ borderRadius: 24, boxShadow: `0 40px 120px -30px rgba(0,0,0,0.95), inset 0 0 0 1px ${withAlpha("#C5A059", 0.22)}` }}
      >
        {/* realm wash */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-72"
          style={{ background: `radial-gradient(120% 100% at 50% 0%, ${withAlpha(accent, 0.28)}, transparent 70%)` }}
        />

        <motion.div
          className="relative flex min-h-0 flex-1 flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.16, duration: 0.3 } }}
          exit={{ opacity: 0, transition: { duration: 0.12 } }}
        >
          {/* header & drag handle */}
          <div
            className="relative shrink-0 touch-none px-5 pb-4 pt-3 md:px-10 md:pt-6"
            onPointerDown={(event) => {
              if ((event.target as Element).closest("button")) return;
              dragControls.start(event);
            }}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/15 md:hidden" />
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="-ml-2 flex items-center gap-1 rounded-lg px-2 py-1.5 text-[13px] text-parchment hover:text-vellum"
              >
                <ChevronLeft size={16} /> Shelf
              </button>
              <span
                className="rounded-full px-2.5 py-1 font-mono text-[10px] tracking-[0.18em] text-vellum/90"
                style={{ background: withAlpha(accent, 0.35) }}
              >
                {pillar.realm.toUpperCase()}
              </span>
            </div>

            <div className="mt-4 flex items-start gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-black/30 text-gold ring-1 ring-gold/45">
                <PillarGlyph pillarId={pillar.id} size={22} strokeWidth={1.3} />
              </span>
              <div className="min-w-0">
                <h2 className="font-serif text-[2.2rem] font-semibold leading-none text-vellum md:text-[2.8rem]">
                  {pillar.name}
                </h2>
                <p className="small-caps mt-1.5 text-[12px] text-gold/85">{pillar.translation}</p>
              </div>
            </div>
            <p className="mt-4 font-serif text-[1.05rem] italic text-parchment">{pillar.epigraph}</p>
          </div>

          <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(env(safe-area-inset-bottom)+2rem)] md:px-10">
            {/* preface */}
            <section className="font-serif text-[1.08rem] leading-relaxed text-vellum/75">
              <p>{preface[0]}</p>
              <AnimatePresence initial={false}>
                {prefaceOpen &&
                  preface.slice(1).map((paragraph, i) => (
                    <motion.p
                      key={i}
                      className="mt-3"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
                      exit={{ opacity: 0 }}
                    >
                      {paragraph}
                    </motion.p>
                  ))}
              </AnimatePresence>
              {preface.length > 1 && (
                <button
                  type="button"
                  onClick={() => setPrefaceOpen((open) => !open)}
                  className="mt-2 font-sans text-[12.5px] text-gold hover:text-gold-bright"
                >
                  {prefaceOpen ? "Fold the preface" : "Read the full preface"}
                </button>
              )}
            </section>

            {/* canon / sparks toggle */}
            <div className="sticky top-0 z-10 -mx-5 mt-7 bg-stone/90 px-5 py-3 backdrop-blur-md md:-mx-10 md:px-10">
              <div role="tablist" className="flex w-fit rounded-full bg-obsidian/70 p-1 ring-1 ring-white/[0.06]">
                {(
                  [
                    ["canon", `Canon · ${canon.length}`],
                    ["sparks", `Sparks · ${untested.length}`],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    role="tab"
                    type="button"
                    aria-selected={tab === key}
                    onClick={() => setTab(key)}
                    className={`relative rounded-full px-4 py-1.5 text-[12.5px] transition-colors ${
                      tab === key ? "text-obsidian" : "text-parchment hover:text-vellum"
                    }`}
                  >
                    {tab === key && (
                      <motion.span
                        layoutId={`reader-tab-${pillar.id}`}
                        transition={springs.snappy}
                        className="absolute inset-0 rounded-full bg-gold"
                      />
                    )}
                    <span className="relative">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.ol
                key={tab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={springs.snappy}
                className="mt-4 space-y-3"
              >
                {list.length === 0 && (
                  <li className="rounded-2xl border border-dashed border-white/10 px-6 py-10 text-center font-serif text-lg italic text-parchment">
                    {tab === "canon"
                      ? "No law has yet been etched into this tome. Its pages wait."
                      : "No untested sparks. Capture one with the quill."}
                  </li>
                )}
                {list.map((axiom) => (
                  <LawEntry
                    key={axiom.id}
                    axiom={axiom}
                    numeral={numerals.get(axiom.id)}
                    antithesis={
                      ANTITHETICAL.has(pillar.id) && axiom.antithesisId ? (byId.get(axiom.antithesisId) ?? null) : null
                    }
                    antithesisNumeral={axiom.antithesisId ? numerals.get(axiom.antithesisId) : undefined}
                    focused={axiom.id === focusAxiomId}
                    onForge={() => nav.openForge({ axiomId: axiom.id })}
                  />
                ))}
              </motion.ol>
            </AnimatePresence>

            <button
              type="button"
              onClick={() => nav.openForge({ pillarId: pillar.id })}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border border-gold/25 bg-gold/[0.04] py-4 text-[13.5px] text-gold transition-colors hover:border-gold/45 hover:bg-gold/[0.08]"
            >
              <Anvil size={15} strokeWidth={1.6} /> Forge a new law for {pillar.name}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════ A law, and its antithesis ═══════════════════════════ */

function LawEntry({
  axiom,
  numeral,
  antithesis,
  antithesisNumeral,
  focused,
  onForge,
}: {
  axiom: Axiom;
  numeral?: string;
  antithesis: Axiom | null;
  antithesisNumeral?: string;
  focused: boolean;
  onForge: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const [open, setOpen] = useState(focused);
  const ref = useRef<HTMLLIElement>(null);
  const canon = isCanon(axiom);

  useEffect(() => {
    if (!focused) return;
    const timer = setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 520);
    return () => clearTimeout(timer);
  }, [focused]);

  return (
    <li ref={ref} style={{ perspective: 1600 }} className="list-none">
      <motion.div
        className="preserve-3d grid"
        initial={false}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={springs.card}
      >
        {/* ── front: the law ── */}
        <article
          className={`backface-hidden relative rounded-2xl px-4 py-5 [grid-area:1/1] md:px-6 ${
            canon ? "bg-obsidian/40" : "bg-vellum/[0.035]"
          } ${focused ? "ring-1 ring-gold/60" : "ring-1 ring-white/[0.04]"}`}
          style={{ pointerEvents: flipped ? "none" : "auto" }}
          aria-hidden={flipped}
        >
          {focused && (
            <motion.span
              className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-gold"
              initial={{ opacity: 0.9 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 2.4, delay: 0.6 }}
            />
          )}
          <div className="flex gap-4 md:gap-6">
            <div className="w-12 shrink-0 pt-1 text-right md:w-16">
              {canon ? (
                <span className="gold-text font-serif text-[1.9rem] font-semibold leading-none md:text-[2.3rem]">
                  {numeral}.
                </span>
              ) : (
                <span
                  className={`inline-block rounded-full px-2 py-0.5 font-mono text-[9px] tracking-[0.16em] ${
                    axiom.stage === "Crucible" ? "bg-[#B4543A]/20 text-[#E0927A]" : "bg-vellum/10 text-vellum/80"
                  }`}
                >
                  {axiom.stage.toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="small-caps text-[13px] text-gold/90">{axiom.title}</h3>
              <p
                className={`mt-2 font-serif leading-[1.45] text-vellum ${
                  canon ? "text-[1.3rem] md:text-[1.4rem]" : "text-[1.15rem] italic text-vellum/85"
                }`}
              >
                {axiom.thesis}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] tracking-[0.12em] text-parchment">
                {canon && (
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={11} className="text-gold" /> {axiom.resonance}
                  </span>
                )}
                {axiom.stage === "Reforged" && <span className="text-gold/80">✠ REFORGED</span>}
                <span>{canon ? `CONTEMPLATED ${relativeTime(axiom.lastContemplated).toUpperCase()}` : `NOTED ${relativeTime(axiom.createdAt).toUpperCase()}`}</span>
                {(axiom.dialectics.length > 0 || axiom.bodyMarkdown) && (
                  <button
                    type="button"
                    onClick={() => setOpen((value) => !value)}
                    className="flex items-center gap-1.5 text-parchment hover:text-vellum"
                  >
                    <MessagesSquare size={11} />
                    {open ? "FOLD" : axiom.dialectics.length ? `TRIALS · ${toRoman(axiom.dialectics.length)}` : "GLOSS"}
                  </button>
                )}
                {antithesis && (
                  <button
                    type="button"
                    onClick={() => setFlipped(true)}
                    className="flex items-center gap-1.5 text-gold hover:text-gold-bright"
                  >
                    <Repeat2 size={12} /> ANTITHESIS
                  </button>
                )}
                {!canon && (
                  <button type="button" onClick={onForge} className="flex items-center gap-1.5 text-gold hover:text-gold-bright">
                    <Anvil size={11} /> TEST IN THE FORGE
                  </button>
                )}
              </div>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                    transition={springs.snappy}
                    className="mt-4 space-y-4 border-t border-white/[0.06] pt-4"
                  >
                    {axiom.dialectics.map((dialectic, i) => (
                      <div key={i}>
                        <p className="font-mono text-[10px] tracking-[0.16em] text-gold/80">TRIAL {toRoman(i + 1)}</p>
                        <p className="mt-1 font-serif text-[1.02rem] italic text-parchment">{dialectic.question}</p>
                        <p className="mt-1.5 text-[14px] leading-relaxed text-vellum/85">{dialectic.answer}</p>
                      </div>
                    ))}
                    {axiom.bodyMarkdown && (
                      <Scripture markdown={axiom.bodyMarkdown} className="text-[14px] leading-relaxed text-vellum/75" />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </article>

        {/* ── back: the counter-principle ── */}
        {antithesis && (
          <article
            className="obsidian-card backface-hidden relative rounded-2xl px-4 py-5 [grid-area:1/1] md:px-6"
            style={{ transform: "rotateY(180deg)", pointerEvents: flipped ? "auto" : "none" }}
            aria-hidden={!flipped}
          >
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] text-gold">
              <PillarGlyph pillarId={antithesis.pillarId} size={13} />
              ANTITHESIS · {PILLAR_BY_ID[antithesis.pillarId].name.toUpperCase()}
              {antithesisNumeral && isCanon(antithesis) ? ` · LEX ${antithesisNumeral}` : ` · ${stageMeta[antithesis.stage].label.toUpperCase()}`}
            </div>
            <h3 className="mt-3 font-serif text-[1.45rem] font-semibold leading-tight text-vellum">{antithesis.title}</h3>
            <p className="mt-2 font-serif text-[1.2rem] italic leading-snug text-vellum/85">{antithesis.thesis}</p>
            <button
              type="button"
              onClick={() => setFlipped(false)}
              className="mt-4 flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] text-parchment hover:text-vellum"
            >
              <Repeat2 size={12} /> RETURN TO {axiom.title.toUpperCase()}
            </button>
          </article>
        )}
      </motion.div>
    </li>
  );
}
