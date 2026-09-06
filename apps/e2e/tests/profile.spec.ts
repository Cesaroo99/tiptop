import { expect, test } from "@playwright/test";
import { fetchSessionToken, loginOnPage } from "../helpers/auth";

const apiBase = () => process.env.E2E_API_URL ?? "http://localhost:3001";

async function unlinkFriend(username: string) {
  const token = await fetchSessionToken();
  const headers = { Authorization: `Bearer ${token}` };
  const profile = (await (await fetch(`${apiBase()}/api/profiles/${username}`, { headers })).json()) as { id?: string };
  if (profile.id) await fetch(`${apiBase()}/api/contacts/${profile.id}`, { method: "DELETE", headers });
}

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
    await expect(page.getByRole("button", { name: "Intéressé" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Liés" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Envies" })).toBeVisible();
    await page.getByRole("button", { name: "Envies" }).click();
    await expect(page.getByText(/À offrir à Erica|Tes envies/)).toBeVisible();
    await page.getByRole("button", { name: "Liés" }).click();
    await expect(page.getByRole("link", { name: /Expo photo|Afterwork|Tous voir/ }).first()).toBeVisible();
  });

  test("inconnue : demander amie, pas de message", async ({ page }) => {
    await unlinkFriend("william.ekani");
    await page.goto("/u/william.ekani");
    await expect(page.getByRole("heading", { name: "William Ekani" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Amie/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Message" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Poser mon like|Mon like est ici/ })).toBeVisible();
  });

  test("soi : état, pas d’actions visiteur", async ({ page }) => {
    await page.goto("/u/cesar_memoli");
    await expect(page.getByRole("button", { name: "Disponible", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Mon compte" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Message" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Ajouter comme amie" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Créer une envie d’événement" })).toBeVisible();
    await page.getByRole("button", { name: "Créer une envie d’événement" }).click();
    await page.getByPlaceholder("Ex. brunch jazz à Bastos").fill("Session photo Bastos");
    await page.getByRole("button", { name: "Ajouter" }).click();
    await expect(page.getByText("Session photo Bastos")).toBeVisible();
    await expect(page.getByText("Ton envie").first()).toBeVisible();
  });
});
