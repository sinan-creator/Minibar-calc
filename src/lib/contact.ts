import type { Comparison } from "./calc.ts";
import { countryName, type Country } from "./countries.ts";
import { CONTACT, PUBLIC_URL } from "./defaults.ts";
import { techName, type Formatters, type Lang, type Strings } from "./i18n.ts";
import { toSearchParams, type SalesInputs } from "./inputs.ts";

export interface ContactContext {
  s: Strings;
  f: Formatters;
  lang: Lang;
  locale: string;
  inputs: SalesInputs;
  comparison: Comparison;
  country: Country;
  /** Currency the comparison amounts are expressed in. */
  currency: string;
  tariff: number;
  fxRate: number;
  /** `window.location.origin + pathname` on the client, "" during server render. */
  origin: string;
}

/** Deep link plus mailto / WhatsApp / tel links carrying the estimate. No backend involved. */
export function contactLinks(c: ContactContext) {
  const params = toSearchParams(c.inputs);
  params.set("lang", c.lang);
  const base = (PUBLIC_URL || c.origin).replace(/\?.*$/, "");
  const url = `${base}?${params.toString()}`;
  const local = c.country.currency;
  const rooms = c.f.number(Number(c.inputs.rooms));
  const where = countryName(c.country, c.locale);

  const body = c.s.emailBody({
    country: where,
    rooms,
    competitor: techName(c.comparison.competitor.tech, c.lang),
    annual: c.f.money(c.comparison.annualSavings, c.currency),
    usd: c.currency !== "USD" ? c.f.money(c.comparison.annualSavingsUsd, "USD") : null,
    payback: c.f.payback(c.comparison.paybackMonths),
    years: c.f.years(c.inputs.years),
    periodSavings: c.f.money(c.comparison.cumulativeSavings, c.currency),
    tariff: c.f.rate(c.tariff, local),
    fx: local === "USD" ? "USD" : `1 USD = ${c.f.number(c.fxRate, 4)} ${local}`,
    url,
  });
  const subject = c.s.emailSubject(where, rooms);

  return {
    url,
    mailto: `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    whatsapp: `https://wa.me/${CONTACT.phoneDigits}?text=${encodeURIComponent(body)}`,
    tel: `tel:+${CONTACT.phoneDigits}`,
  };
}
