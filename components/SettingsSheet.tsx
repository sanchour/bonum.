"use client";

import { Download, Eraser, RotateCcw, Upload, Vibrate, X, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { BackupError, applyBackup, downloadBackup, parseBackup, type ParsedBackup } from "@/lib/backup";
import { resetDatabase } from "@/lib/db";
import { haptic } from "@/lib/haptics";
import { updateSettings, useSettings, type MotionPref, type TextSize } from "@/lib/settings";
import { syncEngine, useSyncState } from "@/lib/sync";
import { springs } from "@/lib/theme";
import { showToast } from "@/lib/toast";
import { relativeTime } from "@/lib/util";

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <AnimatePresence>{open && <SheetBody key="settings" onClose={onClose} />}</AnimatePresence>;
}

function SheetBody({ onClose }: { onClose: () => void }) {
  const settings = useSettings();
  const sync = useSyncState();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<ParsedBackup | null>(null);
  const [confirm, setConfirm] = useState<"starter" | "erase" | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // After a bulk change, reload so every view (and the remembered Forge session) starts clean.
  const reloadSoon = () => setTimeout(() => window.location.reload(), 700);

  const onExport = async () => {
    try {
      const summary = await downloadBackup();
      showToast({ title: "Backup saved", detail: `${summary.axioms} laws · ${summary.rituals} offices`, tone: "gold" });
    } catch {
      showToast({ title: "The backup could not be created.", tone: "crimson" });
    }
  };

  const onPickFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setPendingImport(parseBackup(await file.text()));
    } catch (error) {
      showToast({
        title: error instanceof BackupError ? error.message : "That file could not be read.",
        tone: "crimson",
      });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onImport = async (mode: "merge" | "replace") => {
    if (!pendingImport || busy) return;
    setBusy(true);
    try {
      await applyBackup(pendingImport, mode);
      showToast({ title: mode === "merge" ? "Backup merged" : "Backup restored", tone: "gold" });
      reloadSoon();
    } catch {
      showToast({ title: "The import failed; nothing was changed.", tone: "crimson" });
      setBusy(false);
    }
  };

  const onReset = async (starter: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      await resetDatabase({ starter });
      haptic("warn");
      showToast({ title: starter ? "Starter canon restored" : "Everything erased", tone: "neutral" });
      reloadSoon();
    } catch {
      showToast({ title: "The reset failed.", tone: "crimson" });
      setBusy(false);
    }
  };

  const syncLine =
    sync.mode === "local"
      ? "Local only. Everything is saved on this device."
      : sync.mode === "idle"
        ? `Synced with Notion${sync.database ? ` · ${sync.database}` : ""} · ${relativeTime(sync.lastSyncedAt)}`
        : sync.mode === "syncing"
          ? "Exchanging pages with Notion…"
          : sync.mode === "offline"
            ? "Offline. Changes wait on this device."
            : sync.mode === "error"
              ? (sync.message ?? "Sync failed.")
              : "Starting…";

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center md:items-center md:justify-end md:p-6">
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
        aria-label="Settings"
        initial={{ opacity: 0, y: 60, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.98, transition: { duration: 0.16 } }}
        transition={springs.card}
        className="relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-[26px] bg-stone shadow-[0_40px_100px_-30px_rgba(0,0,0,0.95)] ring-1 ring-gold/25 md:max-h-[min(760px,calc(100dvh-3rem))] md:max-w-[440px] md:rounded-[26px]"
      >
        <header className="flex shrink-0 items-center justify-between px-6 pb-3 pt-5">
          <h2 className="font-serif text-[1.75rem] font-semibold text-vellum">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="rounded-full p-2 text-parchment transition-colors hover:bg-white/[0.05] hover:text-vellum"
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-8 overflow-y-auto overscroll-contain px-6 pb-[calc(env(safe-area-inset-bottom)+1.75rem)] pt-2">
          <Section title="Appearance">
            <Row label="Text size">
              <Segmented<TextSize>
                value={settings.textSize}
                onChange={(textSize) => updateSettings({ textSize })}
                options={[
                  { value: "sm", label: "Small" },
                  { value: "md", label: "Default" },
                  { value: "lg", label: "Large" },
                ]}
              />
            </Row>
            <Row label="Motion" hint="Reduced replaces springs and the rotating sigil with fades.">
              <Segmented<MotionPref>
                value={settings.motion}
                onChange={(motion) => updateSettings({ motion })}
                options={[
                  { value: "system", label: "System" },
                  { value: "reduced", label: "Reduced" },
                  { value: "full", label: "Full" },
                ]}
              />
            </Row>
            <Row
              label="Haptics"
              hint="Short vibrations on swipes and the etching, on devices that support them."
              icon={Vibrate}
            >
              <Switch checked={settings.haptics} onChange={(haptics) => updateSettings({ haptics })} label="Haptics" />
            </Row>
          </Section>

          <Section title="Sync">
            <p className="text-[13.5px] leading-relaxed text-parchment">{syncLine}</p>
            {sync.pending > 0 && (
              <p className="font-mono text-[11px] tracking-[0.12em] text-gold">
                {sync.pending} CHANGE{sync.pending === 1 ? "" : "S"} WAITING
              </p>
            )}
            {sync.mode !== "local" && <ActionButton onClick={() => void syncEngine.forceSync()}>Sync now</ActionButton>}
          </Section>

          <Section title="Your data">
            <p className="text-[13px] leading-relaxed text-parchment">
              Everything lives in this browser. Export a backup before clearing site data or switching devices.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <ActionButton icon={Download} onClick={() => void onExport()}>
                Export
              </ActionButton>
              <ActionButton icon={Upload} onClick={() => fileRef.current?.click()}>
                Import
              </ActionButton>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              tabIndex={-1}
              onChange={(event) => void onPickFile(event.target.files?.[0])}
            />

            <AnimatePresence initial={false}>
              {pendingImport && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={springs.snappy}
                  className="rounded-2xl bg-obsidian p-4 ring-1 ring-gold/30"
                >
                  <p className="text-[13.5px] text-vellum">
                    {pendingImport.summary.axioms} laws ({pendingImport.summary.canon} canon) ·{" "}
                    {pendingImport.summary.rituals} offices
                  </p>
                  {pendingImport.summary.exportedAt && (
                    <p className="mt-0.5 font-mono text-[10.5px] tracking-[0.12em] text-parchment">
                      EXPORTED {relativeTime(pendingImport.summary.exportedAt).toUpperCase()}
                    </p>
                  )}
                  <p className="mt-2 text-[12px] leading-relaxed text-parchment/80">
                    Merge keeps what you have and takes the newer copy of any shared law. Replace all discards the
                    current canon first.
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <ActionButton onClick={() => void onImport("merge")} disabled={busy} primary>
                      Merge
                    </ActionButton>
                    <ActionButton onClick={() => void onImport("replace")} disabled={busy} danger>
                      Replace all
                    </ActionButton>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingImport(null)}
                    className="mt-2 w-full py-1.5 text-[12.5px] text-parchment hover:text-vellum"
                  >
                    Cancel
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </Section>

          <Section title="Reset" tone="danger">
            <ConfirmRow
              icon={RotateCcw}
              label="Restore starter canon"
              detail="Replaces everything with the six pillars and the example laws."
              armed={confirm === "starter"}
              busy={busy}
              onArm={() => setConfirm("starter")}
              onCancel={() => setConfirm(null)}
              onConfirm={() => void onReset(true)}
            />
            <ConfirmRow
              icon={Eraser}
              label="Erase everything"
              detail="Deletes every law, trial and office on this device. This cannot be undone."
              armed={confirm === "erase"}
              busy={busy}
              onArm={() => setConfirm("erase")}
              onCancel={() => setConfirm(null)}
              onConfirm={() => void onReset(false)}
            />
          </Section>

          <p className="text-center font-mono text-[10px] tracking-[0.2em] text-parchment/50">
            BONUM · SCRIPTORIUM OF THE GOOD
          </p>
        </div>
      </motion.div>
    </div>
  );
}

