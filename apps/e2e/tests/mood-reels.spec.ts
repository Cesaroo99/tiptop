import { expect, test } from "@playwright/test";
import { loginOnPage } from "../helpers/auth";

test.describe("Mood — maquette Reels / like-time", () => {
  test.beforeEach(async ({ page }) => {
    await loginOnPage(page);
  });

  test("header, like-time /H /J /M, lieu seulement si renseigné", async ({ page }) => {
    await page.goto("/mood");
    await expect(page.getByRole("link", { name: "Créer un mood" })).toBeVisible();
    await expect(page.getByText("0 s").first()).toBeVisible();
    await expect(page.getByText("/H").first()).toBeVisible();
    await expect(page.getByText("/J").first()).toBeVisible();
    await expect(page.getByText("/M").first()).toBeVisible();
    await expect(page.getByText("Ajouter un commentaire").first()).toBeVisible();
    await expect(page.locator("video").first()).toBeVisible();

    const firstSlide = page.locator("section").first();
    await expect(firstSlide.getByText("Petit plat qui sent trop bon")).toBeVisible();
    await expect(firstSlide.getByRole("button", { name: "Rooftop Bastos" })).toHaveCount(0);

    await page.keyboard.press("ArrowDown");
    const place = page.getByRole("button", { name: "Rooftop Bastos" });
    await place.scrollIntoViewIfNeeded();
    await expect(place).toBeVisible();
    await place.click();
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByRole("heading", { name: "Lieu" })).toBeVisible();
    await expect(sheet.getByText("Rue 1.770, Bastos, Yaoundé, Cameroun")).toBeVisible();
    await sheet.getByRole("button", { name: "Fermer" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.locator("section").nth(1).getByRole("button", { name: "Commentaires" }).click();
    const comments = page.getByRole("dialog", { name: "Commentaires" });
    await expect(comments).toBeVisible();
    await expect(comments.getByPlaceholder("Ajouter un commentaire")).toBeVisible();
    await comments.getByPlaceholder("Ajouter un commentaire").fill("Super rooftop");
    await comments.getByRole("button", { name: "Ajouter un commentaire" }).click();
    await expect(comments.getByText("Super rooftop")).toBeVisible();
    await comments.getByRole("button", { name: "Fermer" }).click();
    await expect(page.getByRole("dialog", { name: "Commentaires" })).toHaveCount(0);
  });
});
