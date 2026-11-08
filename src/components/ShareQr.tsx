"use client";

import { renderSVG } from "uqr";
import type { Comparison } from "@/lib/calc";
import { countryName, type Country } from "@/lib/countries";
import { PUBLIC_URL } from "@/lib/defaults";
import { techName } from "@/lib/i18n";
import { toSearchParams, type SalesInputs } from "@/lib/inputs";
import { useI18n } from "./I18nProvider";
import { Button } from "./ui";

interface Props {
  inputs: SalesInputs;
  comparison: Comparison | null;
  country: Country;
  onClose: () => void;
}

/** QR code that opens this exact calculation on the visitor's phone. No backend: the inputs travel in the URL. */
export function ShareQr({ inputs, comparison, country, onClose }: Props) {
  const { s, f, lang, locale } = useI18n();
  const base = PUBLIC_URL || `${window.location.origin}${window.location.pathname}`;
  const params = toSearchParams(inputs);
  params.set("lang", lang);
  const url = `${base.replace(/\?.*$/, "")}?${params.toString()}`;
  const svg = renderSVG(url, { ecc: "M", border: 1, pixelSize: 8, blackColor: "#1c2c59" });
  const isLocal = /localhost|127\.0\.0\.1/.test(base);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="share-title" className="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl sm:p-8">
        <h2 id="share-title" className="text-xl font-semibold tracking-tight text-navy">
          {s.shareTitle}
        </h2>
        <p className="mt-1 text-sm text-slate-ui">{s.shareSubtitle}</p>

        <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row">
          {/* The SVG is generated locally by uqr from our own URL: only <rect>/<path> modules, no user text is interpolated. */}
          <div className="w-52 shrink-0 rounded-2xl border border-line p-3 [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
          <dl className="w-full space-y-3 text-sm">
            <div>
              <dt className="text-slate-ui">{s.hotel}</dt>
              <dd className="num font-medium text-ink">
                {s.roomsCount(inputs.rooms)} · {countryName(country, locale)}
              </dd>
            </div>
            {comparison && (
              <>
                <div>
                  <dt className="text-slate-ui">{s.annualSavings}</dt>
                  <dd className="num text-lg font-semibold text-navy">{f.money(comparison.annualSavings, country.currency)}</dd>
                </div>
                <div>
                  <dt className="text-slate-ui">{s.paybackVs(techName(comparison.competitor.tech, lang))}</dt>
                  <dd className="num font-medium text-ink">{f.payback(comparison.paybackMonths)}</dd>
                </div>
              </>
            )}
          </dl>
        </div>

        <p className="mt-5 break-all rounded-2xl bg-mist px-4 py-3 text-xs text-slate-ui">{url}</p>
        {isLocal && <p className="mt-3 text-xs text-red-600">{s.localOnly}</p>}

        <div className="mt-6 flex justify-end">
          <Button variant="primary" onClick={onClose}>
            {s.done}
          </Button>
        </div>
      </div>
    </div>
  );
}
