import type { Page } from "@playwright/test";
import { CESAR } from "./accounts";

const apiBase = () => process.env.E2E_API_URL ?? "http://localhost:3001";

export async function fetchSessionToken(phone = CESAR.phone): Promise<string> {
  const headers = { "content-type": "application/json" };
  const requested = await fetch(`${apiBase()}/api/auth/otp/request`, {
    method: "POST",
    headers,
    body: JSON.stringify({ phone, country: "CM" }),
  });
  if (!requested.ok && requested.status !== 429) {
    throw new Error(`otp/request ${requested.status} ${await requested.text()}`);
  }
  const verified = await fetch(`${apiBase()}/api/auth/otp/verify`, {
    method: "POST",
    headers,
    body: JSON.stringify({ phone, code: "1234", rememberMe: true, country: "CM" }),
  });
  if (!verified.ok) {
    throw new Error(`otp/verify ${verified.status} ${await verified.text()}`);
  }
  const data = (await verified.json()) as { token?: string };
  if (!data.token) throw new Error("otp/verify sans token");
  return data.token;
}

/** Injecte la session avant le premier `goto` de la page. */
export async function loginOnPage(page: Page, phone = CESAR.phone) {
  const token = await fetchSessionToken(phone);
  await page.addInitScript((t: string) => {
    sessionStorage.setItem("tiptop_token", t);
    localStorage.setItem("tiptop_token", t);
    localStorage.setItem("tiptop_remember", "1");
  }, token);
}

export async function fillOtp(page: Page, code: string) {
  const digits = code.split("");
  for (let i = 0; i < digits.length; i += 1) {
    await page.getByLabel(`Digit ${i + 1}`).fill(digits[i] ?? "");
  }
}
