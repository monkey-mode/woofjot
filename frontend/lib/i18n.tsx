"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { th, type Translations } from "./locales/th";
import { en } from "./locales/en";

export type Locale = "th" | "en";

const locales: Record<Locale, Translations> = { th, en };

/** Map i18n locale to BCP-47 tag for Intl APIs. */
export function toBCP47(locale: Locale): string {
  return locale === "th" ? "th-TH" : "en-US";
}

interface I18nContextValue {
  t: Translations;
  locale: Locale;
  setLocale: (l: Locale) => void;
}

const I18nContext = createContext<I18nContextValue>({
  t: th,
  locale: "th",
  setLocale: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("th");

  useEffect(() => {
    const saved = localStorage.getItem("locale");
    if (saved === "th" || saved === "en") setLocaleState(saved);
  }, []);

  // Keep <html lang> in sync with the active locale.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (l: Locale) => {
    localStorage.setItem("locale", l);
    setLocaleState(l);
  };

  return (
    <I18nContext.Provider value={{ t: locales[locale], locale, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
