import { describe, expect, it } from "vitest";
import {
  canAccessAdmin,
  canChangePlatformFee,
  canRefundPayments,
  hasPermission,
  isFeatureEnabled,
  defaultFeatureFlags,
} from "@tiptop/domain";

describe("RBAC Command Center", () => {
  it("refuse un utilisateur normal", () => {
    expect(canAccessAdmin("USER")).toBe(false);
    expect(hasPermission("USER", "users.read")).toBe(false);
  });

  it("le support ne touche pas à la commission", () => {
    expect(canAccessAdmin("SUPPORT_ADMIN")).toBe(true);
    expect(canChangePlatformFee("SUPPORT_ADMIN")).toBe(false);
    expect(hasPermission("SUPPORT_ADMIN", "finance.settings")).toBe(false);
    expect(hasPermission("SUPPORT_ADMIN", "support.read")).toBe(true);
  });

  it("finance gère les remboursements mock, pas les rôles", () => {
    expect(canRefundPayments("FINANCE_ADMIN")).toBe(true);
    expect(hasPermission("FINANCE_ADMIN", "users.roles")).toBe(false);
    expect(canChangePlatformFee("FINANCE_ADMIN")).toBe(false);
  });

  it("super admin (ADMIN) a tout", () => {
    expect(hasPermission("ADMIN", "flags.write")).toBe(true);
    expect(hasPermission("ADMIN", "finance.settings")).toBe(true);
    expect(canChangePlatformFee("ADMIN")).toBe(true);
  });

  it("modérateur ne rembourse pas", () => {
    expect(canRefundPayments("MODERATOR")).toBe(false);
    expect(hasPermission("MODERATOR", "moderation.write")).toBe(true);
  });

  it("un flag désactivé coupe la fonctionnalité", () => {
    const flags = defaultFeatureFlags();
    flags.payments.enabled = false;
    expect(isFeatureEnabled(flags, "payments")).toBe(false);
  });
});
