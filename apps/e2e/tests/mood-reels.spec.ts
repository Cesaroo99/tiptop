import { expect, test } from "@playwright/test";
import { loginOnPage } from "../helpers/auth";

test.describe("Mood — maquette Reels / like-time", () => {
  test.beforeEach(async ({ page }) => {
    await loginOnPage(page);
  });

  test("header, like-temps cumulé, suivre, lieu seulement si renseigné", async ({ page }) => {
    await page.goto("/mood");
    await expect(page.getByRole("link", { name: "Créer un mood" })).toBeVisible();
    await expect(page.getByText("0 s").first()).toBeVisible();
    await expect(page.getByText("/H")).toHaveCount(0);
    await expect(page.getByText("/J")).toHaveCount(0);
    await expect(page.getByText("/M")).toHaveCount(0);
    const follow = page.getByRole("button", { name: /Suivre|Abonné/ }).first();
    await expect(follow).toBeVisible();
    const before = await follow.innerText();
    await follow.click();
    await expect(follow).toHaveText(before.includes("Abonné") ? "Suivre" : "Abonné");
    await follow.click();
    await expect(follow).toHaveText(before);
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
    const commentsSheet = page.getByTestId("mood-comments-sheet");
    const commentsBox = await commentsSheet.boundingBox();
    const phone = page.locator("[data-phone-device] .phone-screen");
    const phoneBox = await phone.boundingBox();
    expect(commentsBox).toBeTruthy();
    expect(phoneBox).toBeTruthy();
    if (commentsBox && phoneBox) {
      expect(commentsBox.y).toBeGreaterThan(phoneBox.y + 80);
      expect(commentsBox.height).toBeLessThan(phoneBox.height * 0.78);
    }
    await expect(comments.getByPlaceholder("Ajouter un commentaire")).toBeVisible();
    const note = `Super rooftop ${Date.now()}`;
    await comments.getByPlaceholder("Ajouter un commentaire").fill(note);
    await comments.getByRole("button", { name: "Ajouter un commentaire" }).click();
    await expect(comments.getByText(note)).toBeVisible();
    await comments.getByText("Fermer", { exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Commentaires" })).toHaveCount(0);
  });
});