/* ───────────────────────────── building blocks ───────────────────────────── */

function Section({ title, tone, children }: { title: string; tone?: "danger"; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className={`small-caps text-[13px] ${tone === "danger" ? "text-[#E0927A]" : "text-gold"}`}>{title}</h3>
      {children}
    </section>
  );
}

/** A labelled setting. With an icon the control sits inline on the right; otherwise it spans the row. */
function Row({
  label,
  hint,
  icon: Icon,
  children,
}: {
  label: string;
  hint?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-2 text-[14px] text-vellum">
          {Icon && <Icon size={15} className="text-parchment" />}
          {label}
        </span>
        {Icon ? children : null}
      </div>
      {!Icon && children}
      {hint && <p className="text-[12px] leading-relaxed text-parchment/70">{hint}</p>}
    </div>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  const group = options.map((o) => o.value).join("-");
  return (
    <div role="radiogroup" className="flex rounded-full bg-obsidian p-1 ring-1 ring-white/[0.06]">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={`relative flex-1 rounded-full px-3 py-1.5 text-[12.5px] transition-colors ${
              active ? "text-obsidian" : "text-parchment hover:text-vellum"
            }`}
          >
            {active && (
              <motion.span layoutId={`seg-${group}`} transition={springs.snappy} className="absolute inset-0 rounded-full bg-gold" />
            )}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? "bg-gold" : "bg-white/10"}`}
    >
      <motion.span
        className="absolute left-0.5 top-0.5 size-6 rounded-full bg-vellum shadow"
        animate={{ x: checked ? 20 : 0 }}
        transition={springs.press}
      />
    </button>
  );
}

function ActionButton({
  children,
  onClick,
  icon: Icon,
  primary,
  danger,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon?: LucideIcon;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  const tone = primary
    ? "bg-gold font-semibold text-obsidian"
    : danger
      ? "text-[#E0927A] ring-1 ring-[#B4543A]/50 hover:bg-[#B4543A]/10"
      : "text-vellum ring-1 ring-white/[0.12] hover:ring-gold/40";
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.97 }}
      transition={springs.press}
      className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13.5px] transition-colors disabled:opacity-50 ${tone}`}
    >
      {Icon && <Icon size={15} strokeWidth={1.6} />}
      {children}
    </motion.button>
  );
}

function ConfirmRow({
  icon: Icon,
  label,
  detail,
  armed,
  busy,
  onArm,
  onCancel,
  onConfirm,
}: {
  icon: LucideIcon;
  label: string;
  detail: string;
  armed: boolean;
  busy: boolean;
  onArm: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="rounded-2xl bg-obsidian/60 p-4 ring-1 ring-white/[0.05]">
      <div className="flex items-start gap-3">
        <Icon size={16} className="mt-0.5 shrink-0 text-parchment" strokeWidth={1.6} />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] text-vellum">{label}</p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-parchment/80">{detail}</p>
        </div>
      </div>
      <div className="mt-3">
        {armed ? (
          <div className="grid grid-cols-2 gap-2">
            <ActionButton onClick={onCancel} disabled={busy}>
              Cancel
            </ActionButton>
            <ActionButton onClick={onConfirm} disabled={busy} danger>
              Yes, do it
            </ActionButton>
          </div>
        ) : (
          <ActionButton onClick={onArm} danger>
            {label}
          </ActionButton>
        )}
      </div>
    </div>
  );
}
