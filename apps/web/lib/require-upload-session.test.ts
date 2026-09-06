import { describe, expect, it } from "vitest";
import { hasUploadAuth, uploadAuthFromRequest } from "./require-upload-session";

describe("session upload", () => {
  it("exige un bearer ou le cookie de session", () => {
    expect(hasUploadAuth({})).toBe(false);
    expect(hasUploadAuth({ authorization: "Bearer" })).toBe(false);
    expect(hasUploadAuth({ authorization: "Bearer tok_abc" })).toBe(true);
    expect(hasUploadAuth({ cookie: "other=1; tiptop_session=abc" })).toBe(true);
    expect(hasUploadAuth({ cookie: "theme=dark" })).toBe(false);
  });

  it("lit les en-têtes de la requête", () => {
    const req = new Request("http://localhost/upload/video", {
      headers: { authorization: "Bearer tok_abc" },
    });
    expect(uploadAuthFromRequest(req)).toEqual({ authorization: "Bearer tok_abc", cookie: undefined });
  });
});
