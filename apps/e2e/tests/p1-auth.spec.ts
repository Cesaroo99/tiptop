import { expect, test } from "@playwright/test";
import { CESAR } from "../helpers/accounts";
import { fillOtp } from "../helpers/auth";

test.describe("P1 — compte → OTP → accueil", () => {
  test("numéro invalide affiche le message i18n", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Bienvenue sur TipTop" })).toBeVisible();
    await page.getByLabel("Téléphone").fill("123");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page.getByText("Numéro de téléphone invalide.")).toBeVisible();
  });

  test("OTP 0000 affiche Code incorrect", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Téléphone").fill(CESAR.display);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page.getByRole("heading", { name: "OTP Code de vérification" })).toBeVisible();
    await fillOtp(page, "0000");
    await page.getByRole("button", { name: "Vérifier" }).click();
    await expect(page.getByText("Code incorrect.")).toBeVisible();
  });

  test("César se connecte avec 1234 et arrive sur le feed", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Téléphone").fill(CESAR.display);
    await page.getByLabel("Se souvenir de moi").check();
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page.getByRole("heading", { name: "OTP Code de vérification" })).toBeVisible();
    await fillOtp(page, CESAR.otp);
    await page.getByRole("button", { name: "Vérifier" }).click();
    await expect(page).not.toHaveURL(/\/otp/);
    await expect(page.getByText("Votre mood !")).toBeVisible();
    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
  });
});
