import { expect, test } from "@playwright/test";
import { loginOnPage } from "../helpers/auth";

test.describe("Mood — lieu optionnel façon TikTok", () => {
  test.beforeEach(async ({ page }) => {
    await loginOnPage(page);
  });

  test("pastille adresse sur une vidéo, carte et itinéraire", async ({ page }) => {
    await page.goto("/mood");
    const chip = page.getByRole("button", { name: "Rooftop Bastos" });
    await expect(chip).toBeVisible();
    await chip.click();
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByRole("heading", { name: "Lieu" })).toBeVisible();
    await expect(sheet.getByText("Rue 1.770, Bastos, Yaoundé, Cameroun")).toBeVisible();
    await expect(sheet.getByRole("button", { name: "Y aller" })).toBeVisible();
    await sheet.getByRole("button", { name: "Fermer" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("la création propose un lieu optionnel (saisie ou géoloc)", async ({ page }) => {
    await page.goto("/compose?type=mood");
    await expect(page.getByText("Ajouter un lieu")).toBeVisible();
    await page.getByRole("button", { name: /Ajouter un lieu/ }).click();
    await expect(page.getByPlaceholder("Rechercher un lieu ou une adresse")).toBeVisible();
    await expect(page.getByRole("button", { name: "Me géolocaliser" })).toBeVisible();
    await page.getByPlaceholder("Rechercher un lieu ou une adresse").fill("Rooftop Bastos, Yaoundé");
    await page.getByPlaceholder("Rechercher un lieu ou une adresse").blur();
    await expect(page.getByText(/Rooftop Bastos/)).toBeVisible();
  });
});
