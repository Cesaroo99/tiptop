import { describe, expect, it } from "vitest";
import { hmac, hashesEqual } from "../src/crypto";

describe("crypto", () => {
  it("compare les HMAC en temps constant", () => {
    const a = hmac("secret", "1234");
    const b = hmac("secret", "1234");
    expect(hashesEqual(a, b)).toBe(true);
    expect(hashesEqual(a, hmac("secret", "0000"))).toBe(false);
  });
});
