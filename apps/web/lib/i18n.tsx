"use client";

import { dictionaries, type Locale, type Messages } from "@tiptop/i18n";
import { createContext, useContext, useMemo, type ReactNode } from "react";

const I18nContext = createContext<{
  locale: Locale;
  messages: Messages;
  setLocale: (l: Locale) => void;
} | null>(null);

export function I18nProvider({
  locale,
  setLocale,
  children,
}: {
  locale: Locale;
  setLocale: (l: Locale) => void;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({ locale, messages: dictionaries[locale], setLocale }),
    [locale, setLocale],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("I18nProvider missing");
  return ctx;
}
