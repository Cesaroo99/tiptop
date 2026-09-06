import { expect, test } from "@playwright/test";
import { ERICA } from "../helpers/accounts";
import { fetchSessionToken, loginOnPage } from "../helpers/auth";

const api = () => process.env.E2E_API_URL ?? "http://localhost:3001";

test.describe("Admin — smoke non destructif", () => {
  test("César voit la commission TipTop à 0 % sur Paiements", async ({ page }) => {
    await loginOnPage(page);
    await page.goto("/menu");
    await expect(page.getByText("Back-office")).toBeVisible({ timeout: 30_000 });
    await page.getByText("Back-office").click();
    await expect(page.getByRole("heading", { name: "Back-office" })).toBeVisible();
    await page.getByRole("link", { name: "Paiements", exact: true }).click();
    await expect(page.getByText("Monétisation")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/Phase initiale : 0 %/)).toBeVisible();
    await expect(page.getByText(/prix du billet/)).toBeVisible();
    await expect(page.getByRole("spinbutton", { name: /Commission TipTop/ })).toHaveValue("0");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Commission enregistrée.")).toBeVisible();
    await expect(page.getByText(/Remboursement mock/)).toBeVisible();
    await page.screenshot({ path: "/opt/cursor/artifacts/admin_monetization_0.png", fullPage: true });
  });

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
