/**
 * Estimated commercial electricity tariffs and USD reference exchange rates.
 *
 * NONE of these values are live or verified. They are desk estimates compiled
 * from publicly available tariff schedules and statistics for the reference
 * year shown, intended only as a starting point that the salesperson confirms
 * or overrides with the customer. The UI labels every value accordingly.
 */

export type ValueKind = "estimated" | "manual";

export interface TariffEstimate {
  /** Local currency per kWh. */
  value: number;
  currency: string;
  year: number;
  source: string;
}

export interface FxReference {
  /** Local currency units per 1 USD. */
  rate: number;
  year: number;
  source: string;
  /** Currency formally pegged to the USD: the rate is stable, but still confirm it. */
  pegged?: boolean;
}

const EUROSTAT = "Desk estimate from Eurostat non-household electricity prices incl. taxes";

/** Keyed by ISO 3166-1 alpha-2 country code. */
export const TARIFF_ESTIMATES: Record<string, TariffEstimate> = {
  TR: { value: 4.9, currency: "TRY", year: 2025, source: "Desk estimate from EPDK regulated business (ticarethane) tariff incl. taxes" },
  EG: { value: 1.85, currency: "EGP", year: 2025, source: "Desk estimate from EgyptERA commercial tariff bands" },
  SA: { value: 0.3, currency: "SAR", year: 2025, source: "Desk estimate from Saudi Electricity Company commercial tariff (>6,000 kWh/month)" },
  AE: { value: 0.38, currency: "AED", year: 2025, source: "Desk estimate from DEWA commercial slab tariff incl. fuel surcharge" },
  QA: { value: 0.15, currency: "QAR", year: 2025, source: "Desk estimate from Kahramaa non-residential tariff" },
  KW: { value: 0.025, currency: "KWD", year: 2025, source: "Desk estimate from MEW commercial tariff (subsidised)" },
  BH: { value: 0.029, currency: "BHD", year: 2025, source: "Desk estimate from EWA non-domestic tariff" },
  OM: { value: 0.03, currency: "OMR", year: 2025, source: "Desk estimate from APSR commercial tariff" },
  JO: { value: 0.17, currency: "JOD", year: 2025, source: "Desk estimate from EMRC commercial (hotel) tariff" },
  GB: { value: 0.27, currency: "GBP", year: 2025, source: "Desk estimate from DESNZ non-domestic electricity price statistics" },
  DE: { value: 0.28, currency: "EUR", year: 2025, source: EUROSTAT },
  FR: { value: 0.2, currency: "EUR", year: 2025, source: EUROSTAT },
  IT: { value: 0.28, currency: "EUR", year: 2025, source: EUROSTAT },
  ES: { value: 0.19, currency: "EUR", year: 2025, source: EUROSTAT },
  PT: { value: 0.19, currency: "EUR", year: 2025, source: EUROSTAT },
  GR: { value: 0.22, currency: "EUR", year: 2025, source: EUROSTAT },
  NL: { value: 0.26, currency: "EUR", year: 2025, source: EUROSTAT },
  BE: { value: 0.28, currency: "EUR", year: 2025, source: EUROSTAT },
  AT: { value: 0.25, currency: "EUR", year: 2025, source: EUROSTAT },
  IE: { value: 0.3, currency: "EUR", year: 2025, source: EUROSTAT },
  CY: { value: 0.25, currency: "EUR", year: 2025, source: EUROSTAT },
  HR: { value: 0.2, currency: "EUR", year: 2025, source: EUROSTAT },
  MT: { value: 0.17, currency: "EUR", year: 2025, source: "Desk estimate from Enemalta non-residential tariff" },
  CH: { value: 0.27, currency: "CHF", year: 2025, source: "Desk estimate from ElCom median commercial tariff" },
  PL: { value: 1.05, currency: "PLN", year: 2025, source: "Desk estimate from URE business tariff statistics" },
  CZ: { value: 6.0, currency: "CZK", year: 2025, source: "Desk estimate from ERÚ business tariff statistics" },
  RO: { value: 1.2, currency: "RON", year: 2025, source: "Desk estimate from ANRE non-household tariffs" },
  US: { value: 0.13, currency: "USD", year: 2025, source: "Desk estimate from EIA average commercial retail price" },
  CA: { value: 0.15, currency: "CAD", year: 2025, source: "Desk estimate from provincial commercial tariffs" },
  MX: { value: 3.5, currency: "MXN", year: 2025, source: "Desk estimate from CFE GDMTO commercial tariff" },
  LY: { value: 0.07, currency: "LYD", year: 2025, source: "Desk estimate from GECOL commercial tariff (heavily subsidised)" },
  MA: { value: 1.35, currency: "MAD", year: 2025, source: "Desk estimate from ONEE medium-voltage commercial tariff" },
  TN: { value: 0.4, currency: "TND", year: 2025, source: "Desk estimate from STEG commercial tariff" },
  DZ: { value: 5.0, currency: "DZD", year: 2025, source: "Desk estimate from Sonelgaz commercial tariff (subsidised)" },
  AZ: { value: 0.11, currency: "AZN", year: 2025, source: "Desk estimate from Tariff Council non-residential tariff" },
  GE: { value: 0.28, currency: "GEL", year: 2025, source: "Desk estimate from GNERC commercial tariff" },
  KZ: { value: 35, currency: "KZT", year: 2025, source: "Desk estimate from regional commercial tariffs" },
  UZ: { value: 900, currency: "UZS", year: 2025, source: "Desk estimate from regulated legal-entity tariff" },
  IN: { value: 9.0, currency: "INR", year: 2025, source: "Desk estimate from state commercial (HT) tariffs" },
  CN: { value: 0.75, currency: "CNY", year: 2025, source: "Desk estimate from provincial general commercial tariffs" },
  JP: { value: 25, currency: "JPY", year: 2025, source: "Desk estimate from utility low-voltage commercial tariffs" },
  AU: { value: 0.3, currency: "AUD", year: 2025, source: "Desk estimate from AER small-business tariffs" },
  ZA: { value: 2.5, currency: "ZAR", year: 2025, source: "Desk estimate from Eskom / municipal commercial tariffs" },
  MV: { value: 6.0, currency: "MVR", year: 2025, source: "Desk estimate from STELCO business tariff" },
  TH: { value: 4.5, currency: "THB", year: 2025, source: "Desk estimate from MEA/PEA medium business tariff incl. Ft" },
  ID: { value: 1500, currency: "IDR", year: 2025, source: "Desk estimate from PLN B-2/B-3 business tariffs" },
  SG: { value: 0.3, currency: "SGD", year: 2025, source: "Desk estimate from EMA commercial retail prices" },
};

