import type { Transition } from "motion/react";
import type { Realm, Stage } from "./types";

/**
 * The Modern Scriptorium design system.
 * Every value here is mirrored as a CSS custom property in app/globals.css (@theme),
 * so Tailwind utilities (bg-obsidian, text-gold, ...) and TS code share one source of truth.
 */
export const colors = {
  obsidian: "#0A0A0C",
  stone: "#121216",
  stoneRaised: "#1A1A20",
  vellum: "#F4F1EA",
  gold: "#C5A059",
  goldBright: "#E2C27F",
  goldDeep: "#8E6F33",
  parchment: "#9E9A90",
  ink: "#2A2620",
  realm: {
    Social: "#3B6E8C",
    Self: "#8C5A3B",
    Mundo: "#3B7A57",
  } satisfies Record<Realm, string>,
} as const;

export const fonts = {
  serif: "var(--font-cormorant)",
  sans: "var(--font-inter)",
  mono: "var(--font-jetbrains)",
} as const;

export const realmMeta: Record<Realm, { label: string; gloss: string; color: string }> = {
  Social: { label: "Social", gloss: "Among others", color: colors.realm.Social },
  Self: { label: "Self", gloss: "Within", color: colors.realm.Self },
  Mundo: { label: "Mundo", gloss: "Toward the world", color: colors.realm.Mundo },
};

export const stageMeta: Record<Stage, { label: string; gloss: string }> = {
  Spark: { label: "Spark", gloss: "An untested intuition" },
  Crucible: { label: "Crucible", gloss: "Under trial" },
  Canon: { label: "Canon", gloss: "Etched law" },
  Reforged: { label: "Reforged", gloss: "Doubted, tried again, and kept" },
};

/** Spring presets. All motion in Bonum animates transform/opacity only. */
export const springs = {
  /** Default UI response: quick, no wobble. */
  snappy: { type: "spring", stiffness: 520, damping: 42, mass: 0.9 } satisfies Transition,
  /** Cards and sheets: a little weight. */
  card: { type: "spring", stiffness: 300, damping: 30, mass: 1 } satisfies Transition,
  /** Tome morphs and large layout transitions. */
  tome: { type: "spring", stiffness: 210, damping: 28, mass: 1.05 } satisfies Transition,
  /** Tactile press feedback for tab bars and buttons. */
  press: { type: "spring", stiffness: 700, damping: 26, mass: 0.6 } satisfies Transition,
  /** Slow, ceremonial settle. */
  ceremony: { type: "spring", stiffness: 90, damping: 18, mass: 1.2 } satisfies Transition,
} as const;

export const durations = {
  etchHoldMs: 1500,
} as const;

export function realmColor(realm: Realm): string {
  return colors.realm[realm];
}

/** Hex colour with an alpha channel, for inline styles. */
export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}
