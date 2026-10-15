"use client";

import { ArrowUpRight, Check, Flame, MoveLeft, ScrollText, Sparkles } from "lucide-react";
import {
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { haptic } from "@/lib/haptics";
import { PILLAR_BY_ID } from "@/lib/pillars";
import { VOID_PROMPTS } from "@/lib/prompts";
import { realmColor, springs, withAlpha } from "@/lib/theme";
import type { Axiom, PillarId, RitualCard } from "@/lib/types";
import { relativeTime } from "@/lib/util";
import { PillarGlyph } from "./PillarGlyph";

const SWIPE_DISTANCE = 110;
const SWIPE_VELOCITY = 650;
const EXIT_EASE = [0.32, 0.72, 0, 1] as const;

export interface DeckCardActions {
  right: () => void;
  left: () => void;
  down: () => void;
  up: () => void;
}

export interface DealtCardProps {
  card: RitualCard;
  axiom?: Axiom;
  lawNumeral?: string;
  depth: number;
  onAffirm: () => void;
  onQuestion: () => void;
  onDefer: () => void;
  onKindle: (text: string) => void;
  onForge: (text: string) => void;
  onEmptyKindle: () => void;
  /** Keyboard bridge: the deck looks up the top card's actions by card key. */
  registry?: Map<string, { current: DeckCardActions }>;
}

function shouldIgnoreDrag(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest("textarea, input, button, a, [data-no-drag]"));
}

