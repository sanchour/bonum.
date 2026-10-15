import { Brain, Flame, Footprints, Heart, Rainbow, WandSparkles, type LucideIcon } from "lucide-react";
import type { PillarId } from "@/lib/types";

/**
 * Line-art stand-ins for the Notion emoji icons (🧡 🪄 🌈 💢 🏃 🤔), so the scriptorium keeps
 * one consistent hand. The emoji itself is still written to Notion as the page icon.
 */
export const PILLAR_ICONS: Readonly<Record<PillarId, LucideIcon>> = {
  relatio: Heart,
  habitus: WandSparkles,
  "bonus-affectus": Rainbow,
  "malum-adfectus": Flame,
  "ingenia-et-virtutes": Footprints,
  philosophorum: Brain,
};

export function PillarGlyph({
  pillarId,
  size = 18,
  strokeWidth = 1.5,
  className,
}: {
  pillarId: PillarId;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const Icon = PILLAR_ICONS[pillarId];
  return <Icon size={size} strokeWidth={strokeWidth} className={className} aria-hidden />;
}
