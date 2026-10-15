"use client";

import { motion } from "motion/react";
import { syncEngine, useSyncState, type SyncMode } from "@/lib/sync";
import { relativeTime } from "@/lib/util";

const LABELS: Record<SyncMode, string> = {
  booting: "Waking",
  local: "Local",
  idle: "Synced",
  syncing: "Syncing",
  offline: "Offline",
  error: "Sync error",
};

const DOT: Record<SyncMode, string> = {
  booting: "bg-parchment/40",
  local: "bg-transparent ring-1 ring-parchment/70",
  idle: "bg-gold",
  syncing: "bg-gold-bright",
  offline: "bg-parchment/50",
  error: "bg-[#B4543A]",
};

function describe(mode: SyncMode, pending: number, lastSyncedAt: string | null, message: string | null, database: string | null) {
  const lines: string[] = [];
  if (mode === "local") lines.push("Local-first mode: everything is saved on this device.");
  if (mode === "idle") lines.push(`Synced with Notion${database ? ` · ${database}` : ""} · ${relativeTime(lastSyncedAt)}`);
  if (mode === "syncing") lines.push("Exchanging pages with Notion…");
  if (mode === "offline") lines.push("Offline: changes wait on this device.");
  if (message) lines.push(message);
  if (pending > 0) lines.push(`${pending} change${pending === 1 ? "" : "s"} waiting to sync.`);
  lines.push("Click to sync now.");
  return lines.join("\n");
}

export function SyncIndicator({ variant = "rail" }: { variant?: "rail" | "compact" }) {
  const { mode, pending, lastSyncedAt, message, database } = useSyncState();
  const title = describe(mode, pending, lastSyncedAt, message, database);

  return (
    <button
      type="button"
      onClick={() => void syncEngine.forceSync()}
      title={title}
      aria-label={`Notion sync: ${LABELS[mode]}. ${pending} pending.`}
      className={
        variant === "rail"
          ? "group flex w-full flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 text-parchment transition-colors hover:bg-white/[0.03] hover:text-vellum"
          : "flex items-center gap-2 rounded-full bg-obsidian/60 px-3 py-1.5 text-parchment ring-1 ring-white/5 backdrop-blur-md"
      }
    >
      <span className="relative flex size-2.5 items-center justify-center">
        {mode === "syncing" && (
          <motion.span
            className="absolute inset-0 rounded-full bg-gold"
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 2.6, opacity: 0 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <span className={`relative size-2 rounded-full ${DOT[mode]}`} />
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.16em]">
        {LABELS[mode]}
        {pending > 0 && mode !== "idle" && <span className="text-gold"> · {pending}</span>}
      </span>
    </button>
  );
}
