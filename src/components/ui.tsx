"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { TechnologyId } from "@/lib/defaults";
import { localizeSource } from "@/lib/i18n";
import type { ValueKind } from "@/lib/tariffs";
import { useI18n } from "./I18nProvider";

/** Chart and marker colours per technology. Cool greys for competitors, accent blue for the hero. */
export const TECH_COLORS: Record<TechnologyId, string> = {
  absorption: "#a9b3c4",
  peltier: "#6f87a9",
  inverter: "#2b6cf6",
};

/** "Thermoelectric (Peltier)" → "Peltier", "Inverter Compressor" → "Inverter". */
export const shortName = (name: string) => /\(([^)]+)\)/.exec(name)?.[1] ?? name.split(" ")[0];

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" };

export function Button({ variant = "secondary", className = "", type = "button", ...props }: ButtonProps) {
  const styles = {
    primary: "bg-navy text-white hover:bg-navy-700",
    secondary: "border border-line bg-white text-navy hover:bg-mist",
    ghost: "text-slate-ui hover:bg-mist hover:text-navy",
    danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
  }[variant];
  return (
    <button
      type={type}
      className={`inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-medium transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 ${styles} ${className}`}
      {...props}
    />
  );
}

export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
  ariaLabel,
  size = "md",
  className = "",
  wrap = true,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  ariaLabel: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Allow options to wrap onto a second row on narrow screens (default true). */
  wrap?: boolean;
}) {
  const sizes = { sm: "h-9 px-3 text-xs", md: "h-10 px-4 text-sm", lg: "h-12 px-5 text-base" }[size];
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={`inline-flex max-w-full ${wrap ? "flex-wrap" : "flex-nowrap"} rounded-full bg-mist p-1 ${className}`}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`flex-1 whitespace-nowrap rounded-full font-medium transition-all ${sizes} ${
              active ? "bg-white text-navy shadow-[0_1px_3px_rgba(16,24,40,0.12)]" : "text-slate-ui hover:text-navy"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Field({ label, htmlFor, error, children }: { label: string; htmlFor?: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function SourceTag({
  kind,
  meta,
  onUseEstimate,
}: {
  kind: ValueKind;
  meta: { year: number; source: string; pegged?: boolean } | null | undefined;
  onUseEstimate?: () => void;
}) {
  const { s, lang } = useI18n();
  if (kind === "manual" || !meta) {
    return (
      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-ui">
        <span className="rounded-full bg-mist px-2 py-0.5 font-medium text-navy">{s.manualEntry}</span>
        {meta && onUseEstimate ? (
          <button type="button" className="underline underline-offset-2 hover:text-navy" onClick={onUseEstimate}>
            {s.useEstimate(meta.year)}
          </button>
        ) : (
          <span>{s.noReference}</span>
        )}
      </p>
    );
  }
  return (
    <div className="mt-2 text-xs text-slate-ui">
      <span className="rounded-full bg-accent-soft px-2 py-0.5 font-medium text-accent">
        {s.estimated(meta.year)}
        {meta.pegged ? ` · ${s.usdPeg}` : ""}
      </span>
      <p className="mt-1.5 leading-relaxed">
        {localizeSource(meta.source, lang)}. {s.notLive}
      </p>
    </div>
  );
}

export function Panel({ title, subtitle, children, className = "" }: { title: string; subtitle?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl border border-line bg-white p-6 sm:p-7 ${className}`}>
      <h2 className="text-lg font-semibold tracking-tight text-navy">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-slate-ui">{subtitle}</p>}
      {children}
    </section>
  );
}

export function EmptyState() {
  const { s } = useI18n();
  return <div className="flex h-48 items-center justify-center rounded-2xl bg-mist text-center text-sm text-slate-ui">{s.emptyState}</div>;
}
