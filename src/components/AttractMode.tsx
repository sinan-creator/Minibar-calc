"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { calculate } from "@/lib/calc";
import { findCountry } from "@/lib/countries";
import {
  ATTRACT_ROTATE_MS,
  BASE_PATH,
  COMPANY,
  DEFAULT_ROOMS,
  DEFAULT_YEARS,
  MIN_CHART_YEARS,
  SHOWCASE_COUNTRIES,
  type MinibarSettings,
} from "@/lib/defaults";
import { formatMoney } from "@/lib/format";
import { fxFor, tariffFor } from "@/lib/tariffs";

/** Full-screen idle view for the stand: rotating market headlines until someone touches the screen. */
export function AttractMode({ settings, onStart }: { settings: MinibarSettings; onStart: () => void }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setIndex((i) => i + 1), ATTRACT_ROTATE_MS);
    return () => window.clearInterval(id);
  }, []);

  const slides = SHOWCASE_COUNTRIES.flatMap((code) => {
    const country = findCountry(code);
    const tariff = tariffFor(code);
    const fx = country?.currency === "USD" ? { rate: 1, year: 2025 } : country && fxFor(country.currency);
    if (!country || !tariff || !fx) return [];
    const result = calculate(settings, { rooms: DEFAULT_ROOMS, tariff: tariff.value, fxRate: fx.rate, years: DEFAULT_YEARS }, MIN_CHART_YEARS);
    const cmp = result.comparisons[0];
    if (!cmp || cmp.annualSavings <= 0) return [];
    return [{ country, cmp, year: tariff.year, currency: country.currency }];
  });
  const slide = slides.length ? slides[index % slides.length] : null;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Touch to start"
      onPointerDown={onStart}
      onKeyDown={onStart}
      className="fixed inset-0 z-[60] flex cursor-pointer select-none flex-col bg-white"
    >
      <div className="flex items-center justify-between px-8 pt-8 sm:px-14 sm:pt-12">
        <Image src={`${BASE_PATH}/logo.png`} alt={COMPANY} width={2685} height={729} priority className="h-14 w-auto sm:h-20" />
        <span className="hidden text-sm text-slate-ui sm:inline">Minibar Savings Calculator</span>
      </div>

      <div className="flex flex-1 flex-col justify-center px-8 sm:px-14">
        {slide ? (
          <div key={index} className="rise max-w-6xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-ui">
              {DEFAULT_ROOMS}-room hotel · {slide.country.name}
            </p>
            <h1 className="mt-5 text-5xl font-semibold leading-[1.04] tracking-tight text-navy sm:text-7xl lg:text-8xl">
              Save <span className="num text-accent">{formatMoney(slide.cmp.annualSavings, slide.currency)}</span> a year on
              minibar electricity.
            </h1>
            <p className="mt-6 text-lg text-slate-ui sm:text-2xl">
              {COMPANY} Inverter instead of {slide.cmp.competitor.tech.name} minibars
              {slide.currency !== "USD" && <> · ≈ {formatMoney(slide.cmp.annualSavingsUsd, "USD")}</>} · estimated {slide.year} tariff
            </p>
          </div>
        ) : (
          <h1 className="text-5xl font-semibold tracking-tight text-navy sm:text-7xl">Cut minibar electricity costs by up to 86%.</h1>
        )}
      </div>

      <div className="flex items-center justify-between px-8 pb-8 sm:px-14 sm:pb-12">
        <div className="flex gap-2">
          {slides.map((s, i) => (
            <span key={s.country.code} className={`h-1.5 rounded-full transition-all ${i === index % slides.length ? "w-8 bg-navy" : "w-1.5 bg-line"}`} />
          ))}
        </div>
        <span className="animate-pulse rounded-full bg-navy px-6 py-3 text-base font-medium text-white sm:text-lg">
          Touch to calculate for your hotel
        </span>
      </div>
    </div>
  );
}
