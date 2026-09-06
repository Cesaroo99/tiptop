import { expect, test } from "@playwright/test";
import { loginOnPage } from "../helpers/auth";

test.describe("Notifications — inbox fonctionnelle", () => {
  test.beforeEach(async ({ page }) => {
    await loginOnPage(page);
  });

  test("liste, deep link, invitation consultée avant accept/refus", async ({ page }) => {
    await page.goto("/notifications");
    await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
    await expect(page.getByText("Tout marquer comme lu")).toBeVisible();
    await expect(page.getByText(/Nouveau|Plus tôt/).first()).toBeVisible();

    const invite = page.getByRole("button", { name: /t’a invité à une sortie|t'a invité à une sortie/ }).first();
    await expect(invite).toBeVisible();
    await expect(invite.getByText("Consulter l’invitation")).toBeVisible();
    await expect(invite.getByRole("button", { name: "Accepter" })).toHaveCount(0);

    await invite.click();
    const sheet = page.getByRole("dialog", { name: "Invitation" });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText("Brunch Odza")).toBeVisible();
    await expect(sheet.getByRole("link", { name: "Voir la sortie" })).toBeVisible();
    await expect(sheet.getByRole("button", { name: "Accepter" })).toBeVisible();
    await expect(sheet.getByRole("button", { name: "Refuser" })).toBeVisible();
    await sheet.getByRole("button", { name: "Fermer" }).click();
    await expect(page.getByRole("dialog", { name: "Invitation" })).toHaveCount(0);

    const follow = page.getByRole("button", { name: /t’a suivi|t'a suivi/ }).first();
    await follow.click();
    await expect(page).toHaveURL(/\/u\//);
  });
});
