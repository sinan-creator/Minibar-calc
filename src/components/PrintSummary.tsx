"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";
import type { CalcResult, Comparison } from "@/lib/calc";
import { countryName, type Country } from "@/lib/countries";
import { BASE_PATH, COMPANY, CONTACT, HERO_ID, type MinibarSettings } from "@/lib/defaults";
import { localizeSource, techName } from "@/lib/i18n";
import type { SalesInputs } from "@/lib/inputs";
import { fxFor, tariffFor } from "@/lib/tariffs";
import { useI18n } from "./I18nProvider";

interface Props {
  inputs: SalesInputs;
  country: Country;
  /** Currency the result amounts are expressed in. */
  currency: string;
  result: CalcResult | null;
  comparison: Comparison | null;
  settings: MinibarSettings;
  /** Tariff and exchange rate as entered (local currency). */
  tariff: number;
  fxRate: number;
  /** Multiplier from USD unit prices to the display currency (1 in USD view). */
  displayFx: number;
}

const subscribeNever = () => () => {};
const todayLabel = (locale: string) => () => new Date().toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });

/** One-page A4 customer summary. Rendered only when printing. */
export function PrintSummary({ inputs, country, currency, result, comparison, settings, tariff, fxRate, displayFx }: Props) {
  const { s, f, lang, locale } = useI18n();
  // Client-only date (the static build has no meaningful "today").
  const today = useSyncExternalStore(subscribeNever, todayLabel(locale), () => "");

  const local = country.currency;
  const tariffMeta = tariffFor(country.code);
  const fxMeta = fxFor(local);
  const years = inputs.years;
  const yearsLabel = f.years(years);
  const hero = settings.technologies.find((t) => t.id === HERO_ID)!;
  const heroName = techName(hero, lang);

  return (
    <div className="hidden print:block text-[11px] leading-snug text-ink">
      <header className="flex items-end justify-between border-b border-navy pb-3">
        <div>
          <Image src={`${BASE_PATH}/logo.png`} alt={COMPANY} width={2685} height={729} className="h-14 w-auto" />
          <div className="mt-2 text-sm text-slate-ui">{s.printTitle}</div>
        </div>
        <div className="text-right text-slate-ui">
          <div>{today}</div>
          <div>
            {countryName(country, locale)} · {s.roomsCount(f.number(Number(inputs.rooms)))}
          </div>
        </div>
      </header>

      {result && comparison ? (
        <>
          <section className="mt-5 grid grid-cols-3 gap-3">
            <Big label={s.annualSavings} value={f.money(comparison.annualSavings, currency)} sub={currency !== "USD" ? f.money(comparison.annualSavingsUsd, "USD") : undefined} />
            <Big label={s.savingsOver(yearsLabel)} value={f.money(comparison.cumulativeSavings, currency)} sub={s.netOfExtra(f.money(comparison.netBenefit, currency))} />
            <Big label={s.paybackPeriod} value={f.payback(comparison.paybackMonths)} sub={`${heroName} · ${techName(comparison.competitor.tech, lang)}`} />
          </section>

          <section className="mt-5">
            <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-ui">{s.comparison}</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line text-left text-slate-ui">
                  <th className="py-1.5 pr-2 font-medium">{s.technology}</th>
                  <th className="py-1.5 pr-2 text-right font-medium">{s.priceUnit}</th>
                  <th className="py-1.5 pr-2 text-right font-medium">{s.initialInvestment}</th>
                  <th className="py-1.5 pr-2 text-right font-medium">{s.annualEnergy}</th>
                  <th className="py-1.5 pr-2 text-right font-medium">{s.annualElectricityCost}</th>
                  <th className="py-1.5 text-right font-medium">{s.totalOver(yearsLabel)}</th>
                </tr>
              </thead>
              <tbody className="num">
                {result.results.map((r) => {
                  const isHero = r.tech.id === HERO_ID;
                  return (
                    <tr key={r.tech.id} className={`border-b border-line ${isHero ? "bg-accent-soft font-semibold text-navy" : ""}`}>
                      <td className="py-1.5 pr-2">{techName(r.tech, lang)}</td>
                      <td className="py-1.5 pr-2 text-right">{f.money(r.tech.unitPriceUsd * displayFx, currency)}</td>
                      <td className="py-1.5 pr-2 text-right">{f.money(r.investment, currency)}</td>
                      <td className="py-1.5 pr-2 text-right">{f.kwh(r.annualKwh)}</td>
                      <td className="py-1.5 pr-2 text-right">{f.money(r.annualCost, currency)}</td>
                      <td className="py-1.5 text-right">{f.money(r.totalCost, currency)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          <section className="mt-5">
            <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-ui">{s.savingsWith(heroName)}</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line text-left text-slate-ui">
                  <th className="py-1.5 pr-2 font-medium">{s.comparedWithCol}</th>
                  <th className="py-1.5 pr-2 text-right font-medium">{s.energySavedYear}</th>
                  <th className="py-1.5 pr-2 text-right font-medium">{s.savingsYear}</th>
                  <th className="py-1.5 pr-2 text-right font-medium">{s.savingsOver(yearsLabel)}</th>
                  <th className="py-1.5 pr-2 text-right font-medium">{s.additionalInvestment}</th>
                  <th className="py-1.5 text-right font-medium">{s.payback}</th>
                </tr>
              </thead>
              <tbody className="num">
                {result.comparisons.map((c) => (
                  <tr key={c.competitor.tech.id} className="border-b border-line">
                    <td className="py-1.5 pr-2">{techName(c.competitor.tech, lang)}</td>
                    <td className="py-1.5 pr-2 text-right">{f.kwh(c.annualEnergySavedKwh)}</td>
                    <td className="py-1.5 pr-2 text-right">{f.money(c.annualSavings, currency)}</td>
                    <td className="py-1.5 pr-2 text-right">{f.money(c.cumulativeSavings, currency)}</td>
                    <td className="py-1.5 pr-2 text-right">{f.money(c.additionalInvestment, currency)}</td>
                    <td className="py-1.5 text-right">{f.payback(c.paybackMonths)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      ) : (
        <p className="mt-6 text-sm">{s.printIncomplete}</p>
      )}

      <section className="mt-5 grid grid-cols-2 gap-6">
        <div>
          <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-ui">{s.assumptions}</h2>
          <dl className="space-y-1">
            <Item label={s.hotelRooms} value={f.number(Number(inputs.rooms))} />
            <Item
              label={s.electricityTariff}
              value={`${f.rate(tariff, local)} ${s.perKwh}`}
              note={
                inputs.tariffKind === "estimated" && tariffMeta
                  ? s.tariffNoteEstimated(tariffMeta.year, localizeSource(tariffMeta.source, lang))
                  : s.tariffNoteManual
              }
            />
            <Item
              label={s.exchangeRate}
              value={`1 USD = ${f.number(fxRate, 4)} ${local}`}
              note={
                local === "USD"
                  ? undefined
                  : inputs.fxKind === "estimated" && fxMeta
                    ? s.fxNoteEstimated(fxMeta.year, localizeSource(fxMeta.source, lang))
                    : s.tariffNoteManual
              }
            />
            <Item label={s.comparisonPeriod} value={yearsLabel} />
            <Item label={s.operatingDays} value={s.operatingDaysValue} />
          </dl>
        </div>
        <div>
          <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-ui">{s.specsTitle}</h2>
          <table className="w-full border-collapse">
            <tbody className="num">
              {settings.technologies
                .filter((t) => t.active)
                .map((t) => (
                  <tr key={t.id} className="border-b border-line">
                    <td className="py-1 pr-2">{techName(t, lang)}</td>
                    <td className="py-1 pr-2 text-right">{f.number(t.dailyKwh, 3)} kWh/24h</td>
                    <td className="py-1 text-right">
                      {f.money(t.unitPriceUsd, "USD")} {s.perUnit}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="mt-6 border-t border-line pt-3 text-[9.5px] leading-snug text-slate-ui">
        <p className="mb-1.5 text-[11px] font-medium text-navy">
          {COMPANY} · {s.tagline} · {CONTACT.phone} · {CONTACT.email} · {CONTACT.website.replace(/^https?:\/\//, "")}
        </p>
        {s.disclaimer}
      </footer>
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
