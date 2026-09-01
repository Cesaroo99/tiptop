"use client";

import { Inter } from "next/font/google";
import { I18nProvider } from "@/lib/i18n";
import { SessionProvider, useSession } from "@/lib/session";
import type { ReactNode } from "react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

function I18nGate({ children }: { children: ReactNode }) {
  const { locale, setLocale } = useSession();
  return (
    <I18nProvider locale={locale} setLocale={setLocale}>
      {children}
    </I18nProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <div className={inter.variable}>
      <SessionProvider>
        <I18nGate>{children}</I18nGate>
      </SessionProvider>
    </div>
  );
}
