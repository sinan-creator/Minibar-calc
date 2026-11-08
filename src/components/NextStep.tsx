"use client";

import { useSyncExternalStore } from "react";
import type { Comparison } from "@/lib/calc";
import { countryName, type Country } from "@/lib/countries";
import { CONTACT, PUBLIC_URL } from "@/lib/defaults";
import { techName } from "@/lib/i18n";
import { toSearchParams, type SalesInputs } from "@/lib/inputs";
import { useI18n } from "./I18nProvider";

interface Props {
  inputs: SalesInputs;
  comparison: Comparison | null;
  country: Country;
  tariff: number;
  fxRate: number;
}

const subscribeNever = () => () => {};
const readOrigin = () => `${window.location.origin}${window.location.pathname}`;

/** Email / WhatsApp / call actions with the estimate and a deep link prefilled. No backend: mailto, wa.me and tel links. */
export function NextStep({ inputs, comparison, country, tariff, fxRate }: Props) {
  const { s, f, lang, locale } = useI18n();
  // Client-only origin so the server render and hydration agree.
  const origin = useSyncExternalStore(subscribeNever, readOrigin, () => "");
  if (!comparison) return null;

  const currency = country.currency;
  const params = toSearchParams(inputs);
  params.set("lang", lang);
  const base = (PUBLIC_URL || origin).replace(/\?.*$/, "");
  const url = `${base}?${params.toString()}`;

  const body = s.emailBody({
    country: countryName(country, locale),
    rooms: f.number(Number(inputs.rooms)),
    competitor: techName(comparison.competitor.tech, lang),
    annual: f.money(comparison.annualSavings, currency),
    usd: currency !== "USD" ? f.money(comparison.annualSavingsUsd, "USD") : null,
    payback: f.payback(comparison.paybackMonths),
    years: f.years(inputs.years),
    periodSavings: f.money(comparison.cumulativeSavings, currency),
    tariff: f.rate(tariff, currency),
    fx: currency === "USD" ? "USD" : `1 USD = ${f.number(fxRate, 4)} ${currency}`,
    url,
  });
  const subject = s.emailSubject(countryName(country, locale), f.number(Number(inputs.rooms)));

  const mailto = `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const whatsapp = `https://wa.me/${CONTACT.phoneDigits}?text=${encodeURIComponent(body)}`;
  const tel = `tel:+${CONTACT.phoneDigits}`;

  const action = "inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium transition active:scale-[0.98]";

  return (
    <section aria-label={s.nextStepTitle} className="rounded-3xl bg-navy p-6 text-white sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{s.nextStepTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/70">{s.nextStepIntro}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href={mailto} className={`${action} bg-white text-navy hover:bg-mist`}>
            <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="2.5" y="4.5" width="15" height="11" rx="2" />
              <path d="M3 6l7 5 7-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {s.emailSummary}
          </a>
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={`${action} border border-white/25 text-white hover:bg-white/10`}>
            <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M3 17l1.2-3.6A7 7 0 1 1 6.9 16L3 17z" strokeLinejoin="round" />
              <path d="M7.5 7.5c0 3 2 5 5 5l1-1.2-1.6-.9-.8.8c-1-.4-1.8-1.2-2.2-2.2l.8-.8-.9-1.6L7.5 7.5z" strokeLinejoin="round" />
            </svg>
            {s.whatsapp}
          </a>
          <a href={tel} className={`${action} border border-white/25 text-white hover:bg-white/10`}>
            <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M4 3.5h3l1.5 3.5-2 1.5a9 9 0 0 0 5 5l1.5-2 3.5 1.5v3a1.5 1.5 0 0 1-1.6 1.5A13 13 0 0 1 2.5 5.1 1.5 1.5 0 0 1 4 3.5z" strokeLinejoin="round" />
            </svg>
            {s.call} {CONTACT.phone}
          </a>
        </div>
      </div>
      <p className="mt-5 text-xs text-white/50">
        {CONTACT.email} · {CONTACT.phone} · {CONTACT.website.replace(/^https?:\/\//, "")}
      </p>
    </section>
  );
}
