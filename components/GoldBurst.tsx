"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";

/** A one-shot burst of gold motes and a light ring. Transform + opacity only. */
function Burst({ seed }: { seed: number }) {
  const motes = useMemo(() => {
    let state = (seed * 9301 + 49297) % 233280 || 1;
    const rand = () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };
    return Array.from({ length: 24 }, (_, i) => {
      const angle = (i / 24) * Math.PI * 2 + rand() * 0.4;
      const distance = 90 + rand() * 120;
      return {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - 30,
        size: 3 + rand() * 4,
        delay: rand() * 0.08,
        duration: 0.8 + rand() * 0.5,
      };
    });
  }, [seed]);

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <motion.div
        className="absolute size-40 rounded-full border border-gold-bright/70"
        style={{ boxShadow: "0 0 40px 6px rgba(226,194,127,0.35), inset 0 0 30px rgba(226,194,127,0.25)" }}
        initial={{ scale: 0.3, opacity: 0.9 }}
        animate={{ scale: 2.3, opacity: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        className="absolute size-56 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(226,194,127,0.45), transparent 65%)" }}
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1.4, opacity: [0, 1, 0] }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
      {motes.map((mote, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            width: mote.size,
            height: mote.size,
            background: "radial-gradient(circle, #FFF3D1 0%, #E2C27F 45%, rgba(197,160,89,0) 75%)",
          }}
          initial={{ x: 0, y: 0, scale: 1.2, opacity: 1 }}
          animate={{ x: mote.x, y: mote.y, scale: 0.2, opacity: 0 }}
          transition={{ duration: mote.duration, delay: mote.delay, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </div>
  );
}

export function GoldBurst({ burstKey }: { burstKey: number | null }) {
  return <AnimatePresence>{burstKey !== null && <Burst key={burstKey} seed={burstKey} />}</AnimatePresence>;
}
