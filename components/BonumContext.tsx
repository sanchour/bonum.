"use client";

import { createContext, useContext } from "react";
import type { PillarId } from "@/lib/types";

export type Mode = "sanctuary" | "tomes" | "forge";

export const MODES: readonly Mode[] = ["sanctuary", "tomes", "forge"];

export interface ForgeRequest {
  axiomId?: string;
  pillarId?: PillarId;
  seedText?: string;
  nonce: number;
}

export interface TomeRequest {
  pillarId: PillarId;
  axiomId?: string;
  nonce: number;
}

export interface BonumNav {
  mode: Mode;
  setMode: (mode: Mode) => void;
  forgeRequest: ForgeRequest | null;
  openForge: (request?: Omit<ForgeRequest, "nonce">) => void;
  tomeRequest: TomeRequest | null;
  openTome: (pillarId: PillarId, axiomId?: string) => void;
  openPalette: () => void;
}

export const BonumNavContext = createContext<BonumNav | null>(null);

export function useBonumNav(): BonumNav {
  const nav = useContext(BonumNavContext);
  if (!nav) throw new Error("useBonumNav must be used inside <BonumApp>");
  return nav;
}
