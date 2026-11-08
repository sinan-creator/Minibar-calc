"use client";

import { useEffect } from "react";
import { BASE_PATH } from "@/lib/defaults";

/** Registers the offline cache worker in production builds only. */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register(`${BASE_PATH}/sw.js`).catch(() => {
      /* offline support is best-effort */
    });
  }, []);
  return null;
}
