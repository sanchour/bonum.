"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { applySettings, useSettings } from "@/lib/settings";
import { syncEngine } from "@/lib/sync";
import { springs } from "@/lib/theme";
import type { PillarId } from "@/lib/types";
import { isTypingTarget } from "@/lib/util";
import { AppShell } from "./AppShell";
import { BonumMark } from "./BonumMark";
import { BonumNavContext, MODES, type BonumNav, type ForgeRequest, type Mode, type TomeRequest } from "./BonumContext";
import { CommandPalette } from "./CommandPalette";
import { ForgeView } from "./ForgeView";
import { SanctuaryView } from "./SanctuaryView";
import { SettingsSheet } from "./SettingsSheet";
import { Toaster } from "./Toaster";
import { TomesView } from "./TomesView";

function isMode(value: string | null): value is Mode {
  return value !== null && (MODES as readonly string[]).includes(value);
}

/** The client root: navigation state, global shortcuts, and the sync engine lifecycle. */
export function BonumApp() {
  const [mounted, setMounted] = useState(false);
  const [mode, setModeState] = useState<Mode>("sanctuary");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settings = useSettings();
  const [forgeRequest, setForgeRequest] = useState<ForgeRequest | null>(null);
  const [tomeRequest, setTomeRequest] = useState<TomeRequest | null>(null);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("mode");
    if (isMode(fromUrl)) setModeState(fromUrl);
    applySettings();
    setMounted(true);
    syncEngine.start();
    return () => syncEngine.stop();
  }, []);

  const setMode = useCallback((next: Mode) => {
    setModeState(next);
    const url = new URL(window.location.href);
    if (next === "sanctuary") url.searchParams.delete("mode");
    else url.searchParams.set("mode", next);
    window.history.replaceState(null, "", url);
    window.scrollTo({ top: 0 });
  }, []);

  const openForge = useCallback(
    (request?: Omit<ForgeRequest, "nonce">) => {
      if (request && (request.axiomId || request.pillarId || request.seedText)) {
        setForgeRequest({ ...request, nonce: Date.now() });
      }
      setMode("forge");
    },
    [setMode],
  );

  const openTome = useCallback(
    (pillarId: PillarId, axiomId?: string) => {
      setTomeRequest({ pillarId, axiomId, nonce: Date.now() });
      setMode("tomes");
    },
    [setMode],
  );

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const openSettings = useCallback(() => setSettingsOpen(true), []);

  const nav = useMemo<BonumNav>(
    () => ({ mode, setMode, forgeRequest, openForge, tomeRequest, openTome, openPalette, openSettings }),
    [mode, setMode, forgeRequest, openForge, tomeRequest, openTome, openPalette, openSettings],
  );

  // Global keyboard: ⌘K / Ctrl+K quick capture; 1 · 2 · 3 switch modes.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key === ",") {
        event.preventDefault();
        setSettingsOpen((open) => !open);
        return;
      }
      if (paletteOpen || event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;
      if (document.querySelector('[role="dialog"]')) return;
      const index = ["1", "2", "3"].indexOf(event.key);
      if (index >= 0) {
        event.preventDefault();
        setMode(MODES[index]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteOpen, setMode]);

  if (!mounted) return <Splash />;

  return (
    <BonumNavContext.Provider value={nav}>
      <MotionConfig
        reducedMotion={settings.motion === "reduced" ? "always" : settings.motion === "full" ? "never" : "user"}
        transition={springs.snappy}
      >
        <AppShell mode={mode} onModeChange={setMode} onCapture={openPalette} onSettings={openSettings}>
          {/* popLayout: the next view starts entering at once instead of waiting for the exit. */}
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10, transition: { duration: 0.14 } }}
              transition={springs.card}
            >
              {mode === "sanctuary" && <SanctuaryView />}
              {mode === "tomes" && <TomesView />}
              {mode === "forge" && <ForgeView />}
            </motion.div>
          </AnimatePresence>
        </AppShell>
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
        <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        <Toaster />
      </MotionConfig>
    </BonumNavContext.Provider>
  );
}

/** Rendered on the server and for the first client frame, before IndexedDB is touched. */
function Splash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 text-gold">
      <BonumMark size={56} className="animate-breathe" />
      <span className="font-serif text-xl tracking-[0.4em] text-vellum/80">BONUM</span>
    </div>
  );
}
