import { describe, expect, it } from "vitest";
import { likeErrorKind } from "./LikeDialogs";

describe("likeErrorKind", () => {
  it("reconnaît le transfert et l’achat", () => {
    expect(likeErrorKind("LIKE_TRANSFER_REQUIRED")).toBe("transfer");
    expect(likeErrorKind("HEART_TRANSFER_REQUIRED")).toBe("transfer");
    expect(likeErrorKind("LIKE_NO_UNITS")).toBe("buy");
    expect(likeErrorKind("LIKE_ALREADY_ON_TARGET")).toBeNull();
  });
});
