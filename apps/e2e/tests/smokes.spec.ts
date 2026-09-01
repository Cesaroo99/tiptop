import { expect, test } from "@playwright/test";
import { loginOnPage } from "../helpers/auth";

test.describe("Smokes parcours 3–5, 8, 12", () => {
  test.beforeEach(async ({ page }) => {
    await loginOnPage(page);
  });

  test("P3 — découverte personnes (liste ou vide réel)", async ({ page }) => {
    await page.goto("/people");
    await expect(page.getByText(/Amies disponibles|Personne dispo dans ta zone/)).toBeVisible();
  });

  test("P4 — liste des sorties", async ({ page }) => {
    await page.goto("/events");
    await expect(page.getByRole("button", { name: "Tous" })).toBeVisible();
    await expect(page.getByText("Soirée Black & White").first()).toBeVisible();
  });

  test("P4/P5 — écran tickets", async ({ page }) => {
    await page.goto("/tickets");
    await expect(page.getByRole("heading", { name: "Les Tickets" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Tickets" })).toBeVisible();
  });

  test("P8 — rail mood", async ({ page }) => {
    await page.goto("/mood");
    await expect(page.getByText("Créer un mood").first()).toBeVisible();
  });

  test("P12 — notifications in-app", async ({ page }) => {
    await page.goto("/notifications");
    await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
    await expect(page.getByText("Tout marquer comme lu")).toBeVisible();
  });
});
