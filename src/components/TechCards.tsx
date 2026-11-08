"use client";

import Image from "next/image";
import type { CalcResult, Comparison, TechResult } from "@/lib/calc";
import { BASE_PATH, HERO_ID, TECH_IMAGES } from "@/lib/defaults";
import { techName } from "@/lib/i18n";
import { useI18n } from "./I18nProvider";
import { EmptyState, TECH_COLORS } from "./ui";

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
            hero={result.hero}
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
  hero,
  currency,
  years,
  fxRate,
}: {
  r: TechResult;
  isHero: boolean;
  /** For competitors: their comparison. For the hero: the currently selected comparison. */
  cmp: Comparison | null;
  selected: boolean;
  hero: TechResult;
  currency: string;
  years: number;
  fxRate: number;
}) {
  const { s, f, lang } = useI18n();
  const showUsd = currency !== "USD";
  const energyCut = cmp && cmp.competitor.annualKwh > 0 ? cmp.annualEnergySavedKwh / cmp.competitor.annualKwh : null;
  const facts = s.facts[r.tech.id];
  const image = TECH_IMAGES[r.tech.id];
  const name = techName(r.tech, lang);
  const yearsLabel = f.years(years);

  return (
    <article
      className={`flex flex-col rounded-3xl p-6 sm:p-7 ${
        isHero
          ? "bg-navy text-white shadow-[0_30px_60px_-24px_rgba(11,31,58,0.6)]"
          : `border bg-white ${selected ? "border-accent/60" : "border-line"}`
      }`}
    >
      {image && (
        <figure className="mb-5 overflow-hidden rounded-2xl bg-mist">
          <Image
            src={`${BASE_PATH}${image}`}
            alt={`${name} · ${s.rearView}`}
            width={1200}
            height={900}
            sizes="(min-width: 768px) 33vw, 100vw"
            className="aspect-[4/3] h-auto w-full object-cover"
          />
          <figcaption className={`px-4 py-2 text-[11px] uppercase tracking-[0.14em] ${isHero ? "bg-white/10 text-white/70" : "text-slate-ui"}`}>
            {s.rearView}
          </figcaption>
        </figure>
      )}
      <header>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: TECH_COLORS[r.tech.id] }} />
            <h3 className="text-lg font-semibold tracking-tight">{name}</h3>
          </div>
          {isHero ? (
            <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">{s.mostEfficient}</span>
          ) : (
            selected && (
              <span className="rounded-full bg-accent-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent">{s.comparing}</span>
            )
          )}
        </div>
        <p className={`mt-2 text-sm leading-relaxed ${isHero ? "text-white/70" : "text-slate-ui"}`}>{s.blurbs[r.tech.id]}</p>
      </header>

      <dl className="mt-6 space-y-4">
        <Row label={s.cooling} value={facts.principle} small />
        <Row label={s.noiseLevel} value={facts.noise} small />
        <Row label={s.pricePerUnit} value={f.money(r.tech.unitPriceUsd * fxRate, currency)} sub={showUsd ? f.money(r.tech.unitPriceUsd, "USD") : undefined} />
        <Row label={s.initialInvestment} value={f.money(r.investment, currency)} sub={showUsd ? f.money(r.investmentUsd, "USD") : undefined} />
        <Row label={s.annualEnergy} value={f.kwh(r.annualKwh)} sub={s.perUnitPerDay(f.number(r.tech.dailyKwh, 3))} />
        <Row label={s.annualElectricityCost} value={f.money(r.annualCost, currency)} />
      </dl>

      <div className={`mt-6 border-t pt-5 ${isHero ? "border-white/15" : "border-line"}`}>
        <div className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${isHero ? "text-white/60" : "text-slate-ui"}`}>
          {s.totalCostOver(yearsLabel)}
        </div>
        <div className="num mt-1 text-3xl font-semibold tracking-tight">{f.money(r.totalCost, currency)}</div>
      </div>

      {cmp && (
        <footer className={`mt-6 rounded-2xl p-4 ${isHero ? "bg-white/10" : "bg-accent-soft text-navy"}`}>
          <div className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${isHero ? "text-white/60" : "text-accent"}`}>
            {isHero ? s.comparedWithTech(techName(cmp.competitor.tech, lang)) : s.switchTo(techName(hero.tech, lang))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
            <Stat label={s.savesPerYear} value={f.money(cmp.annualSavings, currency)} />
            <Stat label={s.savesOver(yearsLabel)} value={f.money(cmp.cumulativeSavings, currency)} />
            <Stat label={s.payback} value={f.payback(cmp.paybackMonths)} />
            <Stat label={s.energyCut} value={energyCut === null ? "—" : `${f.number(energyCut * 100)}%`} />
          </div>
        </footer>
      )}
    </article>
  );
}

function Row({ label, value, sub, small }: { label: string; value: string; sub?: string; small?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-sm opacity-70">{label}</dt>
      <dd className="text-right">
        <div className={`num font-semibold ${small ? "text-sm" : "text-base"}`}>{value}</div>
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
