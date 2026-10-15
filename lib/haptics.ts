/**
 * Haptic-style feedback. Uses the Vibration API where it exists (Android, some desktops);
 * elsewhere the visual spring response carries the feeling on its own.
 */
type Pattern = "tick" | "press" | "affirm" | "etch" | "warn";

const PATTERNS: Record<Pattern, number | number[]> = {
  tick: 6,
  press: 10,
  affirm: [12, 40, 18],
  etch: [20, 60, 30, 60, 60],
  warn: [30, 50, 30],
};

export function haptic(pattern: Pattern = "tick"): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(PATTERNS[pattern]);
  } catch {
    /* some browsers throw when called without a user gesture */
  }
}
