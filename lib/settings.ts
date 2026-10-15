import { useSyncExternalStore } from "react";

export type TextSize = "sm" | "md" | "lg";
export type MotionPref = "system" | "reduced" | "full";

export interface Settings {
  textSize: TextSize;
  motion: MotionPref;
  haptics: boolean;
}

export const DEFAULT_SETTINGS: Settings = { textSize: "md", motion: "system", haptics: true };

const KEY = "bonum:settings";
const ROOT_SIZE: Record<TextSize, string> = { sm: "93.75%", md: "100%", lg: "112.5%" };

const listeners = new Set<() => void>();
let cache: Settings = DEFAULT_SETTINGS;
let loaded = false;

function sanitize(raw: unknown): Settings {
  const value = (typeof raw === "object" && raw !== null ? raw : {}) as Partial<Settings>;
  return {
    textSize: value.textSize === "sm" || value.textSize === "lg" ? value.textSize : "md",
    motion: value.motion === "reduced" || value.motion === "full" ? value.motion : "system",
    haptics: typeof value.haptics === "boolean" ? value.haptics : true,
  };
}

function load(): Settings {
  if (loaded || typeof window === "undefined") return cache;
  loaded = true;
  try {
    const stored = localStorage.getItem(KEY);
    if (stored) cache = sanitize(JSON.parse(stored));
  } catch {
    /* storage unavailable or corrupt: keep defaults */
  }
  return cache;
}

export function getSettings(): Settings {
  return load();
}

export function updateSettings(patch: Partial<Settings>): void {
  cache = sanitize({ ...load(), ...patch });
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* private mode: the change still applies for this session */
  }
  applySettings(cache);
  for (const listener of listeners) listener();
}

/** Applies the settings that live outside React (root font size scales every rem-based size). */
export function applySettings(settings: Settings = load()): void {
  if (typeof document === "undefined") return;
  document.documentElement.style.fontSize = ROOT_SIZE[settings.textSize];
  document.documentElement.dataset.motion = settings.motion;
}

export function useSettings(): Settings {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => load(),
    () => DEFAULT_SETTINGS,
  );
}
