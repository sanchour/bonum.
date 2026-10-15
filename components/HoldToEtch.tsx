"use client";

import { animate, motion, useMotionValue, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { haptic } from "@/lib/haptics";
import { durations, springs } from "@/lib/theme";

/**
 * Press & hold for `durationMs`. Progress is driven by requestAnimationFrame into a MotionValue
 * (no React state per frame), so the fill and the card border can follow it at full frame rate.
 * Releasing early springs the progress back to zero.
 */
export function useHoldProgress({
  durationMs = durations.etchHoldMs,
  disabled = false,
  onComplete,
}: {
  durationMs?: number;
  disabled?: boolean;
  onComplete: () => void;
}) {
  const progress = useMotionValue(0);
  const frame = useRef<number | null>(null);
  const startedAt = useRef(0);
  const completed = useRef(false);
  const [holding, setHolding] = useState(false);
  const lastTick = useRef(0);

  const stopLoop = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  };

  const tick = useCallback(
    (now: number) => {
      const value = Math.min(1, (now - startedAt.current) / durationMs);
      progress.set(value);
      const quarter = Math.floor(value * 4);
      if (quarter > lastTick.current && quarter < 4) {
        lastTick.current = quarter;
        haptic("tick");
      }
      if (value >= 1) {
        frame.current = null;
        completed.current = true;
        setHolding(false);
        haptic("etch");
        onComplete();
        return;
      }
      frame.current = requestAnimationFrame(tick);
    },
    [durationMs, onComplete, progress],
  );

  const start = useCallback(() => {
    if (disabled || completed.current || frame.current !== null) return;
    progress.stop();
    // Resume from wherever a released spring-back currently is.
    startedAt.current = performance.now() - progress.get() * durationMs;
    lastTick.current = Math.floor(progress.get() * 4);
    setHolding(true);
    haptic("press");
    frame.current = requestAnimationFrame(tick);
  }, [disabled, durationMs, progress, tick]);

  const release = useCallback(() => {
    if (completed.current) return;
    if (frame.current === null && !holding) return;
    stopLoop();
    setHolding(false);
    void animate(progress, 0, { type: "spring", stiffness: 260, damping: 28 });
  }, [holding, progress]);

  const reset = useCallback(() => {
    stopLoop();
    completed.current = false;
    progress.set(0);
    setHolding(false);
  }, [progress]);

  useEffect(() => stopLoop, []);

  return { progress, holding, start, release, reset };
}

export function HoldToEtch({
  progress,
  holding,
  disabled,
  done,
  onStart,
  onRelease,
}: {
  progress: MotionValue<number>;
  holding: boolean;
  disabled?: boolean;
  done?: boolean;
  onStart: () => void;
  onRelease: () => void;
}) {
  const fill = progress;
  const glow = useTransform(progress, [0, 1], [0, 1]);
  const [percent, setPercent] = useState(0);
  useMotionValueEvent(progress, "change", (value) => {
    const next = Math.round(value * 100);
    if (next % 5 === 0 || next === 100) setPercent(next);
  });

  const label = done ? "Etched into Canon" : holding ? (percent >= 95 ? "Etching…" : "Keep holding…") : "Hold to Etch into Canon";

  return (
    <motion.button
      type="button"
      disabled={disabled || done}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        onStart();
      }}
      onPointerUp={onRelease}
      onPointerCancel={onRelease}
      onLostPointerCapture={onRelease}
      onKeyDown={(event) => {
        if ((event.key === " " || event.key === "Enter") && !event.repeat) {
          event.preventDefault();
          onStart();
        }
      }}
      onKeyUp={(event) => {
        if (event.key === " " || event.key === "Enter") onRelease();
      }}
      onContextMenu={(event) => event.preventDefault()}
      animate={{ scale: holding ? 0.975 : 1 }}
      transition={springs.press}
      className="relative h-16 w-full touch-none select-none overflow-hidden rounded-2xl bg-obsidian text-[15px] font-semibold tracking-wide ring-1 ring-gold/50 disabled:opacity-60"
      aria-label="Hold to etch into Canon"
    >
      {/* gold fill: scaleX only */}
      <motion.span
        className="absolute inset-0 origin-left bg-gradient-to-r from-gold-deep via-gold to-gold-bright"
        style={{ scaleX: fill }}
      />
      <motion.span
        className="pointer-events-none absolute inset-0"
        style={{ opacity: glow, boxShadow: "inset 0 0 30px rgba(255,243,209,0.55)" }}
      />
      <span className={`relative transition-colors duration-200 ${percent > 45 || done ? "text-obsidian" : "text-gold"}`}>
        {label}
      </span>
    </motion.button>
  );
}
