/**
 * The background sync engine.
 *
 * The UI never awaits anything in here. Every mutation is written to IndexedDB first (see
 * lib/actions.ts) together with a queue entry in the same transaction; this engine drains
 * that queue to /api/notion when it can, then pulls remote edits back in. If Notion keys are
 * absent the engine settles into "local" mode and leaves the queue intact, so the moment
 * keys are added every past change is pushed.
 */
import { useSyncExternalStore } from "react";
import { liveQuery, type Subscription } from "dexie";
import { db, getMeta, setMeta } from "./db";
import { PILLAR_BY_ID, pillarByName } from "./pillars";
import type {
  Axiom,
  AxiomWire,
  NotionStatus,
  PullResponse,
  PushResponse,
  PushResult,
  RemoteAxiom,
  SyncQueueEntry,
} from "./types";
import { hashString, newId, nowISO } from "./util";

export type SyncMode = "booting" | "local" | "idle" | "syncing" | "offline" | "error";

export interface SyncState {
  mode: SyncMode;
  pending: number;
  lastSyncedAt: string | null;
  database: string | null;
  message: string | null;
}

const INITIAL_STATE: SyncState = {
  mode: "booting",
  pending: 0,
  lastSyncedAt: null,
  database: null,
  message: null,
};

const PUSH_BATCH = 10;
const POLL_INTERVAL_MS = 90_000;
const CONFIG_RECHECK_MS = 5 * 60_000;
const MAX_BACKOFF_MS = 30 * 60_000;
/** Notion timestamps are minute-precision; re-read a small overlap and rely on echo detection. */
const PULL_OVERLAP_MS = 2 * 60_000;

class OfflineError extends Error {}

class SyncEngine {
  private state: SyncState = INITIAL_STATE;
  private listeners = new Set<() => void>();
  private started = false;
  private running: Promise<void> | null = null;
  private rerunRequested = false;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private pendingSub: Subscription | null = null;
  private configured: boolean | null = null;
  private configCheckedAt = 0;

