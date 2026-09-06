import { expect, test } from "@playwright/test";
import { loginOnPage } from "../helpers/auth";

test.describe("Amies — cartes, distance, profil", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 3.848, longitude: 11.5021 });
    await loginOnPage(page);
  });

  test("titre, filtres, distance et profil visiteur", async ({ page }) => {
    await page.goto("/people");
    await expect(page.getByRole("heading", { name: "Autour de moi" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Amies/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Autour/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Mis de côté/ })).toBeVisible();
    await expect(page.getByText("Mon état")).toHaveCount(0);
    await expect(page.getByText("Ton état")).toHaveCount(0);

    await expect(page.getByRole("heading", { level: 2 })).toBeVisible();
    await expect(page.getByText(/km| m$/).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Voir le profil" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Poser mon like|Mon like est ici/ })).toBeVisible();

    await page.getByRole("button", { name: "Filtres" }).click();
    await expect(page.getByText("Tous les états")).toBeVisible();
    await page.getByRole("button", { name: "Disponible", exact: true }).click();
    await page.getByRole("button", { name: "Appliquer" }).click();
    await expect(page.getByRole("heading", { name: "Disponibles autour" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Filtres · 1/ })).toBeVisible();

    await page.getByRole("button", { name: /Amies/ }).click();
    await expect(page.getByRole("heading", { name: "Amies disponibles" })).toBeVisible();
    await page.getByRole("button", { name: /Filtres · 1/ }).click();
    await page.getByRole("button", { name: "Effacer" }).click();
    await page.getByRole("button", { name: /Autour/ }).click();
    await expect(page.getByRole("heading", { name: "Autour de moi" })).toBeVisible();

    await page.getByRole("link", { name: "Voir le profil" }).click();
    await expect(page).toHaveURL(/\/u\//);
    await expect(page.getByText(/Disponible|Je ne sais pas|Indisponible/).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Message" })).toBeVisible();
    await expect(page.getByText("Tu le choisis ici")).toHaveCount(0);
  });

  test("profil soi : régler l’état, pas les actions visiteur", async ({ page }) => {
    await page.goto("/u/cesar_memoli");
    await expect(page.getByText("Ton état")).toBeVisible();
    await expect(page.getByRole("button", { name: "Disponible", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Je ne sais pas", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Indisponible", exact: true })).toBeVisible();
    await expect(page.getByText(/Tu le choisis ici/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Mon compte" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Message" })).toHaveCount(0);
    await page.getByRole("button", { name: "Je ne sais pas", exact: true }).click();
    await expect(page.getByRole("button", { name: "Je ne sais pas", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Disponible", exact: true }).click();
  });
});
