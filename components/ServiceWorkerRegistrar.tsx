"use client";

import { useEffect } from "react";
import { withBase } from "@/lib/base";

/** Registers the offline shell worker in production builds only, so dev HMR is never cached. */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register(withBase("/sw.js"), { scope: withBase("/") }).catch((error: unknown) => {
        console.warn("[bonum] service worker registration failed", error);
      });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
