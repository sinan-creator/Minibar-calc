"use client";

import type { CalcResult, Comparison, TechResult } from "@/lib/calc";
import { HERO_ID, TECH_BLURBS } from "@/lib/defaults";
import { formatKwh, formatMoney, formatNumber, formatPayback } from "@/lib/format";
import { EmptyState, TECH_COLORS, plural } from "./ui";

interface Props {
  result: CalcResult | null;
  comparison: Comparison | null;
  currency: string;
  years: number;
  fxRate: number;
}

export function TechCards({ result, comparison, currency, years, fxRate }: Props) {
  if (!result) return <EmptyState />;
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {result.results.map((r) => {
        const isHero = r.tech.id === HERO_ID;
        const cmp = result.comparisons.find((c) => c.competitor === r) ?? null;
        return (
          <TechCard
            key={r.tech.id}
            r={r}
            isHero={isHero}
            cmp={isHero ? comparison : cmp}
            selected={!isHero && cmp !== null && cmp === comparison}
            heroName={result.hero.tech.name}
            currency={currency}
            years={years}
            fxRate={fxRate}
          />
        );
      })}
    </div>
  );
}

function TechCard({
  r,
  isHero,
  cmp,
  selected,
  heroName,
  currency,
  years,
  fxRate,
}: {
  r: TechResult;
  isHero: boolean;
  /** For competitors: their comparison. For the hero: the currently selected comparison. */
  cmp: Comparison | null;
  selected: boolean;
  heroName: string;
  currency: string;
  years: number;
  fxRate: number;
}) {
  const showUsd = currency !== "USD";
  const energyCut = cmp && cmp.competitor.annualKwh > 0 ? cmp.annualEnergySavedKwh / cmp.competitor.annualKwh : null;

  return (
    <article
      className={`flex flex-col rounded-3xl p-6 sm:p-7 ${
        isHero
          ? "bg-navy text-white shadow-[0_30px_60px_-24px_rgba(11,31,58,0.6)]"
          : `border bg-white ${selected ? "border-accent/60" : "border-line"}`
      }`}
    >
      <header>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: TECH_COLORS[r.tech.id] }} />
            <h3 className="text-lg font-semibold tracking-tight">{r.tech.name}</h3>
          </div>
          {isHero ? (
            <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
              Most efficient
            </span>
          ) : (
            selected && (
              <span className="rounded-full bg-accent-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent">
                Comparing
              </span>
            )
          )}
        </div>
        <p className={`mt-2 text-sm leading-relaxed ${isHero ? "text-white/70" : "text-slate-ui"}`}>{TECH_BLURBS[r.tech.id]}</p>
      </header>

      <dl className="mt-6 space-y-4">
        <Row
          label="Purchase price per unit"
          value={formatMoney(r.tech.unitPriceUsd * fxRate, currency)}
          sub={showUsd ? formatMoney(r.tech.unitPriceUsd, "USD") : undefined}
        />
        <Row label="Initial investment" value={formatMoney(r.investment, currency)} sub={showUsd ? formatMoney(r.investmentUsd, "USD") : undefined} />
        <Row label="Annual energy" value={formatKwh(r.annualKwh)} sub={`${formatNumber(r.tech.dailyKwh, 3)} kWh/day per unit`} />
        <Row label="Annual electricity cost" value={formatMoney(r.annualCost, currency)} />
      </dl>

      <div className={`mt-6 border-t pt-5 ${isHero ? "border-white/15" : "border-line"}`}>
        <div className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${isHero ? "text-white/60" : "text-slate-ui"}`}>
          Total cost over {plural(years, "year")}
        </div>
        <div className="num mt-1 text-3xl font-semibold tracking-tight">{formatMoney(r.totalCost, currency)}</div>
      </div>

      {cmp && (
        <footer className={`mt-6 rounded-2xl p-4 ${isHero ? "bg-white/10" : "bg-accent-soft text-navy"}`}>
          <div className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${isHero ? "text-white/60" : "text-accent"}`}>
            {isHero ? `Compared with ${cmp.competitor.tech.name}` : `Switch to ${heroName}`}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
            <Stat label="Saves per year" value={formatMoney(cmp.annualSavings, currency)} />
            <Stat label={`Saves over ${plural(years, "year")}`} value={formatMoney(cmp.cumulativeSavings, currency)} />
            <Stat label="Payback" value={formatPayback(cmp.paybackMonths)} />
            <Stat label="Energy cut" value={energyCut === null ? "—" : `${formatNumber(energyCut * 100)}%`} />
          </div>
        </footer>
      )}
    </article>
  );
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-sm opacity-70">{label}</dt>
      <dd className="text-right">
        <div className="num text-base font-semibold">{value}</div>
        {sub && <div className="num text-xs opacity-60">{sub}</div>}
      </dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs opacity-70">{label}</div>
      <div className="num text-lg font-semibold tracking-tight">{value}</div>
    </div>
  );
}
