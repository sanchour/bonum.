"use client";

import { Anvil, Feather, Library, Settings, Sun, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { haptic } from "@/lib/haptics";
import { springs } from "@/lib/theme";
import { BonumMark } from "./BonumMark";
import type { Mode } from "./BonumContext";
import { useSyncState, type SyncMode } from "@/lib/sync";

interface ModeMeta {
  mode: Mode;
  label: string;
  gloss: string;
  icon: LucideIcon;
  shortcut: string;
}

export const MODE_META: readonly ModeMeta[] = [
  { mode: "sanctuary", label: "Sanctuary", gloss: "Daily Liturgy", icon: Sun, shortcut: "1" },
  { mode: "tomes", label: "Six Tomes", gloss: "The Canon", icon: Library, shortcut: "2" },
  { mode: "forge", label: "Forge", gloss: "The Crucible", icon: Anvil, shortcut: "3" },
];

function useModifierLabel(): string {
  const [label, setLabel] = useState("Ctrl K");
  useEffect(() => {
    const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
    const platform = nav.userAgentData?.platform ?? navigator.platform ?? "";
    if (/mac|iphone|ipad/i.test(platform)) setLabel("⌘K");
  }, []);
  return label;
}

const STATUS_DOT: Record<SyncMode, string> = {
  booting: "bg-transparent",
  local: "bg-transparent",
  idle: "bg-gold",
  syncing: "bg-gold-bright animate-pulse",
  offline: "bg-parchment/60",
  error: "bg-[#B4543A]",
};

/** The settings gear. A small dot on its corner carries what the sync indicator used to say. */
function SettingsButton({ onClick, className }: { onClick: () => void; className: string }) {
  const { mode, pending } = useSyncState();
  const label = `Settings. Sync: ${mode}${pending > 0 ? `, ${pending} pending` : ""}.`;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      transition={springs.press}
      aria-label={label}
      title="Settings (data, appearance, sync)"
      className={className}
    >
      <Settings size={19} strokeWidth={1.5} />
      <span className={`absolute right-2 top-2 size-2 rounded-full ring-2 ring-obsidian ${STATUS_DOT[mode]}`} />
    </motion.button>
  );
}

export function AppShell({
  mode,
  onModeChange,
  onCapture,
  onSettings,
  children,
}: {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  onCapture: () => void;
  onSettings: () => void;
  children: React.ReactNode;
}) {
  const shortcut = useModifierLabel();

  return (
    <div className="relative min-h-dvh">
      {/* ── Desktop: the monastic rail ───────────────────────────── */}
      <nav
        aria-label="Primary"
        className="fixed inset-y-0 left-0 z-40 hidden w-24 flex-col items-center border-r border-white/[0.05] bg-stone/60 py-6 backdrop-blur-xl md:flex"
      >
        <button
          type="button"
          onClick={() => onModeChange("sanctuary")}
          className="mb-10 flex flex-col items-center gap-2 text-gold"
          aria-label="Bonum — return to the Sanctuary"
        >
          <BonumMark size={34} />
          <span className="font-serif text-[15px] tracking-[0.3em] text-vellum/80">BONUM</span>
        </button>

        <ul className="flex w-full flex-col gap-1.5 px-2.5">
          {MODE_META.map(({ mode: m, label, icon: Icon, shortcut: key, gloss }) => {
            const active = m === mode;
            return (
              <li key={m}>
                <motion.button
                  type="button"
                  onClick={() => onModeChange(m)}
                  whileTap={{ scale: 0.94 }}
                  transition={springs.press}
                  aria-current={active ? "page" : undefined}
                  aria-label={label}
                  title={`${label} · ${gloss}  (${key})`}
                  className={`relative flex w-full items-center justify-center rounded-xl py-3.5 transition-colors ${
                    active ? "text-gold" : "text-parchment hover:text-vellum"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="rail-active"
                      transition={springs.snappy}
                      className="absolute inset-0 rounded-xl bg-gold/[0.08] ring-1 ring-gold/25"
                    >
                      <span className="absolute -left-2.5 top-1/2 h-7 w-[2px] -translate-y-1/2 rounded-full bg-gold" />
                    </motion.span>
                  )}
                  <Icon size={20} strokeWidth={1.5} className="relative" aria-hidden />
                </motion.button>
              </li>
            );
          })}
        </ul>

        <div className="mt-auto flex w-full flex-col items-center gap-2 px-2.5">
          <motion.button
            type="button"
            onClick={onCapture}
            whileTap={{ scale: 0.94 }}
            transition={springs.press}
            title="Quick capture a Spark"
            className="flex w-full flex-col items-center gap-1.5 rounded-xl border border-gold/20 bg-gold/[0.04] px-1 py-3 text-gold transition-colors hover:border-gold/40 hover:bg-gold/[0.08]"
          >
            <Feather size={18} strokeWidth={1.5} />
            <kbd className="font-mono text-[10px] tracking-wider text-gold/80">{shortcut}</kbd>
          </motion.button>
          <SettingsButton
            onClick={onSettings}
            className="relative flex w-full items-center justify-center rounded-xl py-3.5 text-parchment transition-colors hover:bg-white/[0.04] hover:text-vellum"
          />
        </div>
      </nav>

      {/* ── Mobile: floating sync status ─────────────────────────── */}
      <div className="pt-safe pointer-events-none fixed right-0 top-0 z-40 md:hidden">
        <div className="pointer-events-auto mr-4 mt-3">
          <SettingsButton
            onClick={onSettings}
            className="relative flex size-10 items-center justify-center rounded-full bg-obsidian/60 text-parchment ring-1 ring-white/5 backdrop-blur-md"
          />
        </div>
      </div>

      <main className="relative md:pl-24">{children}</main>

      {/* ── Mobile: the obsidian tab bar ─────────────────────────── */}
      <nav
        aria-label="Primary"
        className="pb-safe pointer-events-none fixed inset-x-0 bottom-0 z-40 md:hidden"
      >
        <div className="pointer-events-auto mx-3 mb-2.5 flex items-stretch gap-1 rounded-[22px] bg-obsidian/75 p-1.5 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.9)] ring-1 ring-white/[0.08] backdrop-blur-xl">
          {MODE_META.map(({ mode: m, label, icon: Icon }) => {
            const active = m === mode;
            return (
              <motion.button
                key={m}
                type="button"
                onClick={() => {
                  if (!active) haptic("tick");
                  onModeChange(m);
                }}
                whileTap={{ scale: 0.88 }}
                transition={springs.press}
                aria-current={active ? "page" : undefined}
                aria-label={label}
                className={`relative flex flex-1 items-center justify-center rounded-[16px] py-3 ${
                  active ? "text-gold" : "text-parchment"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="tab-active"
                    transition={springs.snappy}
                    className="absolute inset-0 rounded-[16px] bg-gold/[0.1] ring-1 ring-gold/20"
                  />
                )}
                <Icon size={22} strokeWidth={1.5} className="relative" aria-hidden />
              </motion.button>
            );
          })}
          <motion.button
            type="button"
            onClick={() => {
              haptic("press");
              onCapture();
            }}
            whileTap={{ scale: 0.86 }}
            transition={springs.press}
            aria-label="Quick capture a Spark"
            className="flex w-14 shrink-0 items-center justify-center rounded-[16px] bg-gold text-obsidian shadow-[0_0_24px_-6px_rgba(197,160,89,0.7)]"
          >
            <Feather size={20} strokeWidth={1.75} />
          </motion.button>
        </div>
      </nav>
    </div>
  );
}
