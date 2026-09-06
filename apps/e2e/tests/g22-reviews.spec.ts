import { expect, test } from "@playwright/test";
import { loginOnPage } from "../helpers/auth";

test.describe("G22 — avis post-sortie", () => {
  test.beforeEach(async ({ page }) => {
    await loginOnPage(page);
  });

  test("sortie passée : avis d’Erica + César peut écrire", async ({ page }) => {
    await page.goto("/tickets");
    await expect(page.getByText("Rooftop Damas (passée)").first()).toBeVisible();
    const write = page.getByText("Laisser un avis");
    if ((await write.count()) > 0) {
      await write.first().click();
    } else {
      await page.getByText("Rooftop Damas (passée)").first().click();
      await page.getByText("Laisser un avis").click();
    }
    await expect(page.getByText("Belle lumière, on a vraiment sorti. Merci Mbelle.")).toBeVisible();
    const form = page.getByPlaceholder("Comment s’est passée la sortie ?");
    if (await form.isVisible()) {
      const body = `E2E G22 ${Date.now()}`;
      await form.fill(body);
      await page.getByRole("button", { name: "Publier l’avis" }).click();
      await expect(page.getByText(body)).toBeVisible();
      await expect(page.getByText("Merci. Ton avis aide les suivants à sortir.")).toBeVisible();
    } else {
      await expect(page.getByText("Tu as déjà laissé un avis.")).toBeVisible();
    }
  });
});
