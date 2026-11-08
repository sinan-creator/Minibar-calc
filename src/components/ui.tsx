"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { TechnologyId } from "@/lib/defaults";
import type { ValueKind } from "@/lib/tariffs";

/** Chart and marker colours per technology. Cool greys for competitors, accent blue for the hero. */
export const TECH_COLORS: Record<TechnologyId, string> = {
  absorption: "#a9b3c4",
  peltier: "#6f87a9",
  inverter: "#2b6cf6",
  custom: "#4f8a8b",
};

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

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
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  ariaLabel: string;
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={`inline-flex max-w-full flex-wrap rounded-full bg-mist p-1 ${className}`}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`flex-1 whitespace-nowrap rounded-full font-medium transition-all ${
              size === "lg" ? "h-12 px-5 text-base" : "h-10 px-4 text-sm"
            } ${active ? "bg-white text-navy shadow-[0_1px_3px_rgba(16,24,40,0.12)]" : "text-slate-ui hover:text-navy"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Switch({ on, disabled, label, onChange }: { on: boolean; disabled?: boolean; label: string; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50 ${on ? "bg-accent" : "bg-line"}`}
    >
      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-[left] ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
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
  if (kind === "manual" || !meta) {
    return (
      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-ui">
        <span className="rounded-full bg-mist px-2 py-0.5 font-medium text-navy">Manual entry</span>
        {meta && onUseEstimate ? (
          <button type="button" className="underline underline-offset-2 hover:text-navy" onClick={onUseEstimate}>
            Use {meta.year} estimate
          </button>
        ) : (
          <span>No reference value for this market. Confirm with the customer.</span>
        )}
      </p>
    );
  }
  return (
    <div className="mt-2 text-xs text-slate-ui">
      <span className="rounded-full bg-accent-soft px-2 py-0.5 font-medium text-accent">
        Estimated · {meta.year}
        {meta.pegged ? " · USD peg" : ""}
      </span>
      <p className="mt-1.5 leading-relaxed">{meta.source}. Not a live or verified rate.</p>
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

export function EmptyState({ message = "Enter valid hotel details on the left to see results." }: { message?: string }) {
  return <div className="flex h-48 items-center justify-center rounded-2xl bg-mist text-sm text-slate-ui">{message}</div>;
}