export function DealtCard({
  card,
  axiom,
  lawNumeral,
  depth,
  onAffirm,
  onQuestion,
  onDefer,
  onKindle,
  onForge,
  onEmptyKindle,
  registry,
}: DealtCardProps) {
  const isTop = depth === 0;
  const controls = useDragControls();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const flung = useRef(false);
  const [draft, setDraft] = useState("");

  // 3D tilt and swipe affordances, all derived from the drag position.
  const rotateY = useTransform(x, [-260, 260], [-18, 18]);
  const rotateX = useTransform(y, [-220, 220], [12, -12]);
  const rotateZ = useTransform(x, [-320, 320], [-9, 9]);
  const affirmOpacity = useTransform(x, [24, SWIPE_DISTANCE], [0, 1]);
  const deferOpacity = useTransform(x, [-SWIPE_DISTANCE, -24], [1, 0]);
  const glareX = useTransform(x, [-260, 260], [-120, 120]);
  const glareOpacity = useTransform(x, [-260, 0, 260], [0.32, 0, 0.32]);

  const fling = useCallback(
    (dir: "right" | "left" | "up" | "down", then: () => void, velocity = 0) => {
      if (flung.current) return;
      flung.current = true;
      const width = typeof window === "undefined" ? 800 : window.innerWidth;
      const height = typeof window === "undefined" ? 900 : window.innerHeight;
      const tween = { duration: 0.36, ease: EXIT_EASE, velocity };
      if (dir === "right" || dir === "left") {
        const sign = dir === "right" ? 1 : -1;
        void animate(x, sign * (width * 0.6 + 320), tween);
        void animate(y, y.get() + 30, tween);
      } else {
        const sign = dir === "down" ? 1 : -1;
        void animate(y, sign * (height * 0.55 + 240), tween);
        void animate(x, x.get() * 0.5, tween);
      }
      setTimeout(then, 230);
    },
    [x, y],
  );

  const settle = useCallback(() => {
    void animate(x, 0, springs.card);
    void animate(y, 0, springs.card);
  }, [x, y]);

  const kindle = useCallback(() => {
    if (!draft.trim()) {
      haptic("warn");
      void animate(x, [0, -14, 12, -8, 5, 0], { duration: 0.42 });
      onEmptyKindle();
      return;
    }
    haptic("affirm");
    fling("up", () => onKindle(draft));
  }, [draft, fling, onEmptyKindle, onKindle, x]);

  const actions: DeckCardActions = {
    right: () => {
      if (card.kind === "canon") {
        haptic("affirm");
        fling("right", onAffirm);
      } else kindle();
    },
    left: () => {
      haptic("tick");
      fling("left", onDefer);
    },
    down: () => {
      if (card.kind !== "canon") return;
      haptic("warn");
      fling("down", onQuestion);
    },
    up: () => {
      if (card.kind !== "void") return;
      fling("up", () => onForge(draft));
    },
  };

  const latestActions = useRef(actions);
  latestActions.current = actions;
  useEffect(() => {
    if (!registry) return;
    registry.set(card.key, latestActions);
    return () => {
      if (registry.get(card.key) === latestActions) registry.delete(card.key);
    };
  }, [registry, card.key]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const { offset, velocity } = info;
    if (offset.x > SWIPE_DISTANCE || velocity.x > SWIPE_VELOCITY) {
      if (card.kind === "canon") {
        haptic("affirm");
        fling("right", onAffirm, velocity.x);
      } else if (draft.trim()) {
        haptic("affirm");
        fling("right", () => onKindle(draft), velocity.x);
      } else {
        settle();
        onEmptyKindle();
      }
      return;
    }
    if (offset.x < -SWIPE_DISTANCE || velocity.x < -SWIPE_VELOCITY) {
      haptic("tick");
      fling("left", onDefer, velocity.x);
      return;
    }
    settle();
  };

  // Reset if this card ever returns to the top unflung (e.g. the deck re-renders).
  useEffect(() => {
    if (isTop && !flung.current) settle();
  }, [isTop, settle]);

  const pillarId = card.kind === "canon" ? axiom?.pillarId : card.pillarId;
  const pillar = pillarId ? PILLAR_BY_ID[pillarId] : undefined;

  return (
    <motion.div
      className="absolute inset-0 gpu"
      style={{ zIndex: 20 - depth, perspective: 1100 }}
      initial={{ opacity: 0, y: 60, scale: 0.92 }}
      animate={{
        opacity: depth > 2 ? 0 : 1 - depth * 0.18,
        y: depth * 16,
        scale: 1 - depth * 0.055,
      }}
      exit={{ opacity: 0, transition: { duration: 0.18 } }}
      transition={springs.card}
    >
      <motion.article
        drag={isTop}
        dragControls={controls}
        dragListener={false}
        dragMomentum={false}
        dragElastic={0.85}
        onDragEnd={handleDragEnd}
        onPointerDown={(event) => {
          if (!isTop || shouldIgnoreDrag(event.target)) return;
          controls.start(event);
        }}
        style={{ x, y, rotateX, rotateY, rotate: rotateZ, touchAction: isTop ? "pan-y" : "auto" }}
        className={`gpu relative flex h-full w-full cursor-grab flex-col overflow-hidden rounded-[22px] active:cursor-grabbing ${
          card.kind === "canon" ? "obsidian-card" : "parchment"
        } ${isTop ? "" : "pointer-events-none"}`}
        aria-hidden={!isTop}
      >
        {/* moving glare */}
        <motion.div
          className="pointer-events-none absolute -inset-1/2"
          style={{
            x: glareX,
            opacity: glareOpacity,
            background:
              card.kind === "canon"
                ? "radial-gradient(closest-side, rgba(236,211,154,0.35), transparent)"
                : "radial-gradient(closest-side, rgba(255,255,255,0.6), transparent)",
          }}
        />

        {card.kind === "canon" && axiom ? (
          <CanonFace axiom={axiom} lawNumeral={lawNumeral} actions={actions} />
        ) : card.kind === "void" && pillar ? (
          <VoidFace
            pillarId={card.pillarId}
            prompt={VOID_PROMPTS[card.pillarId][card.promptIndex % VOID_PROMPTS[card.pillarId].length]}
            draft={draft}
            onDraft={setDraft}
            onKindle={kindle}
            onForge={actions.up}
          />
        ) : null}

        {/* swipe stamps */}
        <motion.div
          style={{ opacity: affirmOpacity }}
          className="pointer-events-none absolute left-6 top-6 -rotate-12 rounded-md border-2 border-gold px-3 py-1 font-mono text-xs font-semibold tracking-[0.3em] text-gold"
        >
          {card.kind === "canon" ? "AFFIRM" : "KINDLE"}
        </motion.div>
        <motion.div
          style={{ opacity: deferOpacity }}
          className={`pointer-events-none absolute right-6 top-6 rotate-12 rounded-md border-2 px-3 py-1 font-mono text-xs font-semibold tracking-[0.3em] ${
            card.kind === "canon" ? "border-parchment text-parchment" : "border-ink/50 text-ink/60"
          }`}
        >
          SET ASIDE
        </motion.div>
      </motion.article>
    </motion.div>
  );
}

