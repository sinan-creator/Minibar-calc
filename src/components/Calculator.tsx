"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { calculate } from "@/lib/calc";
import { findCountry } from "@/lib/countries";
import { ATTRACT_IDLE_MS, DEFAULT_COUNTRY, HERO_ID, MIN_CHART_YEARS } from "@/lib/defaults";
import { DISCLAIMER, fromSearchParams, initialInputs, marketDefaults, parseDecimal, toSearchParams, validateInputs, type SalesInputs } from "@/lib/inputs";
import { useSettings } from "@/lib/settings";
import { AdminPanel } from "./AdminPanel";
import { AttractMode } from "./AttractMode";
import { CumulativeChart, OwnershipBarChart } from "./Charts";
import { ComparisonTable } from "./ComparisonTable";
import { EnergySaved } from "./EnergySaved";
import { Header } from "./Header";
import { Headline } from "./Headline";
import { InputsPanel } from "./InputsPanel";
import { PrintSummary } from "./PrintSummary";
import { ShareQr } from "./ShareQr";
import { TechCards } from "./TechCards";

const subscribeNever = () => () => {};
const readSearch = () => window.location.search;

export function Calculator() {
  const settings = useSettings();

  // Inputs follow the URL (deep links, QR codes) until the salesperson edits something.
  const search = useSyncExternalStore(subscribeNever, readSearch, () => "");
  const [edited, setEdited] = useState<SalesInputs | null>(null);
  const inputs = edited ?? fromSearchParams(search);
  const setInputs = (fn: (s: SalesInputs) => SalesInputs) => setEdited((s) => fn(s ?? fromSearchParams(search)));

  useEffect(() => {
    if (!edited) return;
    window.history.replaceState(null, "", `${window.location.pathname}?${toSearchParams(edited).toString()}`);
  }, [edited]);

  // Exhibition attract mode after a period of no interaction (or on demand with ?attract=1 to preview it).
  const [idle, setIdle] = useState(false);
  const [previewDismissed, setPreviewDismissed] = useState(false);
  const showAttract = idle || (!previewDismissed && new URLSearchParams(search).get("attract") === "1");
  useEffect(() => {
    let timer = window.setTimeout(() => setIdle(true), ATTRACT_IDLE_MS);
    const bump = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), ATTRACT_IDLE_MS);
    };
    const events = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart", "scroll"];
    for (const e of events) window.addEventListener(e, bump, { passive: true });
    return () => {
      window.clearTimeout(timer);
      for (const e of events) window.removeEventListener(e, bump);
    };
  }, []);

  const [shareOpen, setShareOpen] = useState(false);

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
    setEdited(initialInputs());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <div className="flex min-h-screen flex-col print:hidden">
        <Header onReset={reset} onPrint={() => window.print()} onShare={() => setShareOpen(true)} />

        <main className="mx-auto w-full max-w-7xl flex-1 px-5 pb-20 sm:px-8">
          <Headline comparison={comparison} country={country} rooms={numeric.rooms} />

          <div className="mt-10 grid items-start gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="xl:sticky xl:top-24">
              <InputsPanel
                inputs={inputs}
                country={country}
                errors={errors}
                competitors={settings.technologies.filter((t) => t.active && t.id !== HERO_ID)}
                onChange={update}
                onSelectCountry={selectCountry}
              />
            </aside>

            <section className="min-w-0 space-y-6">
              <TechCards result={result} comparison={comparison} currency={country.currency} years={inputs.years} fxRate={numeric.fxRate} />
              <EnergySaved comparison={comparison} years={inputs.years} />
              <div className="grid gap-6 2xl:grid-cols-2">
                <OwnershipBarChart result={result} comparison={comparison} currency={country.currency} years={inputs.years} />
                <CumulativeChart result={result} comparison={comparison} currency={country.currency} years={inputs.years} />
              </div>
              <ComparisonTable result={result} currency={country.currency} years={inputs.years} fxRate={numeric.fxRate} />
            </section>
          </div>
        </main>

        <footer className="border-t border-line">
          <div className="mx-auto flex w-full max-w-7xl items-start justify-between gap-6 px-5 py-6 sm:px-8">
            <p className="max-w-4xl text-xs leading-relaxed text-slate-ui">{DISCLAIMER}</p>
            <AdminPanel />
          </div>
        </footer>

        {shareOpen && <ShareQr inputs={inputs} comparison={comparison} country={country} onClose={() => setShareOpen(false)} />}
        {showAttract && (
          <AttractMode
            settings={settings}
            onStart={() => {
              setIdle(false);
              setPreviewDismissed(true);
              reset();
            }}
          />
        )}
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
