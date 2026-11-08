"use client";

import { useSyncExternalStore } from "react";
import type { Comparison } from "@/lib/calc";
import { contactLinks } from "@/lib/contact";
import type { Country } from "@/lib/countries";
import { CONTACT } from "@/lib/defaults";
import type { SalesInputs } from "@/lib/inputs";
import { useI18n } from "./I18nProvider";

interface Props {
  inputs: SalesInputs;
  comparison: Comparison | null;
  country: Country;
  /** Currency the comparison amounts are expressed in (local, or USD in USD view). */
  currency: string;
  tariff: number;
  fxRate: number;
}

const subscribeNever = () => () => {};
const readOrigin = () => `${window.location.origin}${window.location.pathname}`;

/** Client-only origin so the server render and hydration agree. */
export const useOrigin = () => useSyncExternalStore(subscribeNever, readOrigin, () => "");

export function ContactButtons({ mailto, whatsapp, tel, dark }: { mailto: string; whatsapp: string; tel: string; dark?: boolean }) {
  const { s } = useI18n();
  const action = "inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium transition active:scale-[0.98]";
  const primary = dark ? "bg-white text-navy hover:bg-mist" : "bg-navy text-white hover:bg-navy-700";
  const secondary = dark ? "border border-white/25 text-white hover:bg-white/10" : "border border-line bg-white text-navy hover:bg-mist";
  return (
    <div className="flex flex-wrap gap-3">
      <a href={mailto} className={`${action} ${primary}`}>
        <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="2.5" y="4.5" width="15" height="11" rx="2" />
          <path d="M3 6l7 5 7-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {s.emailSummary}
      </a>
      <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={`${action} ${secondary}`}>
        <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 17l1.2-3.6A7 7 0 1 1 6.9 16L3 17z" strokeLinejoin="round" />
          <path d="M7.5 7.5c0 3 2 5 5 5l1-1.2-1.6-.9-.8.8c-1-.4-1.8-1.2-2.2-2.2l.8-.8-.9-1.6L7.5 7.5z" strokeLinejoin="round" />
        </svg>
        {s.whatsapp}
      </a>
      <a href={tel} className={`${action} ${secondary}`}>
        <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 3.5h3l1.5 3.5-2 1.5a9 9 0 0 0 5 5l1.5-2 3.5 1.5v3a1.5 1.5 0 0 1-1.6 1.5A13 13 0 0 1 2.5 5.1 1.5 1.5 0 0 1 4 3.5z" strokeLinejoin="round" />
        </svg>
        {s.call} {CONTACT.phone}
      </a>
    </div>
  );
}

/** Email / WhatsApp / call actions with the estimate and a deep link prefilled. No backend: mailto, wa.me and tel links. */
export function NextStep({ inputs, comparison, country, currency, tariff, fxRate }: Props) {
  const i18n = useI18n();
  const origin = useOrigin();
  if (!comparison) return null;
  const links = contactLinks({ ...i18n, inputs, comparison, country, currency, tariff, fxRate, origin });

  return (
    <section aria-label={i18n.s.nextStepTitle} className="rounded-3xl bg-navy p-6 text-white sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{i18n.s.nextStepTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/70">{i18n.s.nextStepIntro}</p>
        </div>
        <ContactButtons {...links} dark />
      </div>
      <p className="mt-5 text-xs text-white/50">
        {CONTACT.email} · {CONTACT.phone} · {CONTACT.website.replace(/^https?:\/\//, "")}
      </p>
    </section>
  );
}
