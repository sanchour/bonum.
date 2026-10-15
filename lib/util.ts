/** Collision-resistant id that also works on insecure origins (LAN dev) where randomUUID is absent. */
export function newId(prefix = "ax"): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  const random = Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 8)).join("");
  return `${prefix}_${Date.now().toString(36)}${random}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function daysAgoISO(days: number, hours = 0): string {
  return new Date(Date.now() - days * 86_400_000 - hours * 3_600_000).toISOString();
}

/** Local calendar day as YYYY-MM-DD (not UTC: the liturgy follows the user's own sun). */
export function localDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function shiftDateKey(key: string, deltaDays: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + deltaDays);
  return localDateKey(date);
}

const ROMAN: ReadonlyArray<readonly [number, string]> = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

export function toRoman(value: number): string {
  let n = Math.floor(value);
  if (n <= 0) return "N"; // nulla — the medieval zero
  let out = "";
  for (const [amount, glyph] of ROMAN) {
    while (n >= amount) {
      out += glyph;
      n -= amount;
    }
  }
  return out;
}

/** "XV · X · MMXXVI" */
export function liturgicalDate(date: Date = new Date()): string {
  return `${toRoman(date.getDate())} · ${toRoman(date.getMonth() + 1)} · ${toRoman(date.getFullYear())}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Small deterministic string hash (FNV-1a) for stable, seedable choices. */
export function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Deterministically pick `count` distinct items, seeded so the same seed yields the same picks. */
export function seededSample<T>(items: readonly T[], count: number, seed: string): T[] {
  const pool = [...items];
  const out: T[] = [];
  let state = hashString(seed) || 1;
  while (out.length < count && pool.length > 0) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    out.push(pool.splice(state % pool.length, 1)[0]);
  }
  return out;
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return "never";
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}
