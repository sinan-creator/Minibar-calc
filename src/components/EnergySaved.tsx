"use client";

import type { Comparison } from "@/lib/calc";
import { techName } from "@/lib/i18n";
import { useI18n } from "./I18nProvider";

/** One large figure: the electricity the hero technology saves against the selected competitor. */
export function EnergySaved({ comparison, years }: { comparison: Comparison | null; years: number }) {
  const { s, f, lang } = useI18n();
  if (!comparison || comparison.annualEnergySavedKwh <= 0) return null;
  const kwh = comparison.annualEnergySavedKwh;

  return (
    <section aria-label={s.lessElectricity} className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3 rounded-3xl bg-mist px-6 py-6 sm:px-7">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-ui">{s.switchingFrom(techName(comparison.competitor.tech, lang))}</div>
        <div className="num mt-2 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
          {f.number(kwh)} <span className="text-xl font-medium text-slate-ui sm:text-2xl">kWh</span>
        </div>
        <div className="mt-1 text-sm text-slate-ui">{s.lessElectricity}</div>
      </div>
      <div className="text-right">
        <div className="num text-2xl font-semibold tracking-tight text-navy">{f.number(kwh * years)} kWh</div>
        <div className="text-sm text-slate-ui">{s.over(f.years(years))}</div>
      </div>
    </section>
  );
}
