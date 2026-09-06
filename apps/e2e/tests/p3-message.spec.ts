import { expect, test } from "@playwright/test";
import { loginOnPage } from "../helpers/auth";

test.describe("P3 — Message ouvre un vrai DM", () => {
  test.beforeEach(async ({ page }) => {
    await loginOnPage(page);
  });

  test("profil Erica → Message → conversation", async ({ page }) => {
    await page.goto("/u/erica.sinclair");
    await expect(page.getByRole("heading", { name: /Erica Sinclair/ })).toBeVisible();
    await page.getByRole("button", { name: "Message" }).click();
    await expect(page).toHaveURL(/\/messages\//);
    await expect(page.getByText("On se retrouve à Bastos ?")).toBeVisible();
  });
});
