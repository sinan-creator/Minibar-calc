"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";
import type { CalcResult, Comparison } from "@/lib/calc";
import type { Country } from "@/lib/countries";
import { BASE_PATH, COMPANY, HERO_ID, type MinibarSettings } from "@/lib/defaults";
import { formatKwh, formatMoney, formatNumber, formatPayback, formatRate } from "@/lib/format";
import { DISCLAIMER, type SalesInputs } from "@/lib/inputs";
import { fxFor, tariffFor } from "@/lib/tariffs";
import { plural } from "./ui";

interface Props {
  inputs: SalesInputs;
  country: Country;
  result: CalcResult | null;
  comparison: Comparison | null;
  settings: MinibarSettings;
  tariff: number;
  fxRate: number;
}

const subscribeNever = () => () => {};
const todayLabel = () => new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

/** One-page A4 customer summary. Rendered only when printing. */
export function PrintSummary({ inputs, country, result, comparison, settings, tariff, fxRate }: Props) {
  // Client-only date (the static build has no meaningful "today").
  const today = useSyncExternalStore(subscribeNever, todayLabel, () => "");

  const currency = country.currency;
  const tariffMeta = tariffFor(country.code);
  const fxMeta = fxFor(currency);
  const years = inputs.years;
  const hero = settings.technologies.find((t) => t.id === HERO_ID)!;

  return (
    <div className="hidden print:block text-[11px] leading-snug text-ink">
      <header className="flex items-end justify-between border-b border-navy pb-3">
        <div>
          <Image src={`${BASE_PATH}/logo.png`} alt={COMPANY} width={2685} height={729} className="h-14 w-auto" />
          <div className="mt-2 text-sm text-slate-ui">Minibar electricity savings summary</div>
        </div>
        <div className="text-right text-slate-ui">
          <div>{today}</div>
          <div>
            {country.name} · {formatNumber(Number(inputs.rooms))} rooms
          </div>
        </div>
      </header>

      {result && comparison ? (
        <>
          <section className="mt-5 grid grid-cols-3 gap-3">
            <Big label="Annual electricity savings" value={formatMoney(comparison.annualSavings, currency)} sub={currency !== "USD" ? formatMoney(comparison.annualSavingsUsd, "USD") : undefined} />
            <Big label={`Savings over ${plural(years, "year")}`} value={formatMoney(comparison.cumulativeSavings, currency)} sub={`net of extra purchase cost: ${formatMoney(comparison.netBenefit, currency)}`} />
            <Big label="Payback period" value={formatPayback(comparison.paybackMonths)} sub={`${hero.name} vs ${comparison.competitor.tech.name}`} />
          </section>

          <section className="mt-5">
            <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-ui">Comparison</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line text-left text-slate-ui">
                  <th className="py-1.5 pr-2 font-medium">Technology</th>
                  <th className="py-1.5 pr-2 text-right font-medium">Price / unit</th>
                  <th className="py-1.5 pr-2 text-right font-medium">Initial investment</th>
                  <th className="py-1.5 pr-2 text-right font-medium">Annual energy</th>
                  <th className="py-1.5 pr-2 text-right font-medium">Annual electricity</th>
                  <th className="py-1.5 text-right font-medium">Total over {plural(years, "year")}</th>
                </tr>
              </thead>
              <tbody className="num">
                {result.results.map((r) => {
                  const isHero = r.tech.id === HERO_ID;
                  return (
                    <tr key={r.tech.id} className={`border-b border-line ${isHero ? "bg-accent-soft font-semibold text-navy" : ""}`}>
                      <td className="py-1.5 pr-2">{r.tech.name}</td>
                      <td className="py-1.5 pr-2 text-right">{formatMoney(r.tech.unitPriceUsd * fxRate, currency)}</td>
                      <td className="py-1.5 pr-2 text-right">{formatMoney(r.investment, currency)}</td>
                      <td className="py-1.5 pr-2 text-right">{formatKwh(r.annualKwh)}</td>
                      <td className="py-1.5 pr-2 text-right">{formatMoney(r.annualCost, currency)}</td>
                      <td className="py-1.5 text-right">{formatMoney(r.totalCost, currency)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          <section className="mt-5">
            <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-ui">Savings with {hero.name}</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line text-left text-slate-ui">
                  <th className="py-1.5 pr-2 font-medium">Compared with</th>
                  <th className="py-1.5 pr-2 text-right font-medium">Energy saved / year</th>
                  <th className="py-1.5 pr-2 text-right font-medium">Savings / year</th>
                  <th className="py-1.5 pr-2 text-right font-medium">Savings over {plural(years, "year")}</th>
                  <th className="py-1.5 pr-2 text-right font-medium">Additional investment</th>
                  <th className="py-1.5 text-right font-medium">Payback</th>
                </tr>
              </thead>
              <tbody className="num">
                {result.comparisons.map((c) => (
                  <tr key={c.competitor.tech.id} className="border-b border-line">
                    <td className="py-1.5 pr-2">{c.competitor.tech.name}</td>
                    <td className="py-1.5 pr-2 text-right">{formatKwh(c.annualEnergySavedKwh)}</td>
                    <td className="py-1.5 pr-2 text-right">{formatMoney(c.annualSavings, currency)}</td>
                    <td className="py-1.5 pr-2 text-right">{formatMoney(c.cumulativeSavings, currency)}</td>
                    <td className="py-1.5 pr-2 text-right">{formatMoney(c.additionalInvestment, currency)}</td>
                    <td className="py-1.5 text-right">{formatPayback(c.paybackMonths)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      ) : (
        <p className="mt-6 text-sm">Inputs were incomplete when this summary was printed.</p>
      )}

      <section className="mt-5 grid grid-cols-2 gap-6">
        <div>
          <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-ui">Assumptions</h2>
          <dl className="space-y-1">
            <Item label="Hotel rooms" value={formatNumber(Number(inputs.rooms))} />
            <Item
              label="Electricity tariff"
              value={`${formatRate(tariff, currency)} per kWh`}
              note={
                inputs.tariffKind === "estimated" && tariffMeta
                  ? `Estimated, reference year ${tariffMeta.year}. ${tariffMeta.source}.`
                  : "Manually entered by the salesperson."
              }
            />
            <Item
              label="Exchange rate"
              value={`1 USD = ${formatNumber(fxRate, 4)} ${currency}`}
              note={
                currency === "USD"
                  ? undefined
                  : inputs.fxKind === "estimated" && fxMeta
                    ? `Estimated reference, ${fxMeta.year}. ${fxMeta.source}.`
                    : "Manually entered by the salesperson."
              }
            />
            <Item label="Comparison period" value={plural(years, "year")} />
            <Item label="Operating days" value="365 per year, 24 h per day" />
          </dl>
        </div>
        <div>
          <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-ui">Minibar specifications</h2>
          <table className="w-full border-collapse">
            <tbody className="num">
              {settings.technologies
                .filter((t) => t.active)
                .map((t) => (
                  <tr key={t.id} className="border-b border-line">
                    <td className="py-1 pr-2">{t.name}</td>
                    <td className="py-1 pr-2 text-right">{formatNumber(t.dailyKwh, 3)} kWh/day</td>
                    <td className="py-1 text-right">{formatMoney(t.unitPriceUsd, "USD")} / unit</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="mt-6 border-t border-line pt-3 text-[9.5px] leading-snug text-slate-ui">{DISCLAIMER}</footer>
    </div>
  );
}

function Big({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-line p-3">
      <div className="text-[10px] uppercase tracking-[0.12em] text-slate-ui">{label}</div>
      <div className="num mt-1 text-xl font-semibold tracking-tight text-navy">{value}</div>
      {sub && <div className="num mt-0.5 text-slate-ui">{sub}</div>}
    </div>
  );
}

function Item({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <div className="flex justify-between gap-3">
        <dt className="text-slate-ui">{label}</dt>
        <dd className="num text-right font-medium">{value}</dd>
      </div>
      {note && <div className="text-[9.5px] text-slate-ui">{note}</div>}
    </div>
  );
}
