"use client";

import type { CalcResult, Comparison } from "@/lib/calc";
import type { Country } from "@/lib/countries";
import { COMPANY, type TechnologyId } from "@/lib/defaults";
import { formatMoney, formatNumber, formatRate } from "@/lib/format";
import { Segmented } from "./ui";

interface Props {
  result: CalcResult | null;
  comparison: Comparison | null;
  country: Country;
  rooms: number;
  tariff: number;
  mode: TechnologyId;
  onMode: (id: TechnologyId) => void;
}

/** "Thermoelectric (Peltier)" → "Peltier", "Inverter Compressor" → "Inverter". */
const shortName = (name: string) => /\(([^)]+)\)/.exec(name)?.[1] ?? name.split(" ")[0];

export function Headline({ result, comparison, country, rooms, tariff, mode, onMode }: Props) {
  const currency = country.currency;
  const savingsUsd = comparison ? Math.max(0, comparison.annualSavingsUsd) : null;

  return (
    <section className="pt-10 sm:pt-14">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-ui">
        Estimated annual savings · {country.name}
      </p>
      <h1 className="mt-4 max-w-5xl text-4xl font-semibold leading-[1.06] tracking-tight text-navy sm:text-5xl lg:text-6xl">
        Your hotel could save{" "}
        <span className="num text-accent">{savingsUsd === null ? "—" : formatMoney(savingsUsd, "USD")}</span> in electricity
        costs every year with {COMPANY} Inverter Minibars.
      </h1>
      <p className="mt-5 max-w-3xl text-base text-slate-ui sm:text-lg">
        {comparison ? (
          <>
            {currency !== "USD" && (
              <>
                ≈ <span className="num font-medium text-ink">{formatMoney(Math.max(0, comparison.annualSavings), currency)}</span> per
                year{" "}
              </>
            )}
            compared with {comparison.competitor.tech.name} minibars across {formatNumber(rooms)} rooms at{" "}
            <span className="num">{formatRate(tariff, currency)}</span> per kWh. That is{" "}
            <span className="num font-medium text-ink">{formatNumber(Math.max(0, comparison.annualEnergySavedKwh))} kWh</span> less
            electricity every year.
          </>
        ) : (
          "Complete the hotel details to see the savings for this market."
        )}
      </p>

      {result && result.comparisons.length > 1 && (
        <div className="mt-8">
          <Segmented<TechnologyId>
            ariaLabel="Comparison mode"
            size="lg"
            value={comparison?.competitor.tech.id ?? mode}
            onChange={onMode}
            options={result.comparisons.map((c) => ({
              value: c.competitor.tech.id,
              label: `${shortName(result.hero.tech.name)} vs ${shortName(c.competitor.tech.name)}`,
            }))}
          />
        </div>
      )}
    </section>
  );
}
