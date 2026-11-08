"use client";

import { renderSVG } from "uqr";
import type { Comparison } from "@/lib/calc";
import type { Country } from "@/lib/countries";
import { PUBLIC_URL } from "@/lib/defaults";
import { formatMoney, formatPayback } from "@/lib/format";
import { toSearchParams, type SalesInputs } from "@/lib/inputs";
import { Button } from "./ui";

interface Props {
  inputs: SalesInputs;
  comparison: Comparison | null;
  country: Country;
  onClose: () => void;
}

/** QR code that opens this exact calculation on the visitor's phone. No backend: the inputs travel in the URL. */
export function ShareQr({ inputs, comparison, country, onClose }: Props) {
  const base = PUBLIC_URL || `${window.location.origin}${window.location.pathname}`;
  const url = `${base.replace(/\?.*$/, "")}?${toSearchParams(inputs).toString()}`;
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
          Take this calculation with you
        </h2>
        <p className="mt-1 text-sm text-slate-ui">Scan with your phone camera to open the same comparison, ready to print or forward.</p>

        <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row">
          {/* The SVG is generated locally by uqr from our own URL: only <rect>/<path> modules, no user text is interpolated. */}
          <div className="w-52 shrink-0 rounded-2xl border border-line p-3 [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
          <dl className="w-full space-y-3 text-sm">
            <div>
              <dt className="text-slate-ui">Hotel</dt>
              <dd className="num font-medium text-ink">
                {inputs.rooms} rooms · {country.name}
              </dd>
            </div>
            {comparison && (
              <>
                <div>
                  <dt className="text-slate-ui">Annual electricity savings</dt>
                  <dd className="num text-lg font-semibold text-navy">{formatMoney(comparison.annualSavings, country.currency)}</dd>
                </div>
                <div>
                  <dt className="text-slate-ui">Payback vs {comparison.competitor.tech.name}</dt>
                  <dd className="num font-medium text-ink">{formatPayback(comparison.paybackMonths)}</dd>
                </div>
              </>
            )}
          </dl>
        </div>

        <p className="mt-5 break-all rounded-2xl bg-mist px-4 py-3 text-xs text-slate-ui">{url}</p>
        {isLocal && (
          <p className="mt-3 text-xs text-red-600">
            This address only works on this device. Set NEXT_PUBLIC_PUBLIC_URL to the public web address before the fair.
          </p>
        )}

        <div className="mt-6 flex justify-end">
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
