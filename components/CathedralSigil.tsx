"use client";

import { AnimatePresence, motion } from "motion/react";
import { memo, useId } from "react";
import type { PillarStat } from "@/lib/liturgy";
import { PILLARS } from "@/lib/pillars";
import type { PillarId } from "@/lib/types";
import { toRoman } from "@/lib/util";

/*
 * The Cathedral Sigil: a six-petalled rose window, one petal per pillar.
 * Each petal's tracery is drawn in tiers (0–5) that illuminate as Canon laws and Resonance
 * accumulate. Geometry is authored once in a local frame pointing "up" and rotated per petal.
 * The only continuous motion is the outer ring's rotation, done with a CSS transform on its
 * own composited layer; everything else animates opacity or one-off stroke reveals.
 */

const PETAL = "M -24 -50 C -44 -84 -46 -128 0 -172 C 46 -128 44 -84 24 -50 Q 0 -42 -24 -50 Z";
const LANCET = "M -11 -62 L -11 -106 Q -11 -126 0 -136 Q 11 -126 11 -106 L 11 -62 Z";
const MULLIONS = "M 0 -62 L 0 -134 M -11 -88 Q -5.5 -100 0 -106 Q 5.5 -100 11 -88";
const CROWN_ARC = "M -86 -149 A 172 172 0 0 1 86 -149";
const PINNACLE = "M 0 -178 L 5 -186 L 0 -195 L -5 -186 Z";
const TREFOIL: ReadonlyArray<readonly [number, number, number]> = [
  [0, -153, 5],
  [-6.5, -144, 4.2],
  [6.5, -144, 4.2],
];
const RING_TICKS = Array.from({ length: 72 }, (_, i) => {
  const angle = (i * 5 * Math.PI) / 180;
  const inner = i % 6 === 0 ? 181 : 185;
  const x1 = Math.sin(angle) * inner;
  const y1 = -Math.cos(angle) * inner;
  const x2 = Math.sin(angle) * 191;
  const y2 = -Math.cos(angle) * 191;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}).join(" ");

const draw = (delay: number) => ({
  initial: { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1 },
  exit: { opacity: 0 },
  transition: { pathLength: { duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] as const }, opacity: { duration: 0.4, delay } },
});

