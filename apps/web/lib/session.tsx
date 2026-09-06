"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Locale } from "@tiptop/i18n";
import { api, clearToken, getStoredToken, type PublicUser } from "./api";
import { disconnectRealtime } from "./realtime";

type Theme = "light" | "dark";

type SessionState = {
  user: PublicUser | null;
  loading: boolean;
  theme: Theme;
  locale: Locale;
  setTheme: (t: Theme) => void;
  setLocale: (l: Locale) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const SessionContext = createContext<SessionState | null>(null);

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setThemeState] = useState<Theme>("light");
  const [locale, setLocaleState] = useState<Locale>("fr");

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    applyTheme(t);
    localStorage.setItem("tiptop_theme", t);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("tiptop_locale", l);
  }, []);

  const refresh = useCallback(async () => {
    if (!getStoredToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api<PublicUser>("/auth/me");
      setUser(me);
      void api("/devices", { method: "POST", body: JSON.stringify({ platform: "web" }) }).catch(() => undefined);
      if (me.theme === "dark" || me.theme === "light") {
        setTheme(me.theme);
      }
      if (me.locale === "en" || me.locale === "fr") {
        setLocale(me.locale);
      }
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setLocale, setTheme]);

  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      clearToken();
      disconnectRealtime();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const storedTheme = localStorage.getItem("tiptop_theme") as Theme | null;
    const storedLocale = localStorage.getItem("tiptop_locale") as Locale | null;
    if (storedTheme) {
      setThemeState(storedTheme);
      applyTheme(storedTheme);
    }
    if (storedLocale) setLocaleState(storedLocale);
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ user, loading, theme, locale, setTheme, setLocale, refresh, logout }),
    [user, loading, theme, locale, setTheme, setLocale, refresh, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("SessionProvider missing");
  return ctx;
}
