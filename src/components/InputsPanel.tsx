"use client";

import type { Country } from "@/lib/countries";
import { CUSTOM_DEFAULT_NAME, PERIOD_OPTIONS, ROOM_LIMITS, TECH_LIMITS, type PeriodYears } from "@/lib/defaults";
import type { CustomMinibar, InputErrors, SalesInputs } from "@/lib/inputs";
import { fxFor, tariffFor } from "@/lib/tariffs";
import { CountrySelect } from "./CountrySelect";
import { Field, Segmented, SourceTag, Switch, plural } from "./ui";

interface Props {
  inputs: SalesInputs;
  country: Country;
  errors: InputErrors;
  onChange: (patch: Partial<SalesInputs>) => void;
  onSelectCountry: (code: string) => void;
}

function currencyName(code: string) {
  try {
    return new Intl.DisplayNames(["en"], { type: "currency" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function InputsPanel({ inputs, country, errors, onChange, onSelectCountry }: Props) {
  const tariffMeta = tariffFor(country.code) ?? null;
  const fxMeta = fxFor(country.currency) ?? null;
  const isUsd = country.currency === "USD";
  const rooms = Number(inputs.rooms) || 0;
  const stepRooms = (delta: number) =>
    onChange({ rooms: String(Math.min(ROOM_LIMITS.max, Math.max(ROOM_LIMITS.min, rooms + delta))) });
  const custom = inputs.custom;
  const setCustom = (patch: Partial<CustomMinibar>) => onChange({ custom: { ...custom, ...patch } });

  return (
    <div className="rounded-3xl border border-line bg-white p-6 sm:p-7">
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-ui">Hotel &amp; market</h2>
      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1">
        <Field label="Country" htmlFor="country">
          <CountrySelect id="country" value={country.code} onChange={onSelectCountry} />
        </Field>

        <Field label="Hotel rooms" htmlFor="rooms" error={errors.rooms}>
          <div className="flex items-stretch gap-2">
            <button
              type="button"
              aria-label="Fewer rooms"
              onClick={() => stepRooms(-10)}
              className="h-12 w-12 shrink-0 rounded-2xl border border-line text-xl text-navy transition hover:bg-mist active:scale-95"
            >
              −
            </button>
            <input
              id="rooms"
              className="input text-center"
              inputMode="numeric"
              pattern="[0-9]*"
              aria-invalid={Boolean(errors.rooms)}
              value={inputs.rooms}
              onChange={(e) => onChange({ rooms: e.target.value.replace(/[^\d]/g, "") })}
            />
            <button
              type="button"
              aria-label="More rooms"
              onClick={() => stepRooms(10)}
              className="h-12 w-12 shrink-0 rounded-2xl border border-line text-xl text-navy transition hover:bg-mist active:scale-95"
            >
              +
            </button>
          </div>
        </Field>

        <Field label="Electricity tariff" htmlFor="tariff" error={errors.tariff}>
          <div className="relative">
            <input
              id="tariff"
              className="input pr-24"
              inputMode="decimal"
              aria-invalid={Boolean(errors.tariff)}
              placeholder="0.00"
              value={inputs.tariff}
              onChange={(e) => onChange({ tariff: e.target.value, tariffKind: "manual" })}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-ui">
              {country.currency}/kWh
            </span>
          </div>
          <SourceTag
            kind={inputs.tariffKind}
            meta={tariffMeta}
            onUseEstimate={tariffMeta ? () => onChange({ tariff: String(tariffMeta.value), tariffKind: "estimated" }) : undefined}
          />
        </Field>

        <Field label="Currency">
          <div className="input flex items-center justify-between" aria-readonly>
            <span className="font-semibold text-navy">{country.currency}</span>
            <span className="truncate text-sm text-slate-ui" suppressHydrationWarning>
              {currencyName(country.currency)}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-ui">Selected automatically from the country.</p>
        </Field>

        <Field label="Exchange rate" htmlFor="fx" error={errors.fxRate}>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-ui">1 USD =</span>
            <input
              id="fx"
              className="input pl-20 pr-16 text-right"
              inputMode="decimal"
              aria-invalid={Boolean(errors.fxRate)}
              placeholder="0.00"
              disabled={isUsd}
              value={inputs.fxRate}
              onChange={(e) => onChange({ fxRate: e.target.value, fxKind: "manual" })}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-ui">{country.currency}</span>
          </div>
          {isUsd ? (
            <p className="mt-2 text-xs text-slate-ui">Prices are already in USD.</p>
          ) : (
            <SourceTag
              kind={inputs.fxKind}
              meta={fxMeta}
              onUseEstimate={fxMeta ? () => onChange({ fxRate: String(fxMeta.rate), fxKind: "estimated" }) : undefined}
            />
          )}
        </Field>

        <Field label="Comparison period">
          <Segmented<PeriodYears>
            ariaLabel="Comparison period"
            value={inputs.years}
            onChange={(years) => onChange({ years })}
            options={PERIOD_OPTIONS.map((y) => ({ value: y, label: plural(y, "year") }))}
            className="w-full"
          />
        </Field>
      </div>

      <div className="mt-6 border-t border-line pt-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-ink">Compare with the customer&apos;s current minibar</div>
            <div className="text-xs text-slate-ui">Adds a fourth column from the figures on the rating label.</div>
          </div>
          <Switch on={custom.enabled} label="Compare with the customer's current minibar" onChange={() => setCustom({ enabled: !custom.enabled })} />
        </div>
        {custom.enabled && (
          <div className="mt-4 grid gap-4 md:grid-cols-3 xl:grid-cols-1">
            <Field label="Model name" htmlFor="custom-name">
              <input
                id="custom-name"
                className="input"
                maxLength={TECH_LIMITS.nameMaxLength}
                placeholder={CUSTOM_DEFAULT_NAME}
                value={custom.name}
                onChange={(e) => setCustom({ name: e.target.value })}
              />
            </Field>
            <Field label="Consumption (kWh/day)" htmlFor="custom-kwh" error={errors.customKwh}>
              <input
                id="custom-kwh"
                className="input"
                inputMode="decimal"
                aria-invalid={Boolean(errors.customKwh)}
                placeholder="e.g. 0.75"
                value={custom.dailyKwh}
                onChange={(e) => setCustom({ dailyKwh: e.target.value })}
              />
            </Field>
            <Field label={`Price per unit (${country.currency})`} htmlFor="custom-price" error={errors.customPrice}>
              <input
                id="custom-price"
                className="input"
                inputMode="decimal"
                aria-invalid={Boolean(errors.customPrice)}
                placeholder="0 = keep existing units"
                value={custom.unitPrice}
                onChange={(e) => setCustom({ unitPrice: e.target.value })}
              />
              <p className="mt-2 text-xs text-slate-ui">Leave at 0 to compare against keeping the existing units.</p>
            </Field>
          </div>
        )}
      </div>
    </div>
  );
}
