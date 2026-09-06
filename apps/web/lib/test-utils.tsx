import type { ReactNode } from "react";
import { dictionaries } from "@tiptop/i18n";
import { I18nProvider } from "./i18n";

export function TestI18nProvider({ children }: { children: ReactNode }) {
  return (
    <I18nProvider locale="fr" setLocale={() => undefined}>
      {children}
    </I18nProvider>
  );
}

export const frMessages = dictionaries.fr;