  /* ── external store plumbing ── */

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): SyncState => this.state;

  getServerSnapshot = (): SyncState => INITIAL_STATE;

  private set(patch: Partial<SyncState>): void {
    const next = { ...this.state, ...patch };
    if (
      next.mode === this.state.mode &&
      next.pending === this.state.pending &&
      next.lastSyncedAt === this.state.lastSyncedAt &&
      next.database === this.state.database &&
      next.message === this.state.message
    ) {
      return;
    }
    this.state = next;
    for (const listener of this.listeners) listener();
  }

  /* ── lifecycle ── */

  start(): void {
    if (this.started || typeof window === "undefined") return;
    this.started = true;

    this.pendingSub = liveQuery(() => db.syncQueue.count()).subscribe({
      next: (count) => this.set({ pending: count }),
      error: (error: unknown) => console.warn("[bonum] sync queue observer failed", error),
    });

    void getMeta("lastSyncedAt").then((value) => {
      if (value) this.set({ lastSyncedAt: value });
    });

    window.addEventListener("online", this.handleOnline);
    window.addEventListener("offline", this.handleOffline);
    document.addEventListener("visibilitychange", this.handleVisibility);
    this.pollTimer = setInterval(() => void this.syncNow(), POLL_INTERVAL_MS);

    // Let first paint and the opening animation settle before touching the network.
    setTimeout(() => void this.syncNow(), 1200);
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;
    this.pendingSub?.unsubscribe();
    window.removeEventListener("online", this.handleOnline);
    window.removeEventListener("offline", this.handleOffline);
    document.removeEventListener("visibilitychange", this.handleVisibility);
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.flushTimer) clearTimeout(this.flushTimer);
  }

  private handleOnline = () => void this.syncNow();
  private handleOffline = () => this.set({ mode: "offline", message: "Offline: changes are kept on this device." });
  private handleVisibility = () => {
    if (document.visibilityState === "visible") void this.syncNow();
  };

  /** Debounced push, called after every local mutation. */
  schedule(delayMs = 1500): void {
    if (typeof window === "undefined") return;
    if (this.flushTimer) clearTimeout(this.flushTimer);
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      void this.syncNow();
    }, delayMs);
  }

  /** Force a full cycle, re-checking configuration (used by the "Sync now" command). */
  async forceSync(): Promise<void> {
    this.configured = null;
    this.configCheckedAt = 0;
    return this.syncNow();
  }

  syncNow(): Promise<void> {
    if (this.running) {
      this.rerunRequested = true;
      return this.running;
    }
    this.running = this.cycle().finally(() => {
      this.running = null;
      if (this.rerunRequested) {
        this.rerunRequested = false;
        this.schedule(400);
      }
    });
    return this.running;
  }

  /* ── one sync cycle ── */

  private async cycle(): Promise<void> {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      this.handleOffline();
      return;
    }

    try {
      const status = await this.checkConfiguration();
      if (!status.configured) {
        this.set({
          mode: "local",
          database: null,
          message: "Local-first mode. Add NOTION_API_KEY and NOTION_AXIOMS_DB_ID to enable sync.",
        });
        return;
      }
      if (!status.ok) {
        this.set({ mode: "error", message: status.error ?? "Notion is unreachable." });
        return;
      }

      this.set({ mode: "syncing", database: status.database ?? null, message: null });
      await this.push();
      await this.pull();

      const at = nowISO();
      await setMeta("lastSyncedAt", at);
      const missing = status.missingProperties?.length
        ? `Notion database is missing: ${status.missingProperties.join(", ")}.`
        : null;
      this.set({ mode: "idle", lastSyncedAt: at, message: missing });
    } catch (error) {
      if (error instanceof OfflineError) {
        this.handleOffline();
        return;
      }
      this.set({ mode: "error", message: error instanceof Error ? error.message : "Sync failed." });
    }
  }

  private async checkConfiguration(): Promise<NotionStatus> {
    const fresh = Date.now() - this.configCheckedAt < CONFIG_RECHECK_MS;
    if (this.configured === false && fresh) return { configured: false, ok: false };

    let response: Response;
    try {
      response = await fetch("/api/notion?mode=status", { cache: "no-store" });
    } catch {
      throw new OfflineError("offline");
    }
    if (!response.ok) {
      // A static export or a missing route behaves like an unconfigured install.
      this.configured = false;
      this.configCheckedAt = Date.now();
      return { configured: false, ok: false };
    }
    const status = (await response.json()) as NotionStatus;
    this.configured = status.configured;
    this.configCheckedAt = Date.now();
    return status;
  }

  /* ── push ── */

  private async push(): Promise<void> {
    for (let guard = 0; guard < 50; guard++) {
      const now = nowISO();
      const entries = await db.syncQueue.where("nextAttemptAt").belowOrEqual(now).limit(PUSH_BATCH).toArray();
      if (entries.length === 0) return;

      const axioms = (await db.axioms.bulkGet(entries.map((entry) => entry.axiomId))).filter(
        (axiom): axiom is Axiom => Boolean(axiom),
      );

      // Queue entries whose axiom no longer exists are simply dropped.
      const orphaned = entries.filter((entry) => !axioms.some((axiom) => axiom.id === entry.axiomId));
      if (orphaned.length) await db.syncQueue.bulkDelete(orphaned.map((entry) => entry.seq!));
      if (axioms.length === 0) continue;

      const payload = await Promise.all(axioms.map(toWire));
      let response: Response;
      try {
        response = await fetch("/api/notion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ axioms: payload }),
        });
      } catch {
        throw new OfflineError("offline");
      }

      if (response.status === 503) {
        const body = (await response.json().catch(() => ({}))) as { configured?: boolean; error?: string };
        if (body.configured === false) {
          this.configured = false;
          return;
        }
        throw new Error(body.error ?? "Notion is temporarily unavailable.");
      }
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Sync push failed (${response.status}).`);
      }

      const { results } = (await response.json()) as PushResponse;
      await this.applyPushResults(payload, results);

      if (results.some((result) => !result.ok)) return; // back off; the rest waits for its retry time
    }
  }

  private async applyPushResults(sent: AxiomWire[], results: PushResult[]): Promise<void> {
    const sentById = new Map(sent.map((wire) => [wire.id, wire]));
    const newlyLinked: string[] = [];

    await db.transaction("rw", db.axioms, db.syncQueue, async () => {
      for (const result of results) {
        const wire = sentById.get(result.id);
        const axiom = await db.axioms.get(result.id);
        const entry = await db.syncQueue.where("axiomId").equals(result.id).first();
        if (!wire || !axiom) {
          if (entry) await db.syncQueue.delete(entry.seq!);
          continue;
        }

        if (result.ok && result.notionId) {
          if (!axiom.notionId) newlyLinked.push(axiom.id);
          const unchangedSinceSend = axiom.updatedAt === wire.updatedAt;
          await db.axioms.update(axiom.id, {
            notionId: result.notionId,
            notionEditedAt: result.remoteEditedAt ?? axiom.notionEditedAt,
            notionHash: result.remote ? remoteHash(result.remote) : axiom.notionHash,
            syncStatus: unchangedSinceSend ? "synced" : "pending",
          });
          if (entry && unchangedSinceSend) {
            await db.syncQueue.delete(entry.seq!);
          } else if (entry) {
            await db.syncQueue.update(entry.seq!, { attempts: 0, lastError: null, nextAttemptAt: nowISO() });
          }
        } else {
          const attempts = (entry?.attempts ?? 0) + 1;
          const backoff = Math.min(MAX_BACKOFF_MS, 15_000 * 2 ** (attempts - 1));
          await db.axioms.update(axiom.id, { syncStatus: "error" });
          if (entry) {
            await db.syncQueue.update(entry.seq!, {
              attempts,
              lastError: result.error ?? "Unknown error",
              nextAttemptAt: new Date(Date.now() + backoff).toISOString(),
            });
          }
        }
      }

      // Axioms that point at a freshly created page can now carry a real Notion relation.
      if (newlyLinked.length) {
        const partners = await db.axioms.where("id").anyOf(newlyLinked).toArray();
        for (const partner of partners) {
          if (!partner.antithesisId) continue;
          const other = await db.axioms.get(partner.antithesisId);
          if (other?.notionId) await enqueueInTx(other.id);
        }
      }
    });
  }

  /* ── pull ── */

  private async pull(): Promise<void> {
    for (let guard = 0; guard < 20; guard++) {
      const since = await getMeta("lastPulledAt");
      let response: Response;
      try {
        response = await fetch(`/api/notion${since ? `?since=${encodeURIComponent(since)}` : ""}`, {
          cache: "no-store",
        });
      } catch {
        throw new OfflineError("offline");
      }
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Sync pull failed (${response.status}).`);
      }
      const data = (await response.json()) as PullResponse | NotionStatus;
      if (!("axioms" in data)) return;

      await this.mergeRemote(data.axioms);

      if (data.complete) {
        const cursor = new Date(new Date(data.serverTime).getTime() - PULL_OVERLAP_MS).toISOString();
        await setMeta("lastPulledAt", cursor);
        return;
      }
      if (data.nextSince) await setMeta("lastPulledAt", data.nextSince);
    }
  }

  private async mergeRemote(remotes: RemoteAxiom[]): Promise<void> {
    if (remotes.length === 0) return;

    await db.transaction("rw", db.axioms, db.syncQueue, async () => {
      for (const remote of remotes) {
        if (remote.archived) continue;

        const byNotion = await db.axioms.where("notionId").equals(remote.notionId).first();
        const local = byNotion ?? (remote.id ? await db.axioms.get(remote.id) : undefined);

        if (local) {
          const hash = remoteHash(remote);
          // Unchanged since we last wrote or read it (this includes the echo of our own push).
          if (local.notionHash === hash) {
            if (local.notionId !== remote.notionId) await db.axioms.update(local.id, { notionId: remote.notionId });
            continue;
          }

          // Edited on both sides: the later edit wins. A local win is pushed on the next cycle.
          const queued = await db.syncQueue.where("axiomId").equals(local.id).first();
          if (queued && local.updatedAt > remote.editedAt) continue;

          const patch = remoteToPatch(remote);
          const antithesisId = await resolveAntithesis(remote);
          await db.axioms.update(local.id, {
            ...patch,
            ...(antithesisId !== undefined ? { antithesisId } : {}),
            notionId: remote.notionId,
            notionEditedAt: remote.editedAt,
            notionHash: hash,
            syncStatus: "synced",
            updatedAt: remote.editedAt > local.updatedAt ? remote.editedAt : local.updatedAt,
          });
          if (queued) await db.syncQueue.delete(queued.seq!);
          continue;
        }

        // A page that was born in Notion.
        const patch = remoteToPatch(remote);
        const pillarId = patch.pillarId ?? "philosophorum";
        const antithesisId = (await resolveAntithesis(remote)) ?? null;
        const created: Axiom = {
          id: remote.id ?? newId(),
          notionId: remote.notionId,
          title: patch.title ?? "Untitled",
          pillarId,
          realm: PILLAR_BY_ID[pillarId].realm,
          stage: patch.stage ?? "Spark",
          thesis: patch.thesis ?? "",
          dialectics: patch.dialectics ?? [],
          bodyMarkdown: patch.bodyMarkdown ?? "",
          antithesisId,
          resonance: patch.resonance ?? 0,
          lastContemplated: patch.lastContemplated ?? "",
          syncStatus: "synced",
          canonizedAt: patch.canonizedAt ?? null,
          createdAt: remote.editedAt,
          updatedAt: remote.editedAt,
          notionEditedAt: remote.editedAt,
          notionHash: remoteHash(remote),
        };
        if ((created.stage === "Canon" || created.stage === "Reforged") && !created.canonizedAt) {
          created.canonizedAt = remote.editedAt;
        }
        await db.axioms.put(created);
      }
    });
  }
}

