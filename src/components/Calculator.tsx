"use client";

import { useState } from "react";
import { calculate } from "@/lib/calc";
import { findCountry } from "@/lib/countries";
import { DEFAULT_COUNTRY, MIN_CHART_YEARS } from "@/lib/defaults";
import { DISCLAIMER, initialInputs, marketDefaults, parseDecimal, validateInputs, type SalesInputs } from "@/lib/inputs";
import { useSettings } from "@/lib/settings";
import { AdminPanel } from "./AdminPanel";
import { CumulativeChart, OwnershipBarChart } from "./Charts";
import { Header } from "./Header";
import { Headline } from "./Headline";
import { InputsPanel } from "./InputsPanel";
import { PrintSummary } from "./PrintSummary";
import { TechCards } from "./TechCards";

export function Calculator() {
  const settings = useSettings();
  const [inputs, setInputs] = useState<SalesInputs>(() => initialInputs());

  const country = findCountry(inputs.countryCode) ?? findCountry(DEFAULT_COUNTRY)!;
  const errors = validateInputs(inputs);
  const valid = Object.keys(errors).length === 0;

  const numeric = {
    rooms: Number(inputs.rooms),
    tariff: parseDecimal(inputs.tariff),
    fxRate: parseDecimal(inputs.fxRate),
    years: inputs.years,
  };
  const result = valid ? calculate(settings, numeric, MIN_CHART_YEARS) : null;
  const comparison = result
    ? (result.comparisons.find((c) => c.competitor.tech.id === inputs.mode) ?? result.comparisons[0] ?? null)
    : null;

  const update = (patch: Partial<SalesInputs>) => setInputs((s) => ({ ...s, ...patch }));
  const selectCountry = (code: string) => setInputs((s) => ({ ...s, ...marketDefaults(code) }));
  const reset = () => {
    setInputs(initialInputs());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <div className="flex min-h-screen flex-col print:hidden">
        <Header onReset={reset} onPrint={() => window.print()} />

        <main className="mx-auto w-full max-w-7xl flex-1 px-5 pb-20 sm:px-8">
          <Headline
            result={result}
            comparison={comparison}
            country={country}
            rooms={numeric.rooms}
            tariff={numeric.tariff}
            mode={inputs.mode}
            onMode={(mode) => update({ mode })}
          />

          <div className="mt-12 grid items-start gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="xl:sticky xl:top-24">
              <InputsPanel inputs={inputs} country={country} errors={errors} onChange={update} onSelectCountry={selectCountry} />
            </aside>

            <section className="min-w-0 space-y-6">
              <TechCards result={result} comparison={comparison} currency={country.currency} years={inputs.years} fxRate={numeric.fxRate} />
              <div className="grid gap-6 2xl:grid-cols-2">
                <OwnershipBarChart result={result} comparison={comparison} currency={country.currency} years={inputs.years} />
                <CumulativeChart result={result} comparison={comparison} currency={country.currency} years={inputs.years} />
              </div>
            </section>
          </div>
        </main>

        <footer className="border-t border-line">
          <div className="mx-auto flex w-full max-w-7xl items-start justify-between gap-6 px-5 py-6 sm:px-8">
            <p className="max-w-4xl text-xs leading-relaxed text-slate-ui">{DISCLAIMER}</p>
            <AdminPanel />
          </div>
        </footer>
      </div>

      <PrintSummary
        inputs={inputs}
        country={country}
        result={result}
        comparison={comparison}
        settings={settings}
        tariff={numeric.tariff}
        fxRate={numeric.fxRate}
      />
    </>
  );
}
