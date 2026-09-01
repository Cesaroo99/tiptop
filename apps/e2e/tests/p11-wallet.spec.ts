import { expect, test } from "@playwright/test";
import { loginOnPage } from "../helpers/auth";

test.describe("P11 — portefeuille likes mock", () => {
  test.beforeEach(async ({ page }) => {
    await loginOnPage(page);
  });

  test("affiche le portefeuille, simule un échec, puis crédite un pack", async ({ page }) => {
    await page.goto("/likes");
    await expect(page.getByRole("heading", { name: "Portefeuille likes" })).toBeVisible();
    await expect(page.getByText("Paiement mock")).toBeVisible();
    await page.getByRole("link", { name: /1 likes/ }).first().click();
    await expect(page.getByRole("heading", { name: "Acheter des likes" })).toBeVisible();
    await page.getByLabel("Simuler un échec").check();
    await page.getByRole("button", { name: "Payer" }).click();
    await expect(page.getByText("Paiement échoué. Aucun like n’a été crédité.")).toBeVisible();
    await page.getByLabel("Simuler un échec").uncheck();
    await page.getByRole("button", { name: "Payer" }).click();
    await expect(page.getByRole("heading", { name: "Likes ajoutés" }).first()).toBeVisible();
  });
});
