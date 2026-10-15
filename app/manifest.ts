import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Bonum — A Scriptorium of the Good",
    short_name: "Bonum",
    description:
      "Build a personal philosophy, a moral canon, and a daily contemplative liturgy. Local-first, with optional Notion sync.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone"],
    orientation: "any",
    background_color: "#0A0A0C",
    theme_color: "#0A0A0C",
    categories: ["lifestyle", "productivity", "education"],
    icons: [
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Daily Liturgy", url: "/?mode=sanctuary" },
      { name: "The Six Tomes", url: "/?mode=tomes" },
      { name: "The Forge", url: "/?mode=forge" },
    ],
  };
}
