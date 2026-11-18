"use client";

import Image from "next/image";
import type { CalcResult } from "@/lib/calc";
import { BASE_PATH, COMPANY, CONTACT, HERO_ID, type TechnologyId } from "@/lib/defaults";
import { techName } from "@/lib/i18n";
import { dayCount } from "@/lib/inputs";
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
  /** Day counts of the three cards (raw text). */
  days: [string, string, string];
  /** Days per year the hotel is open; the annual figures cover exactly these days. */
  season: number;
  /** Makes the day counts editable (screen only). */
  onDaysChange?: (days: [string, string, string]) => void;
  /** Shows a button that prints (saves as PDF) just this chart. */
  onPdf?: () => void;
}

/**
 * The electricity bill per day, month and year as three bar cards a buyer reads at a glance:
 * every bar carries its amount and kWh, and each card ends with what the hero saves against each competitor.
 */
export function ConsumptionPeriods({ result, currency, rooms, days, season, onDaysChange, onPdf }: Props) {
  const { s, f, lang } = useI18n();
  if (!result) return null;

  // Annual figures scaled to each card's day count. 30 days reads as "1 month" (1/12 of the year,
  // ≈30.4 days) and 365 as "1 year"; any other count is shown as days. Invalid entries drop their card.
  const periods = days.flatMap((d, i) => {
    const n = dayCount(d);
    if (n === null) return [];
    // Annual figures cover `season` open days; a month is 365/12 open days.
    if (n === 30) return [{ key: i, label: s.oneMonth, k: 365 / 12 / season }];
    if (n === 365) return [{ key: i, label: season < 365 ? s.oneSeason(f.number(season)) : s.oneYear, k: 1 }];
    return [{ key: i, label: s.nDays(f.number(n)), k: n / season }];
  });
  const kwh = (v: number) => `${f.number(v, v < 100 ? 1 : 0)} kWh`;
  const money = (v: number) => f.money(v, currency, { digits: Math.abs(v) < 100 ? 2 : 0 });
  const max = Math.max(...result.results.map((r) => r.annualCost), 1e-9);
  const savings = result.comparisons.filter((c) => c.annualSavings > 0);

  return (
    <Panel title={s.consumptionTitle(periods.map((p) => p.label).join(", "))} subtitle={s.consumptionSubtitle(s.roomsCount(f.number(rooms)))}>
      {onDaysChange && (
        <div className="mt-4 flex flex-wrap items-center gap-2 print:hidden">
          <span className="text-sm font-medium text-slate-ui">{s.daysLabel}</span>
          {days.map((d, i) => (
            <input
              key={i}
              className="input h-10 w-24 text-center"
              inputMode="numeric"
              pattern="[0-9]*"
              aria-label={s.periodN(i + 1)}
              aria-invalid={dayCount(d) === null}
              value={d}
              onChange={(e) => {
                const next: [string, string, string] = [...days];
                next[i] = e.target.value.replace(/[^\d]/g, "").slice(0, 4);
                onDaysChange(next);
              }}
            />
          ))}
        </div>
      )}
      <div className="mt-6 grid gap-4 md:grid-cols-3 print:grid-cols-3">
        {periods.map((p) => (
          <div key={p.key} className="flex flex-col rounded-2xl border border-line p-5 print:p-4">
            <div className="text-center text-2xl font-bold uppercase tracking-wide text-navy">{p.label}</div>

            <div className="mt-5 space-y-4">
              {result.results.map((r) => {
                const isHero = r.tech.id === HERO_ID;
                const cost = r.annualCost * p.k;
                return (
                  <div key={r.tech.id} title={`${techName(r.tech, lang)}: ${money(cost)} · ${kwh(r.annualKwh * p.k)}`}>
                    {/* Label and amount always on separate lines, so rows line up across the three cards. */}
                    <div className="flex flex-col">
                      <span className={`text-sm ${isHero ? "font-semibold text-navy" : "text-slate-ui"}`}>{shortName(techName(r.tech, lang))}</span>
                      <span className={`num self-end text-xl font-bold tracking-tight print:text-lg ${isHero ? "text-navy" : "text-ink"}`}>
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

/** The chart as a printed A4 page: logo, chart, contact line. Used for the chart-only PDF and as page 2 of the summary. */
export function ConsumptionPrintPage({ result, currency, rooms, days, season }: Omit<Props, "onPdf" | "onDaysChange">) {
  return (
    <div>
      <Image src={`${BASE_PATH}/logo.png`} alt={COMPANY} width={2685} height={729} className="mb-4 h-12 w-auto" />
      <ConsumptionPeriods result={result} currency={currency} rooms={rooms} days={days} season={season} />
      <p className="mt-4 text-center text-xs font-medium text-navy">
        {COMPANY} · {CONTACT.phone} · {CONTACT.email} · {CONTACT.website.replace(/^https?:\/\//, "")}
      </p>
    </div>
  );
}
