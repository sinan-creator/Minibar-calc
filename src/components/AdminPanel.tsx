"use client";

import { useRef, useState, type FormEvent } from "react";
import { ADMIN_PIN, DEFAULT_SETTINGS, HERO_ID, TECH_LIMITS, type MinibarSettings, type TechnologyId } from "@/lib/defaults";
import {
  isDefaultSettings,
  parseSettingsJson,
  restoreDefaultSettings,
  saveSettings,
  settingsToJson,
  useSettings,
  validateTechnology,
  type FieldErrors,
} from "@/lib/settings";
import { useI18n } from "./I18nProvider";
import { Button } from "./ui";

/**
 * Discreet gear → PIN → editable minibar specifications.
 * The PIN only keeps customers out of the exhibition screen. It is not strong
 * security (the bundle is public); see README for the authenticated backend option.
 */

interface DraftTech {
  id: TechnologyId;
  name: string;
  dailyKwh: string;
  unitPriceUsd: string;
  active: boolean;
}

const toDraft = (s: MinibarSettings): DraftTech[] =>
  s.technologies.map((t) => ({ ...t, dailyKwh: String(t.dailyKwh), unitPriceUsd: String(t.unitPriceUsd) }));

const fromDraft = (d: DraftTech[]): MinibarSettings => ({
  version: 1,
  technologies: d.map((t) => ({
    id: t.id,
    name: t.name.trim(),
    dailyKwh: Number(t.dailyKwh.replace(",", ".")),
    unitPriceUsd: Number(t.unitPriceUsd.replace(",", ".")),
    active: t.id === HERO_ID ? true : t.active,
  })),
});

const MAX_ATTEMPTS = 5;
const LOCK_MS = 30_000;

export function AdminPanel() {
  const { s } = useI18n();
  const settings = useSettings();
  const [open, setOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const close = () => {
    setOpen(false);
    setUnlocked(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={s.adminSettings}
        title={s.adminSettings}
        className="rounded-full p-2 text-slate-ui/40 transition hover:bg-mist hover:text-navy focus:text-navy"
      >
        <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="10" cy="10" r="2.6" />
          <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-navy/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-title"
            className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl sm:p-8"
          >
            {unlocked ? <SettingsForm settings={settings} onClose={close} /> : <PinGate onUnlock={() => setUnlocked(true)} onClose={close} />}
          </div>
        </div>
      )}
    </>
  );
}

function PinGate({ onUnlock, onClose }: { onUnlock: () => void; onClose: () => void }) {
  const { s } = useI18n();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (Date.now() < lockedUntil) return;
    if (pin === ADMIN_PIN) {
      onUnlock();
      return;
    }
    const n = attempts + 1;
    setAttempts(n);
    setPin("");
    if (n >= MAX_ATTEMPTS) {
      setLockedUntil(Date.now() + LOCK_MS);
      setAttempts(0);
      setError(s.tooManyAttempts(LOCK_MS / 1000));
    } else {
      setError(s.incorrectPin);
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-sm py-4 text-center">
      <h2 id="admin-title" className="text-xl font-semibold tracking-tight text-navy">
        {s.adminAccess}
      </h2>
      <p className="mt-2 text-sm text-slate-ui">{s.enterPin}</p>
      <input
        autoFocus
        type="password"
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label={s.adminPin}
        aria-invalid={Boolean(error)}
        className="input mt-6 text-center text-2xl tracking-[0.5em]"
        value={pin}
        onChange={(e) => {
          setPin(e.target.value);
          setError(null);
        }}
      />
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="mt-6 flex justify-center gap-3">
        <Button onClick={onClose}>{s.cancel}</Button>
        <Button variant="primary" type="submit" disabled={!pin}>
          {s.unlock}
        </Button>
      </div>
    </form>
  );
}

