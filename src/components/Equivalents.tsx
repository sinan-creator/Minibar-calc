"use client";

import type { Comparison } from "@/lib/calc";
import { EQUIVALENTS } from "@/lib/defaults";
import { formatNumber } from "@/lib/format";
import { gridFactorFor } from "@/lib/tariffs";
import { plural } from "./ui";

interface Props {
  comparison: Comparison | null;
  countryCode: string;
  years: number;
}

/** What the saved electricity equals, in figures a hotel owner recognises. */
export function Equivalents({ comparison, countryCode, years }: Props) {
  if (!comparison || comparison.annualEnergySavedKwh <= 0) return null;

  const kwh = comparison.annualEnergySavedKwh;
  const grid = gridFactorFor(countryCode);
  const factor = grid?.kgPerKwh ?? EQUIVALENTS.defaultGridKgPerKwh;
  const tonnes = (kwh * factor) / 1000;
  const homes = kwh / EQUIVALENTS.householdKwhPerYear;
  const evKm = kwh / EQUIVALENTS.evKwhPerKm;

  const tiles = [
    { value: formatNumber(kwh), unit: "kWh", label: "less electricity every year" },
    { value: formatNumber(tonnes, tonnes < 10 ? 1 : 0), unit: "t CO₂", label: `avoided every year · ${formatNumber(tonnes * years, 0)} t over ${plural(years, "year")}` },
    { value: formatNumber(homes, homes < 10 ? 1 : 0), unit: "homes", label: "worth of annual household electricity" },
    { value: formatNumber(evKm), unit: "km", label: "of electric-car driving every year" },
  ];

  return (
    <section aria-label="What the savings equal" className="rounded-3xl bg-mist p-6 sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-navy">
          Switching from {comparison.competitor.tech.name} equals
        </h2>
        <span className="text-xs text-slate-ui">Estimates</span>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.unit} className="rounded-2xl bg-white p-5">
            <div className="num text-3xl font-semibold tracking-tight text-navy">
              {t.value} <span className="text-base font-medium text-slate-ui">{t.unit}</span>
            </div>
            <div className="mt-1 text-sm text-slate-ui">{t.label}</div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-slate-ui">
        Grid factor {formatNumber(factor, 2)} kg CO₂/kWh{" "}
        {grid ? `(${grid.source}, ${grid.year})` : "(world average placeholder; no country estimate)"}; {formatNumber(EQUIVALENTS.householdKwhPerYear)} kWh
        per household per year; {EQUIVALENTS.evKwhPerKm} kWh per km for an electric car.
      </p>
    </section>
  );
}
