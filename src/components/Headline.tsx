"use client";

import type { Comparison } from "@/lib/calc";
import { countryName, type Country } from "@/lib/countries";
import { techName } from "@/lib/i18n";
import { useI18n } from "./I18nProvider";

interface Props {
  comparison: Comparison | null;
  country: Country;
  /** Currency the comparison amounts are expressed in. */
  currency: string;
  rooms: number;
}

export function Headline({ comparison, country, currency, rooms }: Props) {
  const { s, f, lang, locale } = useI18n();
  const savingsUsd = comparison ? Math.max(0, comparison.annualSavingsUsd) : null;

  return (
    <section className="pt-10 sm:pt-14">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-ui">{s.estimatedAnnual(countryName(country, locale))}</p>
      <h1 className="mt-4 max-w-5xl text-4xl font-semibold leading-[1.06] tracking-tight text-navy sm:text-5xl lg:text-6xl">
        {s.headlineBefore} <span className="num text-accent">{savingsUsd === null ? "—" : f.money(savingsUsd, "USD")}</span>{" "}
        {s.headlineAfter}
      </h1>
      <p className="mt-5 text-base text-slate-ui sm:text-lg">
        {comparison ? (
          <>
            {currency !== "USD" && (
              <>
                ≈ <span className="num font-medium text-ink">{f.money(Math.max(0, comparison.annualSavings), currency)}</span> / {s.perYear} ·{" "}
              </>
            )}
            {s.comparedWith(techName(comparison.competitor.tech, lang))} · {s.roomsCount(f.number(rooms))}
          </>
        ) : (
          s.completeDetails
        )}
      </p>
    </section>
  );
}
