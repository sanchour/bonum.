"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import { computePillarStats, type PillarStat } from "./liturgy";
import type { Axiom, PillarId, Ritual } from "./types";

/** All axioms, live. `undefined` while IndexedDB opens (first frame only). */
export function useAxioms(): Axiom[] | undefined {
  return useLiveQuery(() => db.axioms.toArray(), []);
}

export function useAxiom(id: string | null | undefined): Axiom | null | undefined {
  return useLiveQuery(async () => (id ? ((await db.axioms.get(id)) ?? null) : null), [id]);
}

export function useRituals(): Ritual[] | undefined {
  return useLiveQuery(() => db.rituals.orderBy("date").reverse().limit(400).toArray(), []);
}

export function usePillarStats(axioms: Axiom[] | undefined): Record<PillarId, PillarStat> | undefined {
  return useMemo(() => (axioms ? computePillarStats(axioms) : undefined), [axioms]);
}

export function useMediaQuery(query: string, serverFallback = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverFallback,
  );
}

export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 768px)", true);
}

export function useHasMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/** Calls `callback` at most once per `delay` after the latest change to `value`. */
export function useDebouncedEffect<T>(value: T, delay: number, callback: (value: T) => void): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const timer = setTimeout(() => callbackRef.current(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
}

/** Re-renders every `intervalMs`, for clocks and the Matins/Vespers boundary. */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
