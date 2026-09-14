import { describe, expect, it } from "vitest";
import { canAccessAdmin, hasPermission } from "@tiptop/domain";
import { NAV } from "./admin-copy";

describe("admin command nav", () => {
  it("expose le command center et refuse un user normal", () => {
    expect(NAV.some((l) => l.href === "/admin")).toBe(true);
    expect(NAV.some((l) => l.href === "/admin/finance")).toBe(true);
    expect(canAccessAdmin("USER")).toBe(false);
    expect(hasPermission("SUPPORT_ADMIN", "finance.settings")).toBe(false);
  });
});
