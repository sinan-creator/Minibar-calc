/**
 * Single source of truth for every configurable constant.
 * Minibar specifications here are DEFAULTS: the administrator can override
 * them in the Admin Settings panel (persisted in localStorage, see settings.ts).
 * Calculation components never read these values directly; they read the
 * current settings via useSettings().
 */

export type TechnologyId = "absorption" | "peltier" | "inverter";

export interface Technology {
  id: TechnologyId;
  /** Display name shown on cards, charts and the printed summary. */
  name: string;
  /** Energy consumption per unit, kWh per day. */
  dailyKwh: number;
  /** Purchase price per unit, USD. */
  unitPriceUsd: number;
  /** Inactive technologies are hidden from the calculator entirely. */
  active: boolean;
}

export interface MinibarSettings {
  version: 1;
  technologies: Technology[];
}

/** The technology every comparison is measured against. It cannot be deactivated. */
export const HERO_ID: TechnologyId = "inverter";

export const TECHNOLOGY_IDS: readonly TechnologyId[] = ["absorption", "peltier", "inverter"];

export const DEFAULT_SETTINGS: MinibarSettings = {
  version: 1,
  technologies: [
    { id: "absorption", name: "Absorption", dailyKwh: 0.9, unitPriceUsd: 125, active: true },
    { id: "peltier", name: "Thermoelectric (Peltier)", dailyKwh: 0.275, unitPriceUsd: 130, active: true },
    { id: "inverter", name: "Inverter Compressor", dailyKwh: 0.13, unitPriceUsd: 180, active: true },
  ],
};

/** Marketing blurbs and product facts live in i18n.ts (both languages). */

/**
 * Rear-view product photos per technology (fronts look identical), served from public/.
 * Add a file under public/tech/ and list it here; technologies without an entry show no photo.
 */
export const TECH_IMAGES: Partial<Record<TechnologyId, string>> = {
  absorption: "/tech/absorption.jpg",
  peltier: "/tech/peltier.jpg",
  inverter: "/tech/inverter.jpg",
};

/** Validation ceilings for administrator input. */
export const TECH_LIMITS = {
  dailyKwh: { min: 0.001, max: 20 },
  unitPriceUsd: { min: 1, max: 100000 },
  nameMaxLength: 40,
} as const;

export const DAYS_PER_YEAR = 365;
export const PERIOD_OPTIONS = [1, 3, 5, 10] as const;
export type PeriodYears = (typeof PERIOD_OPTIONS)[number];
export const DEFAULT_YEARS: PeriodYears = 5;
/** Cumulative cost chart always shows at least this many years. */
export const MIN_CHART_YEARS = 5;

export const DEFAULT_ROOMS = 200;
export const ROOM_LIMITS = { min: 1, max: 10000 } as const;
export const DEFAULT_COUNTRY = "TR";

/** Exhibition attract mode: idle time before the screen resets and shows rotating headlines. */
export const ATTRACT_IDLE_MS = 180_000;
export const ATTRACT_ROTATE_MS = 6_000;
/** Markets cycled through on the attract screen (only those with tariff + FX estimates are used). */
export const SHOWCASE_COUNTRIES = ["TR", "DE", "AE", "SA", "GB", "EG", "QA", "US"];

/**
 * Admin PIN. Set NEXT_PUBLIC_ADMIN_PIN at build time to change it.
 * A client-side PIN only hides controls from customers on the exhibition
 * screen. It is NOT strong security: anyone with the bundle can read it.
 * See README for the optional authenticated backend design.
 */
export const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN ?? "1234";

/** Public address the QR code points to (e.g. https://elektromarla.com/calculator). Falls back to the current origin. */
export const PUBLIC_URL = process.env.NEXT_PUBLIC_PUBLIC_URL ?? "";

/** Sub-folder the app is served from ("" at a domain root, "/Minibar-calc" on GitHub Pages). Prefix for public/ assets. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const COMPANY = "Elektromarla";
export const APP_NAME = "Elektromarla Minibar Savings Calculator";

/** Contact channels for the "next step" actions (from elektromarla.com: corporate projects line and info address). */
export const CONTACT = {
  email: "info@elektromarla.com",
  /** Display form. */
  phone: "+90 544 870 25 01",
  /** Digits only, for tel: and wa.me links. */
  phoneDigits: "905448702501",
  website: "https://www.elektromarla.com",
} as const;
