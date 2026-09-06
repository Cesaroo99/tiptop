import { expect, test } from "@playwright/test";
import { loginOnPage } from "../helpers/auth";

test.describe("Recherche in-app", () => {
  test.beforeEach(async ({ page }) => {
    await loginOnPage(page);
  });

  test("loupe du header, suggestions, apply et résultat réel", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Recherche" }).click();
    await expect(page).toHaveURL(/\/search/);
    await expect(page.getByRole("heading", { name: "Recherche" })).toBeVisible();
    await expect(page.getByPlaceholder("Recherche")).toBeVisible();
    await expect(page.getByRole("button", { name: "Tout" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Appliquer la recherche" })).toBeVisible();

    const results = page.getByTestId("search-results");
    await expect(results.getByText("Erica Sinclair")).toBeVisible();
    await expect(results.getByText(/Piscine party/)).toBeVisible();

    await page.getByPlaceholder("Recherche").fill("Piscine");
    await page.getByRole("button", { name: "Appliquer la recherche" }).click();
    await expect(page).toHaveURL(/q=Piscine/);
    await expect(results.getByText("Piscine party - Odza, Yaoundé")).toBeVisible();
    await expect(results.getByText(/participants/)).toBeVisible();
    await expect(results.getByLabel("Coup de cœur")).toBeVisible();
  });

  test("loupe Events préremplit l’onglet sorties", async ({ page }) => {
    await page.goto("/events");
    await page.locator('a[href="/search?type=events"]').click();
    await expect(page).toHaveURL(/type=events/);
    await expect(page.getByRole("button", { name: "Événements" })).toBeVisible();
    await expect(page.getByTestId("search-results").getByText(/Piscine party|Live session|Afterwork|Black/)).toBeVisible();
  });

  test("loupe Amies préremplit l’onglet personnes", async ({ page }) => {
    await page.goto("/people");
    await page.locator('a[href="/search?type=people"]').click();
    await expect(page).toHaveURL(/type=people/);
    await page.getByPlaceholder("Recherche").fill("Erica");
    await page.getByRole("button", { name: "Appliquer la recherche" }).click();
    await expect(page.getByTestId("search-results").getByText("Erica Sinclair")).toBeVisible();
    await page.getByTestId("search-results").getByText("Erica Sinclair").click();
    await expect(page).toHaveURL(/\/u\/erica\.sinclair/);
  });
});
