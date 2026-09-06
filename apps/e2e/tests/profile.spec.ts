import { expect, test } from "@playwright/test";
import { loginOnPage } from "../helpers/auth";

test.describe("Profil — visiteur et soi", () => {
  test.beforeEach(async ({ page }) => {
    await loginOnPage(page);
  });

  test("amie : message, inviter, like, intérêts", async ({ page }) => {
    await page.goto("/u/erica.sinclair");
    await expect(page.getByRole("heading", { name: "Erica Sinclair" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Message" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Inviter" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Poser mon like|Mon like est ici/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Événements" })).toBeVisible();
    await expect(page.getByText(/À offrir à Erica|Tes envies/)).toBeVisible();
    await expect(page.getByText(/événement\(s\) lié/)).toBeVisible();
  });

  test("inconnue : demander amie, pas de message", async ({ page }) => {
    await page.goto("/u/nadege.atangana");
    await expect(page.getByRole("heading", { name: "Nadège Atangana" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Ajouter comme amie" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Message" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Poser mon like|Mon like est ici/ })).toBeVisible();
  });

  test("soi : état, pas d’actions visiteur", async ({ page }) => {
    await page.goto("/u/cesar_memoli");
    await expect(page.getByRole("button", { name: "Disponible", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Mon compte" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Message" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Ajouter comme amie" })).toHaveCount(0);
  });
});