/* ───────────────────────────────── helpers ───────────────────────────────── */

async function toWire(axiom: Axiom): Promise<AxiomWire> {
  const antithesis = axiom.antithesisId ? await db.axioms.get(axiom.antithesisId) : undefined;
  return {
    id: axiom.id,
    notionId: axiom.notionId,
    title: axiom.title,
    pillar: PILLAR_BY_ID[axiom.pillarId].name,
    realm: axiom.realm,
    stage: axiom.stage,
    thesis: axiom.thesis,
    dialectics: axiom.dialectics,
    bodyMarkdown: axiom.bodyMarkdown,
    antithesisId: axiom.antithesisId,
    antithesisNotionId: antithesis?.notionId ?? null,
    resonance: axiom.resonance,
    lastContemplated: axiom.lastContemplated,
    canonizedAt: axiom.canonizedAt,
    updatedAt: axiom.updatedAt,
  };
}

/** Content fingerprint of a Notion page, independent of timestamps and of which properties exist. */
export function remoteHash(remote: RemoteAxiom): string {
  const fields = [
    remote.title,
    remote.pillar,
    remote.stage,
    remote.thesis,
    remote.dialectics,
    remote.bodyMarkdown,
    remote.antithesisId,
    remote.antithesisNotionId,
    remote.resonance,
    remote.lastContemplated,
    remote.canonizedAt,
  ];
  return hashString(JSON.stringify(fields, (_key, value: unknown) => (value === undefined ? null : value))).toString(36);
}

