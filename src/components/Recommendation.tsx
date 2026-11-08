"use client";

import type { CalcResult, Comparison } from "@/lib/calc";
import { techName } from "@/lib/i18n";
import { useI18n } from "./I18nProvider";

interface Props {
  result: CalcResult | null;
  comparison: Comparison | null;
  years: number;
}

/** The manufacturer's honest guidance, worded like the elektromarla.com product page. */
export function Recommendation({ result, comparison, years }: Props) {
  const { s, f, lang } = useI18n();
  if (!result || !comparison) return null;
  const name = (id: string) => {
    const r = result.results.find((x) => x.tech.id === id);
    return r ? techName(r.tech, lang) : null;
  };
  const hero = techName(result.hero.tech, lang);
  const absorption = name("absorption");
  const peltier = name("peltier");
  const silentOnes = [absorption, peltier].filter(Boolean).join(` ${s.or} `);

  const items = [
    {
      title: s.adviceLongTitle(f.years(Math.max(years, 5))),
      lead: hero,
      body: s.adviceLongBody(techName(comparison.competitor.tech, lang), f.payback(comparison.paybackMonths).toLowerCase()),
    },
    ...(silentOnes ? [{ title: s.adviceSilenceTitle, lead: silentOnes, body: s.adviceSilenceBody }] : []),
    ...(peltier ? [{ title: s.adviceBudgetTitle, lead: peltier, body: s.adviceBudgetBody }] : []),
  ];

  return (
    <section aria-label={s.adviceTitle} className="rounded-3xl border border-line bg-white p-6 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-ui">{s.adviceTitle}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">{s.tagline}</h2>
      <p className="mt-2 max-w-3xl text-sm text-slate-ui">{s.adviceIntro}</p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <div key={item.title} className="rounded-2xl bg-mist p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-ui">{item.title}</div>
            <p className="mt-2 text-sm leading-relaxed text-ink">
              <span className="font-semibold text-navy">{item.lead}.</span> {item.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
