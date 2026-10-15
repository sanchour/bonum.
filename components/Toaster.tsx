"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { springs } from "@/lib/theme";
import { dismissToast, useToasts } from "@/lib/toast";

const TONES = {
  gold: "ring-gold/40 text-vellum",
  neutral: "ring-white/10 text-vellum",
  crimson: "ring-[#B4543A]/50 text-vellum",
} as const;

export function Toaster() {
  const toasts = useToasts();
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] z-[60] flex flex-col items-center gap-2 px-4 md:bottom-8 md:left-auto md:right-8 md:w-[420px] md:items-end md:px-0"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout="position"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96, transition: { duration: 0.18 } }}
            transition={springs.card}
            className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl bg-stone-raised/95 px-4 py-3.5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] ring-1 backdrop-blur-xl ${TONES[toast.tone]}`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-medium leading-snug">{toast.title}</p>
              {toast.detail && <p className="mt-0.5 line-clamp-2 font-serif text-[15px] italic text-parchment">{toast.detail}</p>}
            </div>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action?.run();
                  dismissToast(toast.id);
                }}
                className="shrink-0 rounded-lg bg-gold/10 px-3 py-1.5 text-[12.5px] font-medium text-gold ring-1 ring-gold/30 hover:bg-gold/20"
              >
                {toast.action.label}
              </button>
            )}
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 p-1 text-parchment/70 hover:text-vellum"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
