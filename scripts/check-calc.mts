// Smallest runnable check for the calculation engine and settings validation.
// Run: npm run check   (Node 24 strips the types natively, no build step)
import assert from "node:assert/strict";
import { calculate } from "../src/lib/calc.ts";
import { DEFAULT_SETTINGS } from "../src/lib/defaults.ts";
import { customTechnology, fromSearchParams, initialInputs, toSearchParams, validateInputs } from "../src/lib/inputs.ts";
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

// Visitor's own minibar: price entered in local currency, converted to USD; becomes a fourth technology.
const withCustom = {
  ...initialInputs("TR"),
  custom: { enabled: true, name: "Dometic HiPro", dailyKwh: "0.75", unitPrice: "8400" },
};
assert.deepEqual(validateInputs(withCustom), {}, "custom inputs validate");
const tech = customTechnology(withCustom, 42)!;
close(tech.unitPriceUsd, 200, "custom price converted to USD");
const four = calculate(
  { version: 1, technologies: [...DEFAULT_SETTINGS.technologies.slice(0, 2), tech, DEFAULT_SETTINGS.technologies[2]] },
  { rooms: 100, tariff: 4.9, fxRate: 42, years: 5 },
);
assert.equal(four.comparisons.length, 3, "custom minibar compared as well");
assert.equal(customTechnology(initialInputs(), 42), null, "custom disabled by default");

// URL round trip for QR codes and deep links.
const restored = fromSearchParams(`?${toSearchParams(withCustom).toString()}`);
assert.deepEqual(restored, withCustom, "inputs survive the URL round trip");
assert.deepEqual(fromSearchParams("?c=ZZ&r=abc&y=7"), initialInputs(), "garbage parameters fall back to defaults");

console.log("check-calc: all assertions passed");
