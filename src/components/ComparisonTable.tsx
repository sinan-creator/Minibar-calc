"use client";

import type { CalcResult } from "@/lib/calc";
import { HERO_ID } from "@/lib/defaults";
import { formatKwh, formatMoney, formatNumber, formatPayback } from "@/lib/format";
import { EmptyState, Panel, TECH_COLORS, plural } from "./ui";

interface Props {
  result: CalcResult | null;
  currency: string;
  years: number;
  fxRate: number;
}

/** All active technologies side by side, one column each, with the hero column highlighted. */
export function ComparisonTable({ result, currency, years, fxRate }: Props) {
  const title = "Side-by-side comparison";
  if (!result) {
    return (
      <Panel title={title}>
        <div className="mt-6">
          <EmptyState />
        </div>
      </Panel>
    );
  }

  const cmpFor = (id: string) => result.comparisons.find((c) => c.competitor.tech.id === id) ?? null;
  const showUsd = currency !== "USD";
  const money = (v: number) => formatMoney(v, currency);

  const rows: { label: string; cells: (string | { main: string; sub?: string })[] }[] = [
    {
      label: "Daily consumption per unit",
      cells: result.results.map((r) => `${formatNumber(r.tech.dailyKwh, 3)} kWh`),
    },
    {
      label: "Purchase price per unit",
      cells: result.results.map((r) => ({
        main: money(r.tech.unitPriceUsd * fxRate),
        sub: showUsd ? formatMoney(r.tech.unitPriceUsd, "USD") : undefined,
      })),
    },
    {
      label: "Initial investment",
      cells: result.results.map((r) => ({ main: money(r.investment), sub: showUsd ? formatMoney(r.investmentUsd, "USD") : undefined })),
    },
    { label: "Annual energy", cells: result.results.map((r) => formatKwh(r.annualKwh)) },
    { label: "Annual electricity cost", cells: result.results.map((r) => money(r.annualCost)) },
    { label: `Total cost over ${plural(years, "year")}`, cells: result.results.map((r) => money(r.totalCost)) },
    {
      label: `Annual savings with ${result.hero.tech.name}`,
      cells: result.results.map((r) => (r === result.hero ? "reference" : money(cmpFor(r.tech.id)?.annualSavings ?? 0))),
    },
    {
      label: `Savings over ${plural(years, "year")}`,
      cells: result.results.map((r) => (r === result.hero ? "—" : money(cmpFor(r.tech.id)?.cumulativeSavings ?? 0))),
    },
    {
      label: "Payback period",
      cells: result.results.map((r) => (r === result.hero ? "—" : formatPayback(cmpFor(r.tech.id)?.paybackMonths ?? null))),
    },
  ];

  return (
    <Panel title={title} subtitle="Every figure the cards show, in one table.">
      <div className="-mx-6 mt-6 overflow-x-auto px-6 sm:-mx-7 sm:px-7">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="py-3 pr-4 text-left font-medium text-slate-ui">Metric</th>
              {result.results.map((r) => {
                const isHero = r.tech.id === HERO_ID;
                return (
                  <th
                    key={r.tech.id}
                    className={`px-4 py-3 text-right font-semibold ${isHero ? "rounded-t-2xl bg-accent-soft text-navy" : "text-ink"}`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: TECH_COLORS[r.tech.id] }} />
                      {r.tech.name}
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
