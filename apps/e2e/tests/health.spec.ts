import { expect, test } from "@playwright/test";

test("GET /api/health", async ({ request }) => {
  const api = process.env.E2E_API_URL ?? "http://localhost:3001";
  const res = await request.get(`${api}/api/health`);
  expect(res.ok()).toBeTruthy();
  await expect(res.json()).resolves.toMatchObject({ ok: true, service: "tiptop-api" });
});