function SettingsForm({ settings, onClose }: { settings: MinibarSettings; onClose: () => void }) {
  const { s } = useI18n();
  const [draft, setDraft] = useState<DraftTech[]>(() => toDraft(settings));
  const [notice, setNotice] = useState<string | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const candidate = fromDraft(draft);
  const errors: Record<TechnologyId, FieldErrors> = Object.fromEntries(
    candidate.technologies.map((t) => [t.id, validateTechnology(t)]),
  ) as Record<TechnologyId, FieldErrors>;
  const hasErrors = Object.values(errors).some((e) => Object.keys(e).length > 0);
  const activeCompetitors = candidate.technologies.filter((t) => t.active && t.id !== HERO_ID).length;

  const patch = (id: TechnologyId, change: Partial<DraftTech>) => setDraft((d) => d.map((t) => (t.id === id ? { ...t, ...change } : t)));

  const save = () => {
    if (hasErrors || activeCompetitors === 0) return;
    saveSettings(candidate);
    onClose();
  };

  const restore = () => {
    restoreDefaultSettings();
    setDraft(toDraft(DEFAULT_SETTINGS));
    setImportErrors([]);
    setNotice(s.defaultsRestored);
  };

  const exportJson = () => {
    const blob = new Blob([settingsToJson(candidate)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `elektromarla-minibar-settings-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file: File | undefined) => {
    if (!file) return;
    const parsed = parseSettingsJson(await file.text());
    if (parsed.ok) {
      setDraft(toDraft(parsed.value));
      setImportErrors([]);
      setNotice(s.imported(file.name));
    } else {
      setImportErrors(parsed.errors);
      setNotice(null);
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="admin-title" className="text-xl font-semibold tracking-tight text-navy">
            {s.minibarSpecs}
          </h2>
          <p className="mt-1 text-sm text-slate-ui">
            {s.specsIntro} {isDefaultSettings(settings) ? s.usingDefaults : s.usingCustom}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={exportJson}>
            {s.exportJson}
          </Button>
          <Button variant="ghost" onClick={() => fileRef.current?.click()}>
            {s.importJson}
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => importJson(e.target.files?.[0])} />
        </div>
      </div>

      {notice && <p className="mt-4 rounded-2xl bg-accent-soft px-4 py-3 text-sm text-navy">{notice}</p>}
      {importErrors.length > 0 && (
        <ul role="alert" className="mt-4 list-disc space-y-1 rounded-2xl bg-red-50 px-8 py-3 text-sm text-red-700">
          {importErrors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <div className="mt-6 space-y-4">
        {draft.map((t) => {
          const isHero = t.id === HERO_ID;
          const err = errors[t.id];
          return (
            <fieldset key={t.id} className={`rounded-2xl border p-4 sm:p-5 ${t.active || isHero ? "border-line" : "border-line bg-mist/60 opacity-70"}`}>
              <legend className="sr-only">{t.name || t.id}</legend>
              <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr_1fr_auto]">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-slate-ui">{s.displayName}</span>
                  <input
                    className="input h-11 text-base"
                    maxLength={TECH_LIMITS.nameMaxLength}
                    aria-invalid={Boolean(err.name)}
                    value={t.name}
                    onChange={(e) => patch(t.id, { name: e.target.value })}
                  />
                  {err.name && <span className="mt-1 block text-xs text-red-600">{err.name}</span>}
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-slate-ui">{s.consumptionField}</span>
                  <input
                    className="input h-11 text-base"
                    inputMode="decimal"
                    aria-invalid={Boolean(err.dailyKwh)}
                    value={t.dailyKwh}
                    onChange={(e) => patch(t.id, { dailyKwh: e.target.value })}
                  />
                  {err.dailyKwh && <span className="mt-1 block text-xs text-red-600">{err.dailyKwh}</span>}
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-slate-ui">{s.unitPriceField}</span>
                  <input
                    className="input h-11 text-base"
                    inputMode="decimal"
                    aria-invalid={Boolean(err.unitPriceUsd)}
                    value={t.unitPriceUsd}
                    onChange={(e) => patch(t.id, { unitPriceUsd: e.target.value })}
                  />
                  {err.unitPriceUsd && <span className="mt-1 block text-xs text-red-600">{err.unitPriceUsd}</span>}
                </label>
                <label className="flex flex-col items-start">
                  <span className="mb-1.5 block text-xs font-medium text-slate-ui">{s.active}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isHero ? true : t.active}
                    disabled={isHero}
                    title={isHero ? s.heroAlwaysActive : undefined}
                    onClick={() => patch(t.id, { active: !t.active })}
                    className={`relative mt-1.5 h-7 w-12 rounded-full transition disabled:opacity-50 ${isHero || t.active ? "bg-accent" : "bg-line"}`}
                  >
                    <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-[left] ${isHero || t.active ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </label>
              </div>
              {isHero && <p className="mt-3 text-xs text-slate-ui">{s.referenceNote}</p>}
            </fieldset>
          );
        })}
      </div>

      {activeCompetitors === 0 && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {s.keepOneCompetitor}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
        <Button variant="danger" onClick={restore}>
          {s.restoreDefaults}
        </Button>
        <div className="flex gap-3">
          <Button onClick={onClose}>{s.cancel}</Button>
          <Button variant="primary" onClick={save} disabled={hasErrors || activeCompetitors === 0}>
            {s.save}
          </Button>
        </div>
      </div>
    </div>
  );
}
