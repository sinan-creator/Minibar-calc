/**
 * Analytics: Google Tag Manager (the elektromarla.com container) or a direct GA4 tag.
 * Both are optional build-time settings; with neither set nothing loads and track() is a no-op.
 */
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? "";
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

type Params = Record<string, string | number | boolean>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Sends a custom event. gtag when GA4 is loaded directly; otherwise a dataLayer push for GTM triggers. */
export function track(event: string, params: Params = {}) {
  if (typeof window === "undefined") return;
  if (window.gtag) window.gtag("event", event, params);
  else if (window.dataLayer) window.dataLayer.push({ event, ...params });
}
