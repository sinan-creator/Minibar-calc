"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { LOCALES, formatters, strings, type Formatters, type Lang, type Strings } from "@/lib/i18n";

interface I18n {
  lang: Lang;
  locale: string;
  /** UI strings in the active language. */
  s: Strings;
  /** Locale-bound number/money formatters. */
  f: Formatters;
}

const Ctx = createContext<I18n>({ lang: "en", locale: "en", s: strings("en"), f: formatters("en") });

export function I18nProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const value = useMemo<I18n>(() => ({ lang, locale: LOCALES[lang], s: strings(lang), f: formatters(lang) }), [lang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