/** Keyed by ISO 4217 currency code. Local currency units per 1 USD. */
export const FX_REFERENCE: Record<string, FxReference> = {
  USD: { rate: 1, year: 2025, source: "Base currency", pegged: true },
  EUR: { rate: 0.86, year: 2025, source: "Desk estimate, 2025 market average" },
  GBP: { rate: 0.76, year: 2025, source: "Desk estimate, 2025 market average" },
  CHF: { rate: 0.8, year: 2025, source: "Desk estimate, 2025 market average" },
  TRY: { rate: 42, year: 2025, source: "Desk estimate, late-2025 market rate (volatile: confirm daily)" },
  EGP: { rate: 48, year: 2025, source: "Desk estimate, 2025 market rate (volatile: confirm daily)" },
  SAR: { rate: 3.75, year: 2025, source: "Official USD peg", pegged: true },
  AED: { rate: 3.6725, year: 2025, source: "Official USD peg", pegged: true },
  QAR: { rate: 3.64, year: 2025, source: "Official USD peg", pegged: true },
  BHD: { rate: 0.376, year: 2025, source: "Official USD peg", pegged: true },
  OMR: { rate: 0.385, year: 2025, source: "Official USD peg", pegged: true },
  JOD: { rate: 0.709, year: 2025, source: "Official USD peg", pegged: true },
  KWD: { rate: 0.306, year: 2025, source: "Desk estimate, 2025 market average" },
  LYD: { rate: 5.45, year: 2025, source: "Desk estimate, Central Bank of Libya official rate" },
  MAD: { rate: 9.3, year: 2025, source: "Desk estimate, 2025 market average" },
  TND: { rate: 2.95, year: 2025, source: "Desk estimate, 2025 market average" },
  DZD: { rate: 130, year: 2025, source: "Desk estimate, 2025 official rate" },
  ILS: { rate: 3.3, year: 2025, source: "Desk estimate, 2025 market average" },
  PLN: { rate: 3.65, year: 2025, source: "Desk estimate, 2025 market average" },
  CZK: { rate: 21, year: 2025, source: "Desk estimate, 2025 market average" },
  HUF: { rate: 335, year: 2025, source: "Desk estimate, 2025 market average" },
  RON: { rate: 4.35, year: 2025, source: "Desk estimate, 2025 market average" },
  SEK: { rate: 9.5, year: 2025, source: "Desk estimate, 2025 market average" },
  NOK: { rate: 10, year: 2025, source: "Desk estimate, 2025 market average" },
  DKK: { rate: 6.4, year: 2025, source: "Desk estimate, 2025 market average" },
  ISK: { rate: 125, year: 2025, source: "Desk estimate, 2025 market average" },
  RSD: { rate: 101, year: 2025, source: "Desk estimate, 2025 market average" },
  BAM: { rate: 1.68, year: 2025, source: "Desk estimate, 2025 market average" },
  MKD: { rate: 53, year: 2025, source: "Desk estimate, 2025 market average" },
  ALL: { rate: 83, year: 2025, source: "Desk estimate, 2025 market average" },
  RUB: { rate: 81, year: 2025, source: "Desk estimate, 2025 market average (volatile)" },
  UAH: { rate: 41.5, year: 2025, source: "Desk estimate, 2025 market average" },
  AZN: { rate: 1.7, year: 2025, source: "Managed USD peg", pegged: true },
  GEL: { rate: 2.7, year: 2025, source: "Desk estimate, 2025 market average" },
  KZT: { rate: 520, year: 2025, source: "Desk estimate, 2025 market average" },
  UZS: { rate: 12300, year: 2025, source: "Desk estimate, 2025 market average" },
  INR: { rate: 88, year: 2025, source: "Desk estimate, 2025 market average" },
  CNY: { rate: 7.15, year: 2025, source: "Desk estimate, 2025 market average" },
  JPY: { rate: 152, year: 2025, source: "Desk estimate, 2025 market average" },
  KRW: { rate: 1430, year: 2025, source: "Desk estimate, 2025 market average" },
  TWD: { rate: 31, year: 2025, source: "Desk estimate, 2025 market average" },
  HKD: { rate: 7.78, year: 2025, source: "Linked exchange rate system", pegged: true },
  SGD: { rate: 1.3, year: 2025, source: "Desk estimate, 2025 market average" },
  THB: { rate: 32.5, year: 2025, source: "Desk estimate, 2025 market average" },
  MYR: { rate: 4.2, year: 2025, source: "Desk estimate, 2025 market average" },
  IDR: { rate: 16600, year: 2025, source: "Desk estimate, 2025 market average" },
  PHP: { rate: 58, year: 2025, source: "Desk estimate, 2025 market average" },
  VND: { rate: 26000, year: 2025, source: "Desk estimate, 2025 market average" },
  MVR: { rate: 15.4, year: 2025, source: "Managed USD peg", pegged: true },
  PKR: { rate: 280, year: 2025, source: "Desk estimate, 2025 market average" },
  BDT: { rate: 122, year: 2025, source: "Desk estimate, 2025 market average" },
  AUD: { rate: 1.53, year: 2025, source: "Desk estimate, 2025 market average" },
  NZD: { rate: 1.75, year: 2025, source: "Desk estimate, 2025 market average" },
  CAD: { rate: 1.39, year: 2025, source: "Desk estimate, 2025 market average" },
  MXN: { rate: 18.5, year: 2025, source: "Desk estimate, 2025 market average" },
  BRL: { rate: 5.4, year: 2025, source: "Desk estimate, 2025 market average" },
  ZAR: { rate: 17.3, year: 2025, source: "Desk estimate, 2025 market average" },
  NGN: { rate: 1450, year: 2025, source: "Desk estimate, 2025 market average (volatile)" },
  KES: { rate: 129, year: 2025, source: "Desk estimate, 2025 market average" },
  XOF: { rate: 565, year: 2025, source: "Fixed to EUR; derived from EUR estimate" },
  XAF: { rate: 565, year: 2025, source: "Fixed to EUR; derived from EUR estimate" },
  IQD: { rate: 1310, year: 2025, source: "Official CBI rate", pegged: true },
};

export const tariffFor = (countryCode: string): TariffEstimate | undefined => TARIFF_ESTIMATES[countryCode];
export const fxFor = (currency: string): FxReference | undefined => FX_REFERENCE[currency];
