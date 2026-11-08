"use client";

import type { Comparison } from "@/lib/calc";
import type { Country } from "@/lib/countries";
import { COMPANY } from "@/lib/defaults";
import { formatMoney, formatNumber } from "@/lib/format";

interface Props {
  comparison: Comparison | null;
  country: Country;
  rooms: number;
}

export function Headline({ comparison, country, rooms }: Props) {
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
      <p className="mt-5 text-base text-slate-ui sm:text-lg">
        {comparison ? (
          <>
            {currency !== "USD" && (
              <>
                ≈ <span className="num font-medium text-ink">{formatMoney(Math.max(0, comparison.annualSavings), currency)}</span> per
                year ·{" "}
              </>
            )}
            compared with {comparison.competitor.tech.name} minibars · {formatNumber(rooms)} rooms
          </>
        ) : (
          "Complete the hotel details to see the savings for this market."
        )}
      </p>
    </section>
  );
}
