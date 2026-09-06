import { describe, expect, it } from "vitest";
import {
  convertAmount,
  countryToCurrency,
  formatEventPrice,
  formatMoney,
  resolveUserCurrency,
} from "./money";

describe("money", () => {
  it("résout la devise : compte d’abord, sinon pays, sinon CAD", () => {
    expect(resolveUserCurrency("EUR", "CM")).toBe("EUR");
    expect(resolveUserCurrency(null, "CM")).toBe("XAF");
    expect(resolveUserCurrency(undefined, "CA")).toBe("CAD");
    expect(resolveUserCurrency(undefined, undefined)).toBe("CAD");
  });

  it("mappe un pays vers sa devise", () => {
    expect(countryToCurrency("ca")).toBe("CAD");
    expect(countryToCurrency("FR")).toBe("EUR");
    expect(countryToCurrency("CM")).toBe("XAF");
    expect(countryToCurrency("ZZ")).toBeNull();
  });

  it("convertit 5000 XAF vers le dollar canadien", () => {
    const cad = convertAmount(5000, "XAF", "CAD");
    expect(cad).toBeCloseTo(11.49, 2);
    expect(convertAmount(cad, "CAD", "XAF")).toBeCloseTo(5000, 0);
    expect(convertAmount(5000, "XAF", "XAF")).toBe(5000);
  });

  it("formate CAD, XAF et un total converti", () => {
    expect(formatMoney(11.494, "CAD", "fr")).toBe("11,49 $ CA");
    expect(formatMoney(5000, "XAF", "fr")).toBe("5.000 FCFA");
    expect(formatEventPrice(5000, "XAF", "CAD", "fr")).toBe("11,49 $ CA");
    expect(formatEventPrice(10000, "XAF", "CAD", "fr")).toBe("22,99 $ CA");
  });
});
