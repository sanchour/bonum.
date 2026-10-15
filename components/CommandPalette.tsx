"use client";

import { Anvil, CornerDownLeft, Feather, Library, RefreshCw, Settings, Sun } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { createAxiom, splitCapture } from "@/lib/actions";
import { haptic } from "@/lib/haptics";
import { PILLARS, PILLAR_BY_ID, isPillarId } from "@/lib/pillars";
import { syncEngine } from "@/lib/sync";
import { realmColor, springs, withAlpha } from "@/lib/theme";
import { showToast } from "@/lib/toast";
import type { PillarId } from "@/lib/types";
import { useBonumNav, type Mode } from "./BonumContext";
import { PillarGlyph } from "./PillarGlyph";

const LAST_PILLAR_KEY = "bonum:last-pillar";

function readLastPillar(): PillarId {
  try {
    const stored = localStorage.getItem(LAST_PILLAR_KEY);
    if (isPillarId(stored)) return stored;
  } catch {
    /* storage unavailable (private mode) */
  }
  return "philosophorum";
}

function writeLastPillar(id: PillarId) {
  try {
    localStorage.setItem(LAST_PILLAR_KEY, id);
  } catch {
    /* ignore */
  }
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && <PaletteBody key="palette" onClose={onClose} />}
    </AnimatePresence>
  );
}

function PaletteBody({ onClose }: { onClose: () => void }) {
  const nav = useBonumNav();
  const [text, setText] = useState("");
  const [pillarId, setPillarId] = useState<PillarId>(() => readLastPillar());
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Focus after the entrance spring starts so mobile keyboards don't fight the animation.
    const timer = setTimeout(() => inputRef.current?.focus(), 40);
    return () => clearTimeout(timer);
  }, []);

  const choosePillar = (id: PillarId) => {
    setPillarId(id);
    writeLastPillar(id);
  };

  const kindle = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const { title, thesis } = splitCapture(trimmed);
    const spark = await createAxiom({ title, thesis, pillarId });
    haptic("affirm");
    showToast({
      title: `Spark kindled in ${PILLAR_BY_ID[pillarId].name}`,
      detail: title,
      tone: "gold",
      action: { label: "Forge it", run: () => nav.openForge({ axiomId: spark.id }) },
    });
    onClose();
  };

  const toForge = () => {
    nav.openForge({ pillarId, seedText: text.trim() || undefined });
    onClose();
  };

  const go = (mode: Mode) => {
    nav.setMode(mode);
    onClose();
  };

  const commands: { label: string; hint: string; icon: typeof Sun; run: () => void }[] = [
    { label: "Sanctuary · Daily Liturgy", hint: "1", icon: Sun, run: () => go("sanctuary") },
    { label: "The Six Tomes", hint: "2", icon: Library, run: () => go("tomes") },
    { label: "The Forge", hint: "3", icon: Anvil, run: () => go("forge") },
    {
      label: "Settings",
      hint: "⌘,",
      icon: Settings,
      run: () => {
        onClose();
        nav.openSettings();
      },
    },
    {
      label: "Sync with Notion now",
      hint: "",
      icon: RefreshCw,
      run: () => {
        void syncEngine.forceSync();
        onClose();
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[max(env(safe-area-inset-top),12vh)]">
      <motion.div
        className="absolute inset-0 bg-obsidian/75 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Quick capture"
        initial={{ opacity: 0, y: -16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.14 } }}
        transition={springs.snappy}
        className="relative w-full max-w-xl overflow-hidden rounded-[22px] bg-stone shadow-[0_40px_100px_-30px_rgba(0,0,0,0.95)] ring-1 ring-gold/25"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onClose();
          }
        }}
      >
        <div className="flex items-start gap-3 px-5 pt-5">
          <Feather size={18} className="mt-1.5 shrink-0 text-gold" strokeWidth={1.5} />
          <textarea
            ref={inputRef}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              if (event.metaKey || event.ctrlKey) {
                event.preventDefault();
                toForge();
              } else if (!event.shiftKey) {
                event.preventDefault();
                void kindle();
              }
            }}
            rows={3}
            placeholder="Capture a spark: an intuition, a rule, a suspicion about how to live…"
            className="w-full resize-none bg-transparent font-serif text-[1.4rem] leading-snug text-vellum placeholder:italic placeholder:text-vellum/30 focus:outline-none"
          />
        </div>

        <div className="scrollbar-none mt-2 flex gap-1.5 overflow-x-auto px-5 pb-4">
          {PILLARS.map((pillar) => {
            const active = pillar.id === pillarId;
            return (
              <button
                key={pillar.id}
                type="button"
                onClick={() => choosePillar(pillar.id)}
                aria-pressed={active}
                className={`relative flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] transition-colors ${
                  active ? "text-vellum" : "text-parchment hover:text-vellum"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="palette-pillar"
                    transition={springs.snappy}
                    className="absolute inset-0 rounded-full ring-1 ring-gold/50"
                    style={{ background: withAlpha(realmColor(pillar.realm), 0.25) }}
                  />
                )}
                <span className="relative" style={{ color: active ? "var(--color-gold)" : undefined }}>
                  <PillarGlyph pillarId={pillar.id} size={13} />
                </span>
                <span className="relative">{pillar.name}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 border-t border-white/[0.06] px-5 py-3">
          <button
            type="button"
            onClick={() => void kindle()}
            disabled={!text.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-[12.5px] font-semibold text-obsidian disabled:bg-gold/25"
          >
            <CornerDownLeft size={13} /> Kindle Spark
          </button>
          <button
            type="button"
            onClick={toForge}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] text-parchment ring-1 ring-white/10 hover:text-vellum"
          >
            <Anvil size={13} /> To the Forge
          </button>
          <span className="ml-auto hidden font-mono text-[10px] tracking-[0.12em] text-parchment/60 sm:block">
            ⇧↵ NEWLINE · ⌘↵ FORGE · ESC
          </span>
        </div>

        <ul className="border-t border-white/[0.06] p-2">
          {commands.map(({ label, hint, icon: Icon, run }) => (
            <li key={label}>
              <button
                type="button"
                onClick={run}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13.5px] text-parchment transition-colors hover:bg-white/[0.04] hover:text-vellum"
              >
                <Icon size={15} strokeWidth={1.5} />
                <span className="flex-1">{label}</span>
                {hint && <kbd className="font-mono text-[10.5px] text-parchment/60">{hint}</kbd>}
              </button>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
