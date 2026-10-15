import { useSyncExternalStore } from "react";

export interface Toast {
  id: number;
  title: string;
  detail?: string;
  tone: "gold" | "neutral" | "crimson";
  action?: { label: string; run: () => void };
}

let toasts: Toast[] = [];
let counter = 0;
const listeners = new Set<() => void>();
const EMPTY: Toast[] = [];

function emit() {
  for (const listener of listeners) listener();
}

export function showToast(toast: Omit<Toast, "id" | "tone"> & { tone?: Toast["tone"]; durationMs?: number }): number {
  const id = ++counter;
  const { durationMs = 4200, tone = "neutral", ...rest } = toast;
  toasts = [...toasts.slice(-2), { id, tone, ...rest }];
  emit();
  setTimeout(() => dismissToast(id), durationMs);
  return id;
}

export function dismissToast(id: number) {
  const next = toasts.filter((toast) => toast.id !== id);
  if (next.length === toasts.length) return;
  toasts = next;
  emit();
}

export function useToasts(): Toast[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => toasts,
    () => EMPTY,
  );
}
