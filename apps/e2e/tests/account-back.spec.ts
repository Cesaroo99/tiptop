import { expect, test } from "@playwright/test";
import { loginOnPage } from "../helpers/auth";

test.describe("Retour et compte self-service", () => {
  test.beforeEach(async ({ page }) => {
    await loginOnPage(page);
  });

  test("recherche et profil ont un bouton Retour", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Recherche" }).click();
    await expect(page).toHaveURL(/\/search/);
    await expect(page.getByLabel("Retour")).toBeVisible();
    await page.getByLabel("Retour").click();
    await expect(page).toHaveURL(/\/$/);

    await page.goto("/u/erica.sinclair");
    await expect(page.getByRole("heading", { name: "Erica Sinclair" })).toBeVisible();
    await expect(page.getByLabel("Retour")).toBeVisible();
  });

  test("l’utilisateur édite sa bio depuis Mon compte", async ({ page }) => {
    await page.goto("/account");
    await expect(page.getByRole("heading", { name: "Mon compte" })).toBeVisible();
    await expect(page.getByLabel("Retour")).toBeVisible();
    const bio = page.getByLabel("À propos de toi");
    await expect(bio).toBeVisible();
    const next = `On sort vraiment. ${Date.now()}`;
    await bio.fill(next);
    await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
    await expect(page.getByText("Modifications enregistrées")).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("À propos de toi")).toHaveValue(next);
  });
});
