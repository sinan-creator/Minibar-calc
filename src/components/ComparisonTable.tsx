"use client";

import type { CalcResult } from "@/lib/calc";
import { HERO_ID } from "@/lib/defaults";
import { techName } from "@/lib/i18n";
import { useI18n } from "./I18nProvider";
import { EmptyState, Panel, TECH_COLORS } from "./ui";

interface Props {
  result: CalcResult | null;
  currency: string;
  years: number;
  fxRate: number;
}

/** All active technologies side by side, one column each, with the hero column highlighted. */
export function ComparisonTable({ result, currency, years, fxRate }: Props) {
  const { s, f, lang } = useI18n();
  if (!result) {
    return (
      <Panel title={s.tableTitle}>
        <div className="mt-6">
          <EmptyState />
        </div>
      </Panel>
    );
  }

  const cmpFor = (id: string) => result.comparisons.find((c) => c.competitor.tech.id === id) ?? null;
  const showUsd = currency !== "USD";
  const money = (v: number) => f.money(v, currency);
  const yearsLabel = f.years(years);

  const rows: { label: string; cells: (string | { main: string; sub?: string })[] }[] = [
    { label: s.coolingPrinciple, cells: result.results.map((r) => s.facts[r.tech.id].principle) },
    { label: s.noiseLevel, cells: result.results.map((r) => s.facts[r.tech.id].noise) },
    { label: s.coolingPerformance, cells: result.results.map((r) => s.facts[r.tech.id].performance) },
    { label: s.idealFor, cells: result.results.map((r) => s.facts[r.tech.id].idealFor) },
    { label: s.dailyPerUnit, cells: result.results.map((r) => `${f.number(r.tech.dailyKwh, 3)} kWh`) },
    {
      label: s.pricePerUnit,
      cells: result.results.map((r) => ({ main: money(r.tech.unitPriceUsd * fxRate), sub: showUsd ? f.money(r.tech.unitPriceUsd, "USD") : undefined })),
    },
    {
      label: s.initialInvestment,
      cells: result.results.map((r) => ({ main: money(r.investment), sub: showUsd ? f.money(r.investmentUsd, "USD") : undefined })),
    },
    { label: s.annualEnergy, cells: result.results.map((r) => f.kwh(r.annualKwh)) },
    { label: s.annualElectricityCost, cells: result.results.map((r) => money(r.annualCost)) },
    { label: s.totalCostOver(yearsLabel), cells: result.results.map((r) => money(r.totalCost)) },
    {
      label: s.annualSavingsWith(techName(result.hero.tech, lang)),
      cells: result.results.map((r) => (r === result.hero ? s.reference : money(cmpFor(r.tech.id)?.annualSavings ?? 0))),
    },
    {
      label: s.savingsOver(yearsLabel),
      cells: result.results.map((r) => (r === result.hero ? "—" : money(cmpFor(r.tech.id)?.cumulativeSavings ?? 0))),
    },
    {
      label: s.paybackPeriod,
      cells: result.results.map((r) => (r === result.hero ? "—" : f.payback(cmpFor(r.tech.id)?.paybackMonths ?? null))),
    },
  ];

  return (
    <Panel title={s.tableTitle} subtitle={s.tableSubtitle}>
      <div className="-mx-6 mt-6 overflow-x-auto px-6 sm:-mx-7 sm:px-7">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="py-3 pr-4 text-left font-medium text-slate-ui">{s.metric}</th>
              {result.results.map((r) => {
                const isHero = r.tech.id === HERO_ID;
                return (
                  <th key={r.tech.id} className={`px-4 py-3 text-right font-semibold ${isHero ? "rounded-t-2xl bg-accent-soft text-navy" : "text-ink"}`}>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: TECH_COLORS[r.tech.id] }} />
                      {techName(r.tech, lang)}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="num">
            {rows.map((row, rowIndex) => (
              <tr key={row.label} className="border-b border-line last:border-0">
                <th scope="row" className="py-3 pr-4 text-left font-normal text-slate-ui">
                  {row.label}
                </th>
                {row.cells.map((cell, i) => {
                  const isHero = result.results[i].tech.id === HERO_ID;
                  const main = typeof cell === "string" ? cell : cell.main;
                  const sub = typeof cell === "string" ? undefined : cell.sub;
                  const last = rowIndex === rows.length - 1;
                  return (
                    <td
                      key={result.results[i].tech.id}
                      className={`px-4 py-3 text-right ${isHero ? `bg-accent-soft font-semibold text-navy ${last ? "rounded-b-2xl" : ""}` : "text-ink"}`}
                    >
                      <div>{main}</div>
                      {sub && <div className="text-xs font-normal opacity-60">{sub}</div>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
