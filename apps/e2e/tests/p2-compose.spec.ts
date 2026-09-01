import { expect, test } from "@playwright/test";
import { loginOnPage } from "../helpers/auth";

test.describe("P2 — publication → feed", () => {
  test.beforeEach(async ({ page }) => {
    await loginOnPage(page);
  });

  test("publie un texte et le retrouve à l’accueil", async ({ page }) => {
    const body = `E2E P2 ${Date.now()}`;
    await page.goto("/compose");
    await expect(page.getByText("Publication").first()).toBeVisible();
    await page.locator("textarea").fill(body);
    await page.getByRole("button", { name: "Publier" }).first().click();
    await expect(page.getByText("Votre mood !")).toBeVisible();
    await expect(page.getByText(body)).toBeVisible();
  });
});
