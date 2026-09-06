import { expect, test } from "@playwright/test";
import { loginOnPage } from "../helpers/auth";

test.describe("Messagerie — inbox et conversation", () => {
  test.beforeEach(async ({ page }) => {
    await loginOnPage(page);
  });

  test("liste, recherche, groupe consultable, envoi", async ({ page }) => {
    await page.goto("/messages");
    await expect(page.getByRole("heading", { name: "Mes messages" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Nouvelle conversation" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(page.locator('main a[href^="/messages/"]').filter({ hasText: "Erica Sinclair" })).toBeVisible();
    await expect(page.locator('main a[href^="/messages/"]').filter({ hasText: "Amina Ngo" })).toBeVisible();
    await expect(page.locator('main a[href^="/messages/"]').filter({ hasText: "Soirée Black & White" })).toBeVisible();

    await page.getByRole("button", { name: "Rechercher une conversation" }).click();
    await page.getByPlaceholder("Rechercher une conversation").fill("Amina");
    await expect(page.locator('main a[href^="/messages/"]').filter({ hasText: "Amina Ngo" })).toBeVisible();
    await expect(page.locator('main a[href^="/messages/"]').filter({ hasText: "Erica Sinclair" })).toHaveCount(0);

    await page.getByPlaceholder("Rechercher une conversation").fill("");
    await page.locator('main a[href^="/messages/"]').filter({ hasText: "Soirée Black & White" }).click();
    await expect(page.getByRole("heading", { name: "Soirée Black & White" })).toBeVisible();
    await expect(page.getByRole("link", { name: "# Général" })).toBeVisible();
    await expect(page.getByText("On a parlé du plan — Black & White à Damas.")).toBeVisible();
    await page.getByRole("button", { name: "Options" }).click();
    await expect(page.getByRole("link", { name: "Voir la sortie" })).toBeVisible();
    await page.getByRole("button", { name: "Retour" }).click();
    await expect(page.getByRole("heading", { name: "Mes messages" })).toBeVisible();

    await page.locator('main a[href^="/messages/"]').filter({ hasText: "Erica Sinclair" }).click();
    await expect(page.getByText("On se retrouve à Bastos ?")).toBeVisible();
    const note = `E2E MSG ${Date.now()}`;
    await page.getByPlaceholder("Écrire un message").fill(note);
    await page.getByRole("button", { name: "Envoyer" }).click();
    await expect(page.getByText(note)).toBeVisible();
    await expect(page.getByRole("button", { name: "Accueil" })).toBeVisible();
    await page.getByRole("button", { name: "Accueil" }).click();
    await expect(page).toHaveURL("/");
  });

  test("retour inbox mène à l’accueil, pas au fil précédent", async ({ page }) => {
    await page.goto("/messages");
    await page.locator('main a[href^="/messages/"]').filter({ hasText: "Erica Sinclair" }).click();
    await expect(page.getByText("On se retrouve à Bastos ?")).toBeVisible();
    await page.getByRole("button", { name: "Retour" }).click();
    await expect(page.getByRole("heading", { name: "Mes messages" })).toBeVisible();
    await page.getByRole("button", { name: "Retour" }).click();
    await expect(page).toHaveURL("/");
  });
});
