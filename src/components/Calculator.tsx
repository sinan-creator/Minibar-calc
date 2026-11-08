"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { track } from "@/lib/analytics";
import { calculate, toUsdResult } from "@/lib/calc";
import { findCountry } from "@/lib/countries";
import { ATTRACT_IDLE_MS, DEFAULT_COUNTRY, MIN_CHART_YEARS } from "@/lib/defaults";
import { isLang, setLang, strings, useStoredLang, type Lang } from "@/lib/i18n";
import { fromSearchParams, initialInputs, marketDefaults, parseDecimal, toSearchParams, validateInputs, type SalesInputs } from "@/lib/inputs";
import { useSettings } from "@/lib/settings";
import { AdminPanel } from "./AdminPanel";
import { AttractMode } from "./AttractMode";
import { CumulativeChart, OwnershipBarChart } from "./Charts";
import { ComparisonTable } from "./ComparisonTable";
import { EnergySaved } from "./EnergySaved";
import { Header } from "./Header";
import { Headline } from "./Headline";
import { I18nProvider } from "./I18nProvider";
import { InputsPanel } from "./InputsPanel";
import { NextStep } from "./NextStep";
import { PrintSummary } from "./PrintSummary";
import { Recommendation } from "./Recommendation";
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

  // Language: the device's stored choice, else the URL, else English.
  const storedLang = useStoredLang();
  const urlLang = new URLSearchParams(search).get("lang");
  const lang: Lang = storedLang ?? (isLang(urlLang) ? urlLang : "en");

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (!edited && !storedLang) return;
    const params = toSearchParams(inputs);
    if (lang !== "en") params.set("lang", lang);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, [edited, storedLang, inputs, lang]);

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

  const localResult = valid ? calculate(settings, numeric, MIN_CHART_YEARS) : null;
  // "Show amounts in USD": every money figure is converted; inputs stay in the local currency.
  const showUsd = inputs.display === "usd" && country.currency !== "USD";
  const result = localResult && showUsd ? toUsdResult(localResult, numeric.fxRate) : localResult;
  const displayCurrency = showUsd ? "USD" : country.currency;
  const displayFx = showUsd ? 1 : numeric.fxRate;
  const comparison = result
    ? (result.comparisons.find((c) => c.competitor.tech.id === inputs.mode) ?? result.comparisons[0] ?? null)
    : null;

  const update = (patch: Partial<SalesInputs>) => setInputs((s) => ({ ...s, ...patch }));
  const selectCountry = (code: string) => {
    track("country_select", { country: code });
    setInputs((s) => ({ ...s, ...marketDefaults(code) }));
  };
  const reset = () => {
    setEdited(initialInputs());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <I18nProvider lang={lang}>
      <div className="flex min-h-screen flex-col print:hidden">
        <Header onReset={reset} onPrint={() => window.print()} onShare={() => setShareOpen(true)} onLang={setLang} />

        <main className="mx-auto w-full max-w-7xl flex-1 px-5 pb-20 sm:px-8">
          <Headline comparison={comparison} country={country} currency={displayCurrency} rooms={numeric.rooms} />

          <div className="mt-10 grid items-start gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="xl:sticky xl:top-28">
              <InputsPanel inputs={inputs} country={country} errors={errors} onChange={update} onSelectCountry={selectCountry} />
            </aside>

            <section className="min-w-0 space-y-6">
              <TechCards result={result} comparison={comparison} currency={displayCurrency} years={inputs.years} fxRate={displayFx} />
              <Recommendation result={result} comparison={comparison} years={inputs.years} />
              <EnergySaved comparison={comparison} years={inputs.years} />
              <div className="grid gap-6 2xl:grid-cols-2">
                <OwnershipBarChart result={result} comparison={comparison} currency={displayCurrency} years={inputs.years} />
                <CumulativeChart result={result} comparison={comparison} currency={displayCurrency} years={inputs.years} />
              </div>
              <ComparisonTable result={result} currency={displayCurrency} years={inputs.years} fxRate={displayFx} />
              <NextStep inputs={inputs} comparison={comparison} country={country} currency={displayCurrency} tariff={numeric.tariff} fxRate={numeric.fxRate} />
            </section>
          </div>
        </main>

        <footer className="border-t border-line">
          <div className="mx-auto flex w-full max-w-7xl items-start justify-between gap-6 px-5 py-6 sm:px-8">
            <p className="max-w-4xl text-xs leading-relaxed text-slate-ui">{strings(lang).disclaimer}</p>
            <AdminPanel />
          </div>
        </footer>

        {shareOpen && (
          <ShareQr
            inputs={inputs}
            comparison={comparison}
            country={country}
            currency={displayCurrency}
            tariff={numeric.tariff}
            fxRate={numeric.fxRate}
            onClose={() => setShareOpen(false)}
          />
        )}
        {showAttract && (
          <AttractMode
            settings={settings}
            onStart={() => {
              track("attract_start");
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
        currency={displayCurrency}
        result={result}
        comparison={comparison}
        settings={settings}
        tariff={numeric.tariff}
        fxRate={numeric.fxRate}
        displayFx={displayFx}
      />
    </I18nProvider>
  );
}
