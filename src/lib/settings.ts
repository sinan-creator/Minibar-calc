import { useSyncExternalStore } from "react";
import {
  DEFAULT_SETTINGS,
  HERO_ID,
  TECHNOLOGY_IDS,
  TECH_LIMITS,
  type MinibarSettings,
  type Technology,
  type TechnologyId,
} from "./defaults.ts";

/**
 * Administrator settings store.
 * Persisted in localStorage so values survive refreshes and offline use.
 * Every consumer reads through useSettings(), so a save re-renders all
 * calculations, charts and the printed summary at once.
 */

export const STORAGE_KEY = "elektromarla.minibar.settings.v1";

export type FieldErrors = Partial<Record<"name" | "dailyKwh" | "unitPriceUsd", string>>;

export function validateTechnology(t: Technology): FieldErrors {
  const errors: FieldErrors = {};
  const name = t.name.trim();
  if (!name) errors.name = "Name is required.";
  else if (name.length > TECH_LIMITS.nameMaxLength) errors.name = `Keep the name under ${TECH_LIMITS.nameMaxLength} characters.`;

  const { dailyKwh, unitPriceUsd } = TECH_LIMITS;
  if (!Number.isFinite(t.dailyKwh) || t.dailyKwh < dailyKwh.min || t.dailyKwh > dailyKwh.max)
    errors.dailyKwh = `Enter a value between ${dailyKwh.min} and ${dailyKwh.max} kWh/day.`;
  if (!Number.isFinite(t.unitPriceUsd) || t.unitPriceUsd < unitPriceUsd.min || t.unitPriceUsd > unitPriceUsd.max)
    errors.unitPriceUsd = `Enter a price between ${unitPriceUsd.min} and ${unitPriceUsd.max} USD.`;
  return errors;
}

export type ValidationResult = { ok: true; value: MinibarSettings } | { ok: false; errors: string[] };

/** Validates and normalises untrusted input (localStorage or an imported JSON file). */
export function validateSettings(input: unknown): ValidationResult {
  const errors: string[] = [];
  if (!input || typeof input !== "object") return { ok: false, errors: ["Settings must be a JSON object."] };
  const raw = input as { version?: unknown; technologies?: unknown };
  if (raw.version !== 1) errors.push("Unsupported settings version.");
  if (!Array.isArray(raw.technologies)) return { ok: false, errors: [...errors, "Missing technologies list."] };

  const byId = new Map<TechnologyId, Technology>();
  for (const item of raw.technologies as unknown[]) {
    if (!item || typeof item !== "object") continue;
    const t = item as Partial<Record<keyof Technology, unknown>>;
    if (typeof t.id !== "string" || !TECHNOLOGY_IDS.includes(t.id as TechnologyId)) {
      errors.push(`Unknown technology id "${String(t.id)}".`);
      continue;
    }
    const id = t.id as TechnologyId;
    const tech: Technology = {
      id,
      name: typeof t.name === "string" ? t.name.trim() : "",
      dailyKwh: Number(t.dailyKwh),
      unitPriceUsd: Number(t.unitPriceUsd),
      active: id === HERO_ID ? true : t.active !== false,
    };
    const fieldErrors = validateTechnology(tech);
    for (const message of Object.values(fieldErrors)) errors.push(`${tech.name || id}: ${message}`);
    byId.set(id, tech);
  }
  for (const id of TECHNOLOGY_IDS) if (!byId.has(id)) errors.push(`Missing technology "${id}".`);

  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { version: 1, technologies: TECHNOLOGY_IDS.map((id) => byId.get(id)!) } };
}

// ---- storage + subscription -------------------------------------------------

const listeners = new Set<() => void>();
let cached: MinibarSettings | null = null;

function readStorage(): MinibarSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const text = window.localStorage.getItem(STORAGE_KEY);
    if (!text) return DEFAULT_SETTINGS;
    const result = validateSettings(JSON.parse(text));
    return result.ok ? result.value : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function getSnapshot(): MinibarSettings {
  if (!cached) cached = readStorage();
  return cached;
}

function emit() {
  for (const fn of listeners) fn();
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      cached = null;
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}

export function saveSettings(settings: MinibarSettings) {
  const result = validateSettings(settings);
  if (!result.ok) throw new Error(result.errors.join(" "));
  cached = result.value;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(result.value));
  emit();
  return result.value;
}

export function restoreDefaultSettings() {
  cached = DEFAULT_SETTINGS;
  window.localStorage.removeItem(STORAGE_KEY);
  emit();
  return DEFAULT_SETTINGS;
}

/** Current administrator settings. Server render and first client paint use the defaults. */
export function useSettings(): MinibarSettings {
  return useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_SETTINGS);
}

export const isDefaultSettings = (s: MinibarSettings) => JSON.stringify(s) === JSON.stringify(DEFAULT_SETTINGS);

// ---- import / export -------------------------------------------------------

export const settingsToJson = (settings: MinibarSettings) =>
  JSON.stringify({ ...settings, exportedAt: new Date().toISOString(), app: "elektromarla-minibar-calculator" }, null, 2);

export function parseSettingsJson(text: string): ValidationResult {
  try {
    return validateSettings(JSON.parse(text));
  } catch {
    return { ok: false, errors: ["The file is not valid JSON."] };
  }
}
