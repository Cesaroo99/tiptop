import { expect, test } from "@playwright/test";
import { ERICA } from "../helpers/accounts";
import { fetchSessionToken, loginOnPage } from "../helpers/auth";

const api = () => process.env.E2E_API_URL ?? "http://localhost:3001";

test.describe("Admin — smoke non destructif", () => {
  test("César ouvre le back-office", async ({ page }) => {
    await loginOnPage(page);
    await page.goto("/menu");
    await expect(page.getByText("Back-office")).toBeVisible();
    await page.getByText("Back-office").click();
    await expect(page.getByRole("heading", { name: "Back-office" })).toBeVisible();
    await expect(page.getByText("Comptes")).toBeVisible();
    await expect(page.getByText("Signalements ouverts")).toBeVisible();
  });

  test("Erica voit Accès refusé sur /admin", async ({ page }) => {
    await loginOnPage(page, ERICA.phone);
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Accès refusé" })).toBeVisible();
    await expect(page.getByText("Le back-office est réservé à l’équipe TipTop.")).toBeVisible();
  });

  test("API 403 ADMIN_ONLY pour Erica", async ({ request }) => {
    const token = await fetchSessionToken(ERICA.phone);
    const res = await request.get(`${api()}/api/admin/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toMatch(/ADMIN_ONLY/);
  });
});
