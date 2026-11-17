"use client";

import type { CalcResult, Comparison } from "@/lib/calc";
import { HERO_ID } from "@/lib/defaults";
import { techName } from "@/lib/i18n";
import { useI18n } from "./I18nProvider";
import { Panel, TECH_COLORS, shortName } from "./ui";

interface Props {
  result: CalcResult | null;
  comparison: Comparison | null;
  currency: string;
  rooms: number;
}

/**
 * The electricity bill per day, month and year as three bar cards a buyer reads at a glance:
 * every bar carries its amount and kWh, and each card ends with what the hero saves.
 */
export function ConsumptionPeriods({ result, comparison, currency, rooms }: Props) {
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
  const saving = comparison && comparison.annualSavings > 0 ? comparison : null;

  return (
    <Panel title={s.consumptionTitle} subtitle={s.consumptionSubtitle(s.roomsCount(f.number(rooms)))}>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {periods.map((p) => (
          <div key={p.label} className="flex flex-col rounded-2xl border border-line p-5">
            <div className="text-center text-2xl font-bold uppercase tracking-wide text-navy">{p.label}</div>

            <div className="mt-5 flex-1 space-y-4">
              {result.results.map((r) => {
                const isHero = r.tech.id === HERO_ID;
                const cost = r.annualCost * p.k;
                return (
                  <div key={r.tech.id} title={`${techName(r.tech, lang)}: ${money(cost)} · ${kwh(r.annualKwh * p.k)}`}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`text-sm ${isHero ? "font-semibold text-navy" : "text-slate-ui"}`}>{shortName(techName(r.tech, lang))}</span>
                      <span className={`num text-xl font-bold tracking-tight ${isHero ? "text-navy" : "text-ink"}`}>{money(cost)}</span>
                    </div>
                    <div className="mt-1 h-5 w-full rounded bg-mist">
                      <div
                        className="h-full rounded transition-[width] duration-500 ease-out"
                        style={{ width: `${Math.max((r.annualCost / max) * 100, 1.5)}%`, background: TECH_COLORS[r.tech.id] }}
                      />
                    </div>
                    <div className="num mt-0.5 text-right text-xs text-slate-ui">{kwh(r.annualKwh * p.k)}</div>
                  </div>
                );
              })}
            </div>

            {saving && (
              <div className="mt-5 rounded-xl bg-accent-soft px-4 py-3 text-center">
                <div className="text-xs font-medium text-slate-ui">
                  {s.heroSavesVs(shortName(techName(result.hero.tech, lang)), shortName(techName(saving.competitor.tech, lang)))}
                </div>
                <div className="num mt-0.5 text-2xl font-bold tracking-tight text-navy">{money(saving.annualSavings * p.k)}</div>
                <div className="num text-xs text-slate-ui">{s.lessKwh(kwh(saving.annualEnergySavedKwh * p.k))}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}
