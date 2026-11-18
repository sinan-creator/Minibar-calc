// Smallest runnable check for the calculation engine and settings validation.
// Run: npm run check   (Node 24 strips the types natively, no build step)
import assert from "node:assert/strict";
import { calculate } from "../src/lib/calc.ts";
import { DEFAULT_SETTINGS } from "../src/lib/defaults.ts";
import { fromSearchParams, initialInputs, toSearchParams, validateInputs } from "../src/lib/inputs.ts";
import { validateSettings } from "../src/lib/settings.ts";

const close = (a: number, b: number, msg: string) => assert.ok(Math.abs(a - b) < 1e-6, `${msg}: ${a} vs ${b}`);

// Spec worked example: 200 rooms, USD 0.13/kWh, USD currency, 5 years.
const r = calculate(DEFAULT_SETTINGS, { rooms: 200, tariff: 0.13, fxRate: 1, years: 5 });
const [absorption, peltier, inverter] = r.results;

close(absorption.annualKwh, 0.9 * 365 * 200, "absorption annual kWh");
close(inverter.annualKwh, 0.13 * 365 * 200, "inverter annual kWh");
close(inverter.investment, 180 * 200, "inverter investment");
close(inverter.totalCost, 180 * 200 + 0.13 * 365 * 200 * 0.13 * 5, "inverter 5-year total");
close(inverter.cumulative[0], inverter.investment, "cumulative year 0");
assert.equal(inverter.cumulative.length, 6, "cumulative covers years 0..5");

const vsAbs = r.comparisons.find((c) => c.competitor.tech.id === "absorption")!;
close(vsAbs.annualSavings, (0.9 - 0.13) * 365 * 200 * 0.13, "savings vs absorption");
close(vsAbs.additionalInvestment, (180 - 125) * 200, "additional investment vs absorption");
close(vsAbs.paybackYears!, 11000 / vsAbs.annualSavings, "payback vs absorption");
close(vsAbs.paybackMonths!, (11000 / vsAbs.annualSavings) * 12, "payback months vs absorption");

const vsPel = r.comparisons.find((c) => c.competitor.tech.id === "peltier")!;
close(vsPel.additionalInvestment, (180 - 130) * 200, "additional investment vs peltier");
close(vsPel.cumulativeSavings, vsPel.annualSavings * 5, "cumulative savings vs peltier");
close(vsPel.netBenefit, vsPel.annualSavings * 5 - 10000, "net benefit vs peltier");
assert.ok(peltier.annualCost > inverter.annualCost, "peltier costs more to run");

// Local currency: 1 USD = 40 local. Investments convert, USD mirrors stay in USD.
const local = calculate(DEFAULT_SETTINGS, { rooms: 100, tariff: 4, fxRate: 40, years: 3 });
close(local.hero.investment, 180 * 100 * 40, "investment in local currency");
close(local.hero.investmentUsd, 180 * 100, "investment in USD");
close(local.comparisons[0].annualSavingsUsd, local.comparisons[0].annualSavings / 40, "USD savings mirror");

// No savings → no payback. Horizon never shorter than 5 years.
const noSave = calculate(
  { version: 1, technologies: DEFAULT_SETTINGS.technologies.map((t) => ({ ...t, dailyKwh: 0.13 })) },
  { rooms: 10, tariff: 1, fxRate: 1, years: 1 },
);
assert.equal(noSave.comparisons[0].paybackMonths, null, "no payback without savings");
assert.equal(noSave.chartYears, 5, "chart horizon at least 5 years");

// Inactive competitors drop out; the hero never does.
const onlyAbs = calculate(
  { version: 1, technologies: DEFAULT_SETTINGS.technologies.map((t) => ({ ...t, active: t.id !== "peltier" })) },
  { rooms: 10, tariff: 1, fxRate: 1, years: 1 },
);
assert.equal(onlyAbs.comparisons.length, 1, "inactive competitor hidden");

// Settings validation rejects bad numbers and keeps the hero active.
assert.equal(validateSettings(DEFAULT_SETTINGS).ok, true, "defaults validate");
const bad = validateSettings({ version: 1, technologies: [{ id: "inverter", name: "", dailyKwh: -1, unitPriceUsd: 0 }] });
assert.equal(bad.ok, false, "negative values rejected");
const heroOff = validateSettings({
  version: 1,
  technologies: DEFAULT_SETTINGS.technologies.map((t) => ({ ...t, active: false })),
});
assert.ok(heroOff.ok && heroOff.value.technologies.find((t) => t.id === "inverter")!.active, "hero forced active");

// URL round trip for QR codes and deep links.
const sample = { ...initialInputs("DE"), rooms: "150", tariff: "0,31", tariffKind: "manual" as const, years: 10 as const, mode: "peltier" as const };
assert.deepEqual(fromSearchParams(`?${toSearchParams(sample).toString()}`), sample, "inputs survive the URL round trip");
assert.deepEqual(fromSearchParams("?c=ZZ&r=abc&y=7"), initialInputs(), "garbage parameters fall back to defaults");
const seasonal = { ...initialInputs(), days: ["1", "100", "220"] as [string, string, string] };
assert.equal(toSearchParams(seasonal).get("p"), "1,100,220", "custom day counts go into the URL");
assert.deepEqual(fromSearchParams(`?${toSearchParams(seasonal).toString()}`), seasonal, "day counts survive the URL round trip");
assert.equal(toSearchParams(initialInputs()).get("p"), null, "default day counts stay out of the URL");

// Seasonal hotel: annual figures count only open days, so savings shrink and payback grows by 365/220.
const yearRound = calculate(DEFAULT_SETTINGS, { rooms: 200, tariff: 7.3, fxRate: 50, years: 10 });
const season220 = calculate(DEFAULT_SETTINGS, { rooms: 200, tariff: 7.3, fxRate: 50, years: 10, operatingDays: 220 });
close(season220.hero.annualKwh, 0.13 * 220 * 200, "inverter kWh over a 220-day season");
close(season220.comparisons[0].annualSavings, yearRound.comparisons[0].annualSavings * (220 / 365), "savings scale with the season");
close(season220.comparisons[0].paybackMonths!, yearRound.comparisons[0].paybackMonths! * (365 / 220), "payback grows with a shorter season");
const seasonal220 = { ...initialInputs(), season: "220" };
assert.equal(toSearchParams(seasonal220).get("o"), "220", "season goes into the URL");
assert.deepEqual(fromSearchParams(`?${toSearchParams(seasonal220).toString()}`), seasonal220, "season survives the URL round trip");
assert.equal(toSearchParams(initialInputs()).get("o"), null, "year-round season stays out of the URL");
assert.equal(fromSearchParams("?o=400").season, "365", "invalid season falls back to 365");
assert.equal(validateInputs({ ...initialInputs(), season: "0" }).season, "range", "season 0 is rejected");
assert.deepEqual(fromSearchParams("?p=1,0,99999").days, initialInputs().days, "invalid day counts fall back to defaults");

console.log("check-calc: all assertions passed");
