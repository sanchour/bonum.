/** The deployed path prefix ("" locally, "/bonum" on GitHub Pages). */
export const BASE_PATH: string = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefixes an absolute site path with the deployment base. Needed for raw strings, not next/link. */
export function withBase(path: string): string {
  return `${BASE_PATH}${path}`;
}
