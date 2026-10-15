import type { MetadataRoute } from "next";
import { withBase } from "@/lib/base";

// Static export: the manifest is generated once at build time.
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: withBase("/"),
    name: "Bonum — A Scriptorium of the Good",
    short_name: "Bonum",
    description:
      "Build a personal philosophy, a moral canon, and a daily contemplative liturgy. Local-first, with optional Notion sync.",
    start_url: withBase("/"),
    scope: withBase("/"),
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone"],
    orientation: "any",
    background_color: "#0A0A0C",
    theme_color: "#0A0A0C",
    categories: ["lifestyle", "productivity", "education"],
    icons: [
      { src: withBase("/icons/icon.svg"), sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: withBase("/icons/icon-maskable.svg"), sizes: "any", type: "image/svg+xml", purpose: "maskable" },
      { src: withBase("/icons/icon-192.png"), sizes: "192x192", type: "image/png", purpose: "any" },
      { src: withBase("/icons/icon-512.png"), sizes: "512x512", type: "image/png", purpose: "any" },
      { src: withBase("/icons/icon-512-maskable.png"), sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Daily Liturgy", url: withBase("/?mode=sanctuary") },
      { name: "The Six Tomes", url: withBase("/?mode=tomes") },
      { name: "The Forge", url: withBase("/?mode=forge") },
    ],
  };
}
