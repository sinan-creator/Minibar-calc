"use client";

import type { CalcResult, Comparison } from "@/lib/calc";
import { HERO_ID } from "@/lib/defaults";
import { techName } from "@/lib/i18n";
import { useI18n } from "./I18nProvider";
import { EmptyState, Panel, TECH_COLORS } from "./ui";

interface ChartProps {
  result: CalcResult | null;
  comparison: Comparison | null;
  currency: string;
  years: number;
}

/** Stacked bars: purchase (solid) + electricity over the period (translucent). */
export function OwnershipBarChart({ result, currency, years }: ChartProps) {
  const { s, f, lang } = useI18n();
  const title = s.tcoTitle(f.years(years));
  if (!result) {
    return (
      <Panel title={title}>
        <div className="mt-6">
          <EmptyState />
        </div>
      </Panel>
    );
  }
  const max = Math.max(...result.results.map((r) => r.totalCost), 1);
  const heroTotal = result.hero.totalCost;

  return (
    <Panel title={title} subtitle={s.tcoSubtitle}>
      <div className="mt-8 flex items-start gap-4 sm:gap-8">
        {result.results.map((r) => {
          const pct = (r.totalCost / max) * 100;
          const investPct = r.totalCost > 0 ? (r.investment / r.totalCost) * 100 : 0;
          const color = TECH_COLORS[r.tech.id];
          const isHero = r.tech.id === HERO_ID;
          const saving = isHero || r.totalCost <= 0 ? null : 1 - heroTotal / r.totalCost;
          return (
            <div key={r.tech.id} className="flex flex-1 flex-col items-center">
              <div className="mb-3 h-12 text-center">
                <div className={`num text-lg font-semibold sm:text-xl ${isHero ? "text-accent" : "text-navy"}`}>
                  {r.totalCost >= 10_000_000 ? f.money(r.totalCost, currency, { compact: true, digits: 2 }) : f.money(r.totalCost, currency)}
                </div>
                {saving !== null && saving > 0 && <div className="text-xs text-slate-ui">{s.inverterSaves(f.number(saving * 100))}</div>}
              </div>
              <div className="flex h-56 w-full max-w-[150px] items-end">
                <div
                  className="flex w-full flex-col-reverse overflow-hidden rounded-2xl transition-[height] duration-500 ease-out"
                  style={{ height: `${Math.max(pct, 1.5)}%` }}
                >
                  <div style={{ height: `${investPct}%`, background: color }} title={s.purchase} />
                  <div style={{ height: `${100 - investPct}%`, background: color, opacity: 0.38 }} />
                </div>
              </div>
              <div className="mt-3 text-center text-sm font-medium text-ink">{techName(r.tech, lang)}</div>
              <div className="num mt-1 space-y-0.5 text-center text-[11px] text-slate-ui">
                <div>
                  <span className="mr-1 inline-block h-2 w-2 rounded-sm align-middle" style={{ background: color }} />
                  {s.purchase} <span className="font-semibold text-ink">{f.money(r.investment, currency)}</span>
                </div>
                <div>
                  <span className="mr-1 inline-block h-2 w-2 rounded-sm align-middle" style={{ background: color, opacity: 0.38 }} />
                  {s.electricity} <span className="font-semibold text-ink">{f.money(r.totalCost - r.investment, currency)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex flex-wrap gap-5 text-xs text-slate-ui">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-navy" /> {s.legendPurchase}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-navy/35" /> {s.electricityOver(f.years(years))}
        </span>
      </div>
    </Panel>
  );
}

/** Axis ticks at 0, step, 2·step … covering `max`, with a round step (1, 2, 2.5 or 5 × 10ⁿ). */
function niceTicks(max: number, target = 5): number[] {
  const rough = max / target;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((v) => v >= rough) ?? 10 * pow;
  const count = Math.ceil(max / step);
  return Array.from({ length: count + 1 }, (_, i) => i * step);
}

/** Cumulative cost lines with break-even markers where the hero overtakes each competitor. */
export function CumulativeChart({ result, comparison, currency }: ChartProps) {
  const { s, f, lang } = useI18n();
  const title = s.cumulativeTitle;
  if (!result) {
    return (
      <Panel title={title}>
        <div className="mt-6">
          <EmptyState />
        </div>
      </Panel>
    );
  }

  const W = 720;
  const H = 320;
  const m = { top: 20, right: 28, bottom: 40, left: 68 };
  const N = result.chartYears;
  const hero = result.hero;
  const ticks = niceTicks(Math.max(...result.results.map((r) => r.cumulative[N] ?? 0), 1));
  const maxY = ticks[ticks.length - 1];
  const x = (t: number) => m.left + (t / N) * (W - m.left - m.right);
  const y = (v: number) => m.top + (1 - v / maxY) * (H - m.top - m.bottom);
  const costAt = (r: { investment: number; annualCost: number }, t: number) => r.investment + r.annualCost * t;
  const linePath = (r: { cumulative: number[] }) => r.cumulative.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ");

  const breakEvens = result.comparisons
    .filter((c) => c.paybackYears !== null && c.paybackYears <= N)
    .map((c) => ({ c, t: c.paybackYears as number }));

  let savingsArea: string | null = null;
  if (comparison && comparison.paybackYears !== null && comparison.paybackYears < N) {
    const t0 = comparison.paybackYears;
    const comp = comparison.competitor;
    savingsArea = `M${x(t0)},${y(costAt(hero, t0))} L${x(N)},${y(costAt(comp, N))} L${x(N)},${y(costAt(hero, N))} Z`;
  }

  return (
    <Panel title={title} subtitle={s.cumulativeSubtitle}>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-6 h-auto w-full" role="img" aria-label={s.cumulativeAria}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={m.left} x2={W - m.right} y1={y(v)} y2={y(v)} stroke="#e3e8ef" />
            <text x={m.left - 10} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#6b7280" className="num">
              {f.money(v, currency, { compact: true, digits: 1 })}
            </text>
          </g>
        ))}
        {Array.from({ length: N + 1 }, (_, i) => (
          <text key={i} x={x(i)} y={H - 14} textAnchor="middle" fontSize="11" fill="#6b7280">
            {i === 0 ? s.purchase : N > 6 && i % 2 === 1 && i !== N ? "" : s.yearN(i)}
          </text>
        ))}
        {savingsArea && <path d={savingsArea} fill="#2b6cf6" opacity="0.08" />}
        {result.results.map((r) => (
          <path
            key={r.tech.id}
            d={linePath(r)}
            fill="none"
            stroke={TECH_COLORS[r.tech.id]}
            strokeWidth={r === hero ? 3.5 : 2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-500"
          />
        ))}
        {breakEvens.map(({ c, t }) => (
          <g key={c.competitor.tech.id}>
            <line x1={x(t)} x2={x(t)} y1={y(costAt(hero, t))} y2={H - m.bottom} stroke="#2b6cf6" strokeDasharray="3 4" />
            <circle cx={x(t)} cy={y(costAt(hero, t))} r="5.5" fill="#fff" stroke="#2b6cf6" strokeWidth="2.5" />
          </g>
        ))}
      </svg>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {result.results.map((r) => {
          const c = result.comparisons.find((cmp) => cmp.competitor === r);
          return (
            <li key={r.tech.id} className="flex items-center gap-3 text-sm">
              <span className="h-1 w-6 rounded-full" style={{ background: TECH_COLORS[r.tech.id] }} />
              <span className="font-medium text-ink">{techName(r.tech, lang)}</span>
              {c && (
                <span className="num ml-auto text-right text-slate-ui">
                  {c.paybackMonths === null
                    ? s.noBreakEven
                    : c.paybackYears !== null && c.paybackYears > N
                      ? s.breakEvenAfter(f.years(N))
                      : s.breakEvenIn(f.payback(c.paybackMonths))}
                </span>
              )}
              {r === hero && <span className="ml-auto text-right text-slate-ui">{s.reference}</span>}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
