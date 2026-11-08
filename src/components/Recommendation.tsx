"use client";

import type { CalcResult, Comparison } from "@/lib/calc";
import { COMPANY } from "@/lib/defaults";
import { formatPayback } from "@/lib/format";
import { plural } from "./ui";

interface Props {
  result: CalcResult | null;
  comparison: Comparison | null;
  years: number;
}

/** The manufacturer's honest guidance, worded like the elektromarla.com product page. */
export function Recommendation({ result, comparison, years }: Props) {
  if (!result || !comparison) return null;
  const hero = result.hero.tech.name;
  const absorption = result.results.find((r) => r.tech.id === "absorption")?.tech.name;
  const peltier = result.results.find((r) => r.tech.id === "peltier")?.tech.name;
  const silentOnes = [absorption, peltier].filter(Boolean).join(" or ");

  const items = [
    {
      title: `Operating the hotel for ${plural(Math.max(years, 5), "year")} or more`,
      body: `${hero}. Against ${comparison.competitor.tech.name} it pays back its higher price in ${formatPayback(
        comparison.paybackMonths,
      ).toLowerCase()} and keeps saving every year after that.`,
    },
    ...(silentOnes
      ? [
          {
            title: "Absolute silence is a must",
            body: `${silentOnes}. Neither has a compressor, so there is nothing for a light sleeper to hear. The price of that silence is electricity.`,
          },
        ]
      : []),
    ...(peltier
      ? [
          {
            title: "Budget-focused project in a cooler climate",
            body: `${peltier}. The lowest purchase price of the silent options; make sure summer room temperatures stay moderate.`,
          },
        ]
      : []),
  ];

  return (
    <section aria-label={`${COMPANY} recommendation`} className="rounded-3xl border border-line bg-white p-6 sm:p-7">
      <h2 className="text-lg font-semibold tracking-tight text-navy">{COMPANY}&apos;s honest advice</h2>
      <p className="mt-1 text-sm text-slate-ui">We make all three technologies in our Istanbul factory, so the choice is about your hotel, not ours.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <div key={item.title} className="rounded-2xl bg-mist p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-ui">{item.title}</div>
            <p className="mt-2 text-sm leading-relaxed text-ink">
              <span className="font-semibold text-navy">{item.body.split(". ")[0]}.</span> {item.body.split(". ").slice(1).join(". ")}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
