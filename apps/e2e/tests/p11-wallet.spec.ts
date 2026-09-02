import { expect, test } from "@playwright/test";
import { loginOnPage } from "../helpers/auth";

test.describe("P11 — un like transférable + rythme", () => {
  test.beforeEach(async ({ page }) => {
    await loginOnPage(page);
  });

  test("affiche mon like, où il est, et ce que je produis", async ({ page }) => {
    await page.goto("/likes");
    await expect(page.getByRole("heading", { name: "Mon like" })).toBeVisible();
    await expect(page.getByText(/Tu n.as qu.un like/)).toBeVisible();
    await expect(page.getByText("Rythme des likes reçus")).toBeVisible();
    await expect(page.getByText(/Qui t.a posé son like/)).toBeVisible();
  });

  test("le pack mock reste un ledger séparé", async ({ page }) => {
    await page.goto("/likes/buy");
    await expect(page.getByRole("heading", { name: "Acheter des likes" })).toBeVisible();
    await page.getByLabel("Simuler un échec").check();
    await page.getByRole("button", { name: "Payer" }).click();
    await expect(page.getByText("Paiement échoué. Aucun like n’a été crédité.")).toBeVisible();
    await page.getByLabel("Simuler un échec").uncheck();
    await page.getByRole("button", { name: "Payer" }).click();
    await expect(page.getByRole("heading", { name: "Likes ajoutés" }).first()).toBeVisible();
  });
});
