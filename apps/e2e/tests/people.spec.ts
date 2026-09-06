import { expect, test } from "@playwright/test";
import { loginOnPage } from "../helpers/auth";

test.describe("Amies — cartes, distance, profil", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 3.848, longitude: 11.5021 });
    await loginOnPage(page);
  });

  test("titre, voyants, distance et profil", async ({ page }) => {
    await page.goto("/people");
    await expect(page.getByRole("heading", { name: "Amies disponibles" })).toBeVisible();
    await expect(page.getByText("Mon état")).toBeVisible();
    await expect(page.getByRole("button", { name: "Disponible", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Je ne sais pas", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Indisponible", exact: true })).toBeVisible();

    await expect(page.getByRole("heading", { level: 2 })).toBeVisible();
    await expect(page.getByText(/km| m$/).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Voir le profil" })).toBeVisible();

    await page.getByRole("link", { name: "Voir le profil" }).click();
    await expect(page).toHaveURL(/\/u\//);
    await expect(page.getByText(/Disponible|Je ne sais pas|Indisponible/).first()).toBeVisible();
  });
});