function CanonFace({ axiom, lawNumeral, actions }: { axiom: Axiom; lawNumeral?: string; actions: DeckCardActions }) {
  const pillar = PILLAR_BY_ID[axiom.pillarId];
  const accent = realmColor(pillar.realm);
  return (
    <div className="relative flex h-full flex-col p-6 sm:p-7">
      <header className="flex items-center gap-2.5 text-gold">
        <span
          className="flex size-8 items-center justify-center rounded-full ring-1 ring-gold/40"
          style={{ background: withAlpha(accent, 0.18) }}
        >
          <PillarGlyph pillarId={pillar.id} size={15} />
        </span>
        <div className="flex flex-col leading-tight">
          <span className="small-caps text-[13px] text-vellum/90">{pillar.name}</span>
          <span className="font-mono text-[10px] tracking-[0.2em] text-parchment">
            LEX {lawNumeral ?? "·"} {axiom.stage === "Reforged" && "· REFORGED"}
          </span>
        </div>
        <span className="ml-auto font-mono text-[10px] tracking-[0.16em] text-parchment">CANON</span>
      </header>

      <div className="hairline my-5" />

      <h3 className="font-serif text-[1.65rem] font-semibold leading-[1.1] text-vellum">{axiom.title}</h3>
      <p className="mt-4 line-clamp-6 font-serif text-[1.22rem] italic leading-snug text-vellum/85">
        {axiom.thesis}
      </p>

      <dl className="mt-auto flex items-center gap-5 pt-5 font-mono text-[10.5px] tracking-[0.12em] text-parchment">
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Resonance</dt>
          <Sparkles size={12} className="text-gold" />
          <dd>{axiom.resonance} RESONANCE</dd>
        </div>
        <div>
          <dt className="sr-only">Last contemplated</dt>
          <dd>{relativeTime(axiom.lastContemplated).toUpperCase()}</dd>
        </div>
      </dl>

      <div className="mt-5 grid grid-cols-[auto_1fr] gap-2.5">
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          transition={springs.press}
          onClick={actions.down}
          className="flex items-center gap-2 rounded-xl px-3.5 py-3 text-[13px] text-parchment ring-1 ring-white/10 transition-colors hover:text-vellum hover:ring-[#B4543A]/60"
        >
          <Flame size={15} strokeWidth={1.6} />
          Question Dogma
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          transition={springs.press}
          onClick={actions.right}
          className="flex items-center justify-center gap-2 rounded-xl bg-gold py-3 text-[13.5px] font-semibold text-obsidian shadow-[0_8px_30px_-10px_rgba(197,160,89,0.8)]"
        >
          <Check size={16} strokeWidth={2.2} />
          Affirm
        </motion.button>
      </div>
    </div>
  );
}

function VoidFace({
  pillarId,
  prompt,
  draft,
  onDraft,
  onKindle,
  onForge,
}: {
  pillarId: PillarId;
  prompt: string;
  draft: string;
  onDraft: (value: string) => void;
  onKindle: () => void;
  onForge: () => void;
}) {
  const pillar = PILLAR_BY_ID[pillarId];
  return (
    <div className="relative flex h-full flex-col p-6 sm:p-7">
      <header className="flex items-center gap-2.5 text-ink/70">
        <PillarGlyph pillarId={pillar.id} size={16} />
        <span className="small-caps text-[13px]">Vacuum · {pillar.name}</span>
        <span className="ml-auto font-mono text-[10px] tracking-[0.16em] text-ink/50">THE VOID</span>
      </header>
      <div className="my-5 h-px bg-ink/15" />
      <p className="font-serif text-[1.45rem] italic leading-snug text-ink">{prompt}</p>
      <label className="mt-5 flex-1">
        <span className="sr-only">Write the first line of a new law</span>
        <textarea
          value={draft}
          onChange={(event) => onDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              onKindle();
            }
          }}
          rows={4}
          placeholder="Write the first line of a new law…"
          className="h-full w-full resize-none bg-transparent font-serif text-[1.15rem] leading-relaxed text-ink placeholder:text-ink/35 focus:outline-none"
        />
      </label>
      <div className="mt-4 grid grid-cols-[auto_1fr] gap-2.5">
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          transition={springs.press}
          onClick={onForge}
          className="flex items-center gap-1.5 rounded-xl px-3.5 py-3 text-[13px] text-ink/75 ring-1 ring-ink/20 hover:text-ink hover:ring-ink/40"
        >
          <ArrowUpRight size={15} strokeWidth={1.6} />
          To the Forge
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          transition={springs.press}
          onClick={onKindle}
          className="flex items-center justify-center gap-2 rounded-xl bg-ink py-3 text-[13.5px] font-semibold text-vellum"
        >
          <ScrollText size={15} strokeWidth={1.8} />
          Kindle Spark
        </motion.button>
      </div>
    </div>
  );
}

export function DeckHint() {
  return (
    <p className="mt-6 hidden items-center justify-center gap-4 font-mono text-[10.5px] tracking-[0.14em] text-parchment/70 md:flex">
      <span className="flex items-center gap-1.5">
        <MoveLeft size={12} /> SET ASIDE
      </span>
      <span>→ AFFIRM</span>
      <span>↓ QUESTION</span>
      <span>↑ FORGE</span>
    </p>
  );
}
