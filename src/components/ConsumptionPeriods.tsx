"use client";

import type { CalcResult } from "@/lib/calc";
import { HERO_ID, type TechnologyId } from "@/lib/defaults";
import { techName } from "@/lib/i18n";
import { useI18n } from "./I18nProvider";
import { Button, Panel, TECH_COLORS, shortName } from "./ui";

/** Savings box colours per competitor: green against Absorption, light blue against Peltier. */
const SAVING_TONES: Partial<Record<TechnologyId, { box: string; text: string; amount: string }>> = {
  absorption: {
    box: "border-emerald-200 bg-emerald-50",
    text: "text-emerald-900",
    amount: "text-emerald-800",
  },
  peltier: {
    box: "border-sky-200 bg-sky-50",
    text: "text-sky-900",
    amount: "text-sky-800",
  },
};

interface Props {
  result: CalcResult | null;
  currency: string;
  rooms: number;
  /** Shows a button that prints (saves as PDF) just this chart. */
  onPdf?: () => void;
}

/**
 * The electricity bill per day, month and year as three bar cards a buyer reads at a glance:
 * every bar carries its amount and kWh, and each card ends with what the hero saves against each competitor.
 */
export function ConsumptionPeriods({ result, currency, rooms, onPdf }: Props) {
  const { s, f, lang } = useI18n();
  if (!result) return null;

  // Annual figures scaled down; a month is 1/12 of the year (≈30.4 days).
  const periods = [
    { label: s.oneDay, k: 1 / 365 },
    { label: s.oneMonth, k: 1 / 12 },
    { label: s.oneYear, k: 1 },
  ];
  const kwh = (v: number) => `${f.number(v, v < 100 ? 1 : 0)} kWh`;
  const money = (v: number) => f.money(v, currency, { digits: Math.abs(v) < 100 ? 2 : 0 });
  const max = Math.max(...result.results.map((r) => r.annualCost), 1e-9);
  const savings = result.comparisons.filter((c) => c.annualSavings > 0);

  return (
    <Panel title={s.consumptionTitle} subtitle={s.consumptionSubtitle(s.roomsCount(f.number(rooms)))}>
      <div className="mt-6 grid gap-4 md:grid-cols-3 print:grid-cols-3">
        {periods.map((p) => (
          <div key={p.label} className="flex flex-col rounded-2xl border border-line p-5 print:p-4">
            <div className="text-center text-2xl font-bold uppercase tracking-wide text-navy">{p.label}</div>

            <div className="mt-5 flex-1 space-y-4">
              {result.results.map((r) => {
                const isHero = r.tech.id === HERO_ID;
                const cost = r.annualCost * p.k;
                return (
                  <div key={r.tech.id} title={`${techName(r.tech, lang)}: ${money(cost)} · ${kwh(r.annualKwh * p.k)}`}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                      <span className={`text-sm ${isHero ? "font-semibold text-navy" : "text-slate-ui"}`}>{shortName(techName(r.tech, lang))}</span>
                      <span className={`num ml-auto text-xl font-bold tracking-tight print:text-lg ${isHero ? "text-navy" : "text-ink"}`}>
                        {money(cost)}
                      </span>
                    </div>
                    <div className="mt-1 h-5 w-full rounded bg-mist">
                      <div
                        className="h-full rounded transition-[width] duration-500 ease-out"
                        style={{
                          width: `${Math.max((r.annualCost / max) * 100, 1.5)}%`,
                          background: TECH_COLORS[r.tech.id],
                        }}
                      />
                    </div>
                    <div className="num mt-0.5 text-right text-xs text-slate-ui">{kwh(r.annualKwh * p.k)}</div>
                  </div>
                );
              })}
            </div>

            {savings.map((c, i) => {
              const tone = SAVING_TONES[c.competitor.tech.id] ?? SAVING_TONES.absorption!;
              return (
                <div key={c.competitor.tech.id} className={`${i === 0 ? "mt-5" : "mt-3"} rounded-xl border px-4 py-3 text-center ${tone.box}`}>
                  <div className={`text-xs font-medium ${tone.text}`}>
                    {s.heroSavesVs(shortName(techName(result.hero.tech, lang)), shortName(techName(c.competitor.tech, lang)))}
                  </div>
                  <div className={`num mt-0.5 text-2xl font-bold tracking-tight ${tone.amount}`}>{money(c.annualSavings * p.k)}</div>
                  <div className={`num text-xs ${tone.text}`}>{s.lessKwh(kwh(c.annualEnergySavedKwh * p.k))}</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {onPdf && (
        <div className="mt-5 flex justify-end print:hidden">
          <Button onClick={onPdf}>{s.savePdf}</Button>
        </div>
      )}
    </Panel>
  );
}
