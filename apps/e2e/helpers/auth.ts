import type { Page } from "@playwright/test";
import { CESAR } from "./accounts";

const apiBase = () => process.env.E2E_API_URL ?? "http://localhost:3001";
const tokenCache = new Map<string, string>();

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchSessionToken(phone = CESAR.phone): Promise<string> {
  const hit = tokenCache.get(phone);
  if (hit) return hit;

  const headers = { "content-type": "application/json" };
  let last = "";
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const requested = await fetch(`${apiBase()}/api/auth/otp/request`, {
      method: "POST",
      headers,
      body: JSON.stringify({ phone, country: "CM" }),
    });
    if (!requested.ok && requested.status !== 429) {
      last = `otp/request ${requested.status} ${await requested.text()}`;
      await sleep(400);
      continue;
    }
    const verified = await fetch(`${apiBase()}/api/auth/otp/verify`, {
      method: "POST",
      headers,
      body: JSON.stringify({ phone, code: "1234", rememberMe: true, country: "CM" }),
    });
    if (verified.ok) {
      const data = (await verified.json()) as { token?: string };
      if (data.token) {
        tokenCache.set(phone, data.token);
        return data.token;
      }
    }
    last = `otp/verify ${verified.status} ${await verified.text()}`;
    if (/OTP_CONSUMED|OTP_EXPIRED|OTP_LOCKED/.test(last)) {
      await sleep(500);
      continue;
    }
    throw new Error(last);
  }
  throw new Error(last || "otp: trop de tentatives");
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
