import { expect, test } from "@playwright/test";
import { loginOnPage } from "../helpers/auth";

test.describe("Mood — caméra puis son / texte / lieu", () => {
  test.beforeEach(async ({ page }) => {
    await loginOnPage(page);
  });

  test("Créer ouvre le studio, un modèle mène à l’éditeur", async ({ page }) => {
    await page.goto("/mood");
    await page.getByRole("link", { name: "Créer un mood" }).click();
    await expect(page).toHaveURL(/\/mood\/create/);
    await expect(page.getByText(/Filme, puis ajoute un son/)).toBeVisible();
    await page.getByRole("button", { name: "Rooftop" }).click();
    await expect(page.getByRole("button", { name: "Publier" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Texte" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Son" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Me géolocaliser" })).toBeVisible();
    await page.getByRole("button", { name: "Son" }).click();
    const sounds = page.getByRole("dialog", { name: "Choisir un son" });
    await expect(sounds).toBeVisible();
    await sounds.getByRole("button", { name: "Pulse Yaoundé" }).click();
    await expect(page.getByText("Audio • Pulse Yaoundé")).toBeVisible();
    await page.getByRole("button", { name: "Texte" }).click();
    await page.getByPlaceholder("Dites quelque chose...").fill("Sunset aujourd’hui");
    await page.getByRole("dialog", { name: "Texte" }).getByRole("button", { name: "OK" }).click();
    await expect(page.getByText("Sunset aujourd’hui")).toBeVisible();
  });
});
