import { DAYS_PER_YEAR, HERO_ID, type MinibarSettings, type Technology } from "./defaults.ts";

export interface CalcInputs {
  rooms: number;
  /** Electricity tariff, local currency per kWh. */
  tariff: number;
  /** Local currency units per 1 USD. */
  fxRate: number;
  /** Selected comparison period in years. */
  years: number;
}

/** All money values are in the local currency unless the name says Usd. */
export interface TechResult {
  tech: Technology;
  annualKwh: number;
  annualCost: number;
  investment: number;
  investmentUsd: number;
  totalCost: number;
  /** Cumulative ownership cost per year; index 0 = purchase only. */
  cumulative: number[];
}

export interface Comparison {
  competitor: TechResult;
  annualEnergySavedKwh: number;
  annualSavings: number;
  annualSavingsUsd: number;
  /** Electricity saved over the selected period. */
  cumulativeSavings: number;
  additionalInvestment: number;
  additionalInvestmentUsd: number;
  /** Cumulative savings minus the additional purchase cost over the period. */
  netBenefit: number;
  /** null when the hero does not save energy against this competitor. */
  paybackYears: number | null;
  paybackMonths: number | null;
}

export interface CalcResult {
  hero: TechResult;
  /** Every active technology, in settings order. */
  results: TechResult[];
  /** One entry per active competitor, in settings order. */
  comparisons: Comparison[];
  chartYears: number;
}

const finite = (n: number) => (Number.isFinite(n) ? n : 0);

export const toUsd = (local: number, fxRate: number) => (fxRate > 0 ? local / fxRate : 0);

export function computeTech(tech: Technology, inputs: CalcInputs, chartYears: number): TechResult {
  const rooms = finite(inputs.rooms);
  const annualKwh = tech.dailyKwh * DAYS_PER_YEAR * rooms;
  const annualCost = annualKwh * finite(inputs.tariff);
  const investmentUsd = tech.unitPriceUsd * rooms;
  const investment = investmentUsd * finite(inputs.fxRate);
  const cumulative = Array.from({ length: chartYears + 1 }, (_, year) => investment + annualCost * year);
  return {
    tech,
    annualKwh,
    annualCost,
    investment,
    investmentUsd,
    totalCost: investment + annualCost * inputs.years,
    cumulative,
  };
}

export function compare(hero: TechResult, competitor: TechResult, inputs: CalcInputs): Comparison {
  const annualSavings = competitor.annualCost - hero.annualCost;
  const additionalInvestment = hero.investment - competitor.investment;
  let paybackYears: number | null = null;
  if (annualSavings > 0) paybackYears = Math.max(0, additionalInvestment / annualSavings);
  return {
    competitor,
    annualEnergySavedKwh: competitor.annualKwh - hero.annualKwh,
    annualSavings,
    annualSavingsUsd: toUsd(annualSavings, inputs.fxRate),
    cumulativeSavings: annualSavings * inputs.years,
    additionalInvestment,
    additionalInvestmentUsd: toUsd(additionalInvestment, inputs.fxRate),
    netBenefit: annualSavings * inputs.years - additionalInvestment,
    paybackYears,
    paybackMonths: paybackYears === null ? null : paybackYears * 12,
  };
}

export function calculate(settings: MinibarSettings, inputs: CalcInputs, minChartYears = 5): CalcResult {
  const chartYears = Math.max(minChartYears, Math.ceil(inputs.years));
  const active = settings.technologies.filter((t) => t.active || t.id === HERO_ID);
  const results = active.map((t) => computeTech(t, inputs, chartYears));
  const hero = results.find((r) => r.tech.id === HERO_ID);
  if (!hero) throw new Error(`Settings are missing the reference technology "${HERO_ID}"`);
  const comparisons = results.filter((r) => r !== hero).map((r) => compare(hero, r, inputs));
  return { hero, results, comparisons, chartYears };
}