const Petal = memo(function Petal({
  index,
  stat,
  gradientId,
  selected,
  pulseKey,
  onSelect,
  name,
}: {
  index: number;
  stat: PillarStat;
  gradientId: string;
  selected: boolean;
  pulseKey: number | null;
  onSelect?: () => void;
  name: string;
}) {
  const { tier, glow } = stat;
  const fillOpacity = tier === 0 ? 0 : Math.min(0.62, 0.1 + tier * 0.08 + glow * 0.08);
  const baseDelay = 0.15 + index * 0.08;

  return (
    <g transform={`rotate(${index * 60})`}>
      {/* gold wash */}
      <motion.path
        d={PETAL}
        fill={`url(#${gradientId})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: fillOpacity }}
        transition={{ duration: 1.2, delay: baseDelay }}
      />

      {/* dormant outline */}
      <path d={PETAL} stroke="var(--color-parchment)" strokeOpacity={0.16} strokeWidth={1} strokeDasharray="2 4" />

      <AnimatePresence>
        {tier >= 1 && (
          <motion.path key="t1" d={PETAL} stroke="var(--color-gold)" strokeWidth={1.4} {...draw(baseDelay)} />
        )}
        {tier >= 2 && (
          <motion.path
            key="t2"
            d={LANCET}
            stroke="var(--color-gold)"
            strokeOpacity={0.85}
            strokeWidth={1}
            {...draw(baseDelay + 0.15)}
          />
        )}
        {tier >= 3 &&
          TREFOIL.map(([cx, cy, r], i) => (
            <motion.circle
              key={`t3-${i}`}
              cx={cx}
              cy={cy}
              r={r}
              stroke="var(--color-gold)"
              strokeWidth={0.9}
              {...draw(baseDelay + 0.3 + i * 0.05)}
            />
          ))}
        {tier >= 4 && (
          <motion.path
            key="t4"
            d={MULLIONS}
            stroke="var(--color-gold-bright)"
            strokeOpacity={0.8}
            strokeWidth={0.8}
            {...draw(baseDelay + 0.45)}
          />
        )}
        {tier >= 5 && (
          <motion.g key="t5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1, delay: baseDelay + 0.6 }}>
            <path d={CROWN_ARC} stroke="var(--color-gold)" strokeOpacity={0.55} strokeWidth={0.9} />
            <path d={PINNACLE} fill="var(--color-gold-bright)" />
            <circle cx={0} cy={-52} r={3.2} fill="var(--color-gold-bright)" />
          </motion.g>
        )}
      </AnimatePresence>

      {/* numeral at the petal's foot */}
      <text
        x={0}
        y={-66}
        textAnchor="middle"
        fontSize={9}
        fontFamily="var(--font-jetbrains), monospace"
        fill={tier > 0 ? "var(--color-gold)" : "var(--color-parchment)"}
        fillOpacity={tier > 0 ? 0.75 : 0.4}
        dominantBaseline="middle"
        transform={`rotate(${-index * 60} 0 -66)`}
        style={{ letterSpacing: "0.08em" }}
      >
        {toRoman(index + 1)}
      </text>

      {/* selection halo */}
      <motion.path
        d={PETAL}
        stroke="var(--color-vellum)"
        strokeWidth={1}
        initial={false}
        animate={{ opacity: selected ? 0.55 : 0 }}
        transition={{ duration: 0.25 }}
      />

      {/* affirmation pulse */}
      <AnimatePresence>
        {pulseKey !== null && (
          <motion.path
            key={pulseKey}
            d={PETAL}
            fill="var(--color-gold-bright)"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.7, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: "easeOut", times: [0, 0.25, 1] }}
          />
        )}
      </AnimatePresence>

      {/* hit target */}
      <path
        d={PETAL}
        fill="transparent"
        stroke="transparent"
        strokeWidth={10}
        style={{ cursor: onSelect ? "pointer" : "default" }}
        onClick={onSelect}
        role={onSelect ? "button" : undefined}
        aria-label={onSelect ? `${name}: tier ${tier} of 5` : undefined}
      />
    </g>
  );
});

export function CathedralSigil({
  stats,
  selectedPillarId,
  onSelectPillar,
  pulse,
  className,
}: {
  stats: Record<PillarId, PillarStat>;
  selectedPillarId?: PillarId | null;
  onSelectPillar?: (id: PillarId) => void;
  pulse?: { pillarId: PillarId; key: number } | null;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const gradientId = `petal-glow-${uid}`;
  const haloId = `halo-${uid}`;
  const totalTier = PILLARS.reduce((sum, pillar) => sum + stats[pillar.id].tier, 0);
  const radiance = totalTier / (PILLARS.length * 5);

  return (
    <div className={`relative aspect-square w-full select-none ${className ?? ""}`}>
      {/* breathing halo — opacity only */}
      <div
        className="animate-breathe absolute inset-[6%] rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(197,160,89,${0.08 + radiance * 0.22}) 0%, transparent 68%)`,
        }}
      />

      {/* slowly turning outer ring on its own compositor layer */}
      <div className="animate-spin-slow gpu absolute inset-0">
        <svg viewBox="-200 -200 400 400" className="size-full" aria-hidden fill="none">
          <circle r={194} stroke="var(--color-gold)" strokeOpacity={0.22} strokeWidth={0.8} />
          <circle r={178} stroke="var(--color-gold)" strokeOpacity={0.12} strokeWidth={0.6} />
          <path d={RING_TICKS} stroke="var(--color-gold)" strokeOpacity={0.35} strokeWidth={0.7} />
        </svg>
      </div>
      <div className="animate-spin-slower gpu absolute inset-[3%]">
        <svg viewBox="-200 -200 400 400" className="size-full" aria-hidden fill="none">
          {Array.from({ length: 12 }, (_, i) => (
            <circle
              key={i}
              cx={Math.sin((i * Math.PI) / 6) * 196}
              cy={-Math.cos((i * Math.PI) / 6) * 196}
              r={2}
              fill="var(--color-gold)"
              fillOpacity={0.4}
            />
          ))}
        </svg>
      </div>

      <svg viewBox="-200 -200 400 400" className="relative size-full" fill="none" role="img" aria-label="Cathedral Sigil">
        <defs>
          <radialGradient id={gradientId} cx="50%" cy="100%" r="110%">
            <stop offset="0%" stopColor="#ECD39A" stopOpacity={0.95} />
            <stop offset="45%" stopColor="#C5A059" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#8E6F33" stopOpacity={0.05} />
          </radialGradient>
          <radialGradient id={haloId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E2C27F" stopOpacity={0.45 + radiance * 0.4} />
            <stop offset="100%" stopColor="#C5A059" stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* radial mullions between petals */}
        {PILLARS.map((pillar, i) => (
          <line
            key={pillar.id}
            x1={0}
            y1={-44}
            x2={0}
            y2={-176}
            transform={`rotate(${i * 60 + 30})`}
            stroke="var(--color-parchment)"
            strokeOpacity={0.12}
            strokeWidth={0.8}
          />
        ))}

        {PILLARS.map((pillar, i) => (
          <Petal
            key={pillar.id}
            index={i}
            name={pillar.name}
            stat={stats[pillar.id]}
            gradientId={gradientId}
            selected={selectedPillarId === pillar.id}
            pulseKey={pulse?.pillarId === pillar.id ? pulse.key : null}
            onSelect={onSelectPillar ? () => onSelectPillar(pillar.id) : undefined}
          />
        ))}

        {/* the oculus */}
        <circle r={44} fill={`url(#${haloId})`} />
        <circle r={40} stroke="var(--color-gold)" strokeOpacity={0.5} strokeWidth={1} />
        {Array.from({ length: 6 }, (_, i) => (
          <circle
            key={i}
            cx={Math.sin((i * Math.PI) / 3) * 17}
            cy={-Math.cos((i * Math.PI) / 3) * 17}
            r={17}
            stroke="var(--color-gold)"
            strokeOpacity={0.25 + radiance * 0.55}
            strokeWidth={0.8}
          />
        ))}
        <circle r={5} fill="var(--color-gold-bright)" fillOpacity={0.5 + radiance * 0.5} />
      </svg>
    </div>
  );
}
