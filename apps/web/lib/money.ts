"use client";

import { formatEventPrice, resolveUserCurrency } from "@tiptop/domain";
import { useI18n } from "./i18n";
import { useSession } from "./session";

export function useMoney() {
  const { user } = useSession();
  const { locale } = useI18n();
  const currency = resolveUserCurrency(user?.currency, user?.country);
  return {
    currency,
    formatPrice: (amount: number, fromCurrency = "XAF") =>
      formatEventPrice(amount, fromCurrency, currency, locale),
  };
}