function remoteToPatch(remote: RemoteAxiom): Partial<Axiom> {
  const patch: Partial<Axiom> = {};
  if (remote.title !== undefined) patch.title = remote.title || "Untitled";
  if (remote.pillar !== undefined) {
    const pillar = pillarByName(remote.pillar);
    if (pillar) {
      patch.pillarId = pillar.id;
      patch.realm = pillar.realm;
    }
  }
  if (remote.stage !== undefined) patch.stage = remote.stage;
  if (remote.thesis !== undefined) patch.thesis = remote.thesis;
  if (remote.dialectics !== undefined) patch.dialectics = remote.dialectics;
  if (remote.bodyMarkdown !== undefined) patch.bodyMarkdown = remote.bodyMarkdown;
  if (remote.resonance !== undefined) patch.resonance = remote.resonance;
  if (remote.lastContemplated !== undefined) patch.lastContemplated = remote.lastContemplated;
  if (remote.canonizedAt !== undefined) patch.canonizedAt = remote.canonizedAt;
  return patch;
}

async function resolveAntithesis(remote: RemoteAxiom): Promise<string | null | undefined> {
  if (remote.antithesisNotionId !== undefined) {
    if (remote.antithesisNotionId === null) return null;
    const partner = await db.axioms.where("notionId").equals(remote.antithesisNotionId).first();
    return partner ? partner.id : undefined;
  }
  if (remote.antithesisId !== undefined) {
    if (!remote.antithesisId) return null;
    const partner = await db.axioms.get(remote.antithesisId);
    return partner ? partner.id : undefined;
  }
  return undefined;
}

/** Adds or refreshes the queue entry for an axiom. Must run inside a transaction that includes syncQueue. */
export async function enqueueInTx(axiomId: string): Promise<void> {
  const now = nowISO();
  const existing = await db.syncQueue.where("axiomId").equals(axiomId).first();
  if (existing) {
    await db.syncQueue.update(existing.seq!, { nextAttemptAt: now, attempts: 0, lastError: null, enqueuedAt: now });
    return;
  }
  const entry: SyncQueueEntry = { axiomId, enqueuedAt: now, attempts: 0, nextAttemptAt: now, lastError: null };
  await db.syncQueue.add(entry);
}

export const syncEngine = new SyncEngine();

export function useSyncState(): SyncState {
  return useSyncExternalStore(syncEngine.subscribe, syncEngine.getSnapshot, syncEngine.getServerSnapshot);
}
