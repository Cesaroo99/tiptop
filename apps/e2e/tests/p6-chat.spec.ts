import { expect, test } from "@playwright/test";
import { loginOnPage } from "../helpers/auth";

test.describe("P6 — chat 1:1", () => {
  test.beforeEach(async ({ page }) => {
    await loginOnPage(page);
  });

  test("inbox seed Erica puis envoi d’un message", async ({ page }) => {
    await page.goto("/messages");
    await expect(page.getByRole("heading", { name: "Mes messages" })).toBeVisible();
    await expect(page.locator('main a[href^="/messages/"]').filter({ hasText: "Erica Sinclair" })).toBeVisible();
    await page.locator('main a[href^="/messages/"]').filter({ hasText: "Erica Sinclair" }).click();
    await expect(page.getByText("On se retrouve à Bastos ?")).toBeVisible();
    const note = `E2E P6 ${Date.now()}`;
    await page.getByPlaceholder("Écrire un message").fill(note);
    await page.getByRole("button", { name: "Envoyer" }).click();
    await expect(page.getByText(note)).toBeVisible();
  });
});
