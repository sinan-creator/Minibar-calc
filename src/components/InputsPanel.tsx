"use client";

import type { Country } from "@/lib/countries";
import { PERIOD_OPTIONS, ROOM_LIMITS, type PeriodYears } from "@/lib/defaults";
import type { InputErrors, SalesInputs } from "@/lib/inputs";
import { fxFor, tariffFor } from "@/lib/tariffs";
import { CountrySelect } from "./CountrySelect";
import { useI18n } from "./I18nProvider";
import { Field, Segmented, SourceTag } from "./ui";

interface Props {
  inputs: SalesInputs;
  country: Country;
  errors: InputErrors;
  onChange: (patch: Partial<SalesInputs>) => void;
  onSelectCountry: (code: string) => void;
}

function currencyName(code: string, locale: string) {
  try {
    return new Intl.DisplayNames([locale], { type: "currency" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function InputsPanel({ inputs, country, errors, onChange, onSelectCountry }: Props) {
  const { s, f, locale } = useI18n();
  const tariffMeta = tariffFor(country.code) ?? null;
  const fxMeta = fxFor(country.currency) ?? null;
  const isUsd = country.currency === "USD";
  const rooms = Number(inputs.rooms) || 0;
  const stepRooms = (delta: number) =>
    onChange({ rooms: String(Math.min(ROOM_LIMITS.max, Math.max(ROOM_LIMITS.min, rooms + delta))) });
  const errorText = {
    rooms: errors.rooms ? s.errRooms(ROOM_LIMITS.min, f.number(ROOM_LIMITS.max)) : undefined,
    tariff: errors.tariff === "required" ? s.errTariffRequired : errors.tariff === "positive" ? s.errTariffPositive : undefined,
    fxRate: errors.fxRate === "required" ? s.errFxRequired : errors.fxRate === "positive" ? s.errFxPositive : undefined,
  };

  return (
    <div className="rounded-3xl border border-line bg-white p-6 sm:p-7">
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-ui">{s.hotelAndMarket}</h2>
      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1">
        <Field label={s.country} htmlFor="country">
          <CountrySelect id="country" value={country.code} onChange={onSelectCountry} />
        </Field>

        <Field label={s.hotelRooms} htmlFor="rooms" error={errorText.rooms}>
          <div className="flex items-stretch gap-2">
            <button
              type="button"
              aria-label={s.fewerRooms}
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
              aria-label={s.moreRooms}
              onClick={() => stepRooms(10)}
              className="h-12 w-12 shrink-0 rounded-2xl border border-line text-xl text-navy transition hover:bg-mist active:scale-95"
            >
              +
            </button>
          </div>
        </Field>

        <Field label={s.electricityTariff} htmlFor="tariff" error={errorText.tariff}>
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

        <Field label={s.currency}>
          <div className="input flex items-center justify-between" aria-readonly>
            <span className="font-semibold text-navy">{country.currency}</span>
            <span className="truncate text-sm text-slate-ui" suppressHydrationWarning>
              {currencyName(country.currency, locale)}
            </span>
          </div>
          {isUsd ? (
            <p className="mt-2 text-xs text-slate-ui">{s.currencyAuto}</p>
          ) : (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-slate-ui">{s.showAmountsIn}</span>
              <Segmented<SalesInputs["display"]>
                ariaLabel={s.showAmountsIn}
                size="sm"
                value={inputs.display}
                onChange={(display) => onChange({ display })}
                options={[
                  { value: "local", label: country.currency },
                  { value: "usd", label: "USD" },
                ]}
              />
            </div>
          )}
        </Field>

        <Field label={s.exchangeRate} htmlFor="fx" error={errorText.fxRate}>
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
            <p className="mt-2 text-xs text-slate-ui">{s.alreadyUsd}</p>
          ) : (
            <SourceTag
              kind={inputs.fxKind}
              meta={fxMeta}
              onUseEstimate={fxMeta ? () => onChange({ fxRate: String(fxMeta.rate), fxKind: "estimated" }) : undefined}
            />
          )}
        </Field>

        <Field label={s.comparisonPeriod}>
          <Segmented<PeriodYears>
            ariaLabel={s.comparisonPeriod}
            value={inputs.years}
            onChange={(years) => onChange({ years })}
            options={PERIOD_OPTIONS.map((y) => ({ value: y, label: f.years(y) }))}
            className="w-full"
          />
        </Field>

      </div>
    </div>
  );
}
