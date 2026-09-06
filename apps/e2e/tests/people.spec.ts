import { expect, test } from "@playwright/test";
import { fetchSessionToken, loginOnPage } from "../helpers/auth";

const apiBase = () => process.env.E2E_API_URL ?? "http://localhost:3001";

async function authHeaders() {
  const token = await fetchSessionToken();
  return { Authorization: `Bearer ${token}` };
}

async function profileId(username: string, headers: HeadersInit) {
  const res = await fetch(`${apiBase()}/api/profiles/${username}`, { headers });
  const data = (await res.json()) as { id: string };
  return data.id;
}

async function restoreLaterSeed() {
  const headers = await authHeaders();
  for (const username of ["sarah.nkodo", "rachel.essomba"]) {
    const id = await profileId(username, headers);
    await fetch(`${apiBase()}/api/contacts/${id}`, { method: "DELETE", headers });
    await fetch(`${apiBase()}/api/invite-later/${id}`, { method: "POST", headers });
  }
  const fouda = await profileId("jp.fouda", headers);
  await fetch(`${apiBase()}/api/contacts/${fouda}`, { method: "DELETE", headers });
  await fetch(`${apiBase()}/api/invite-later/${fouda}`, { method: "DELETE", headers });
}

test.describe("Amies — cartes, distance, profil", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 3.848, longitude: 11.5021 });
    await loginOnPage(page);
  });

  test("titre, filtres, distance et profil visiteur", async ({ page }) => {
    await page.goto("/people");
    await expect(page.getByRole("heading", { name: "Autour de moi" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Amies/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Autour/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Mis de côté/ })).toBeVisible();
    await expect(page.getByText("Mon état")).toHaveCount(0);
    await expect(page.getByText("Ton état")).toHaveCount(0);

    await expect(page.getByRole("heading", { level: 2 })).toBeVisible();
    await expect(page.getByText(/km| m$/).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Voir le profil" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Poser ma vie|Ma vie est ici/ })).toBeVisible();

    await page.getByRole("button", { name: "Filtres" }).click();
    await expect(page.getByText("Tous les états")).toBeVisible();
    await page.getByRole("button", { name: "Disponible", exact: true }).click();
    await page.getByRole("button", { name: "Appliquer" }).click();
    await expect(page.getByRole("heading", { name: "Disponibles autour" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Filtres · 1/ })).toBeVisible();

    await page.getByRole("button", { name: /Amies/ }).click();
    await expect(page.getByRole("heading", { name: "Amies disponibles" })).toBeVisible();
    await page.getByRole("button", { name: /Filtres · 1/ }).click();
    await page.getByRole("button", { name: "Effacer" }).click();
    await page.getByRole("button", { name: /Autour/ }).click();
    await expect(page.getByRole("heading", { name: "Autour de moi" })).toBeVisible();

    await page.getByRole("link", { name: "Voir le profil" }).click();
    await expect(page).toHaveURL(/\/u\//);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: /Message|Amie|Ajouter comme amie/ })).toBeVisible();
    await expect(page.getByText("Tu le choisis ici")).toHaveCount(0);
  });

  test("mis de côté : Retirer + ajouter comme amie sans disparaître", async ({ page }) => {
    await restoreLaterSeed();
    await page.goto("/people");
    await page.getByRole("button", { name: /Mis de côté/ }).click();
    await expect(page.getByRole("heading", { name: "Mis de côté" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Retirer" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Mis de côté", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Ajouter comme amie" })).toBeVisible();

    const nameEl = page.locator("article h2 .type-h2");
    const name = (await nameEl.innerText()).replace(/\s+/g, " ").trim();
    await page.getByRole("button", { name: "Ajouter comme amie" }).click();
    await expect(page.getByRole("button", { name: "Déjà amie" })).toBeVisible();
    await expect(nameEl).toHaveText(name);
    await page.getByRole("button", { name: "Passer" }).click();
    await page.getByRole("button", { name: "Précédent" }).click();
    await expect(nameEl).toHaveText(name);
    await expect(page.getByRole("button", { name: "Déjà amie" })).toBeVisible();

    const token = await fetchSessionToken();
    const headers = { Authorization: `Bearer ${token}` };
    const res = await fetch(`${apiBase()}/api/discovery/people?city=${encodeURIComponent("Yaoundé")}`, { headers });
    const data = (await res.json()) as { items: Array<{ id: string; firstName: string; lastName: string }> };
    const person = data.items.find((p) => `${p.firstName} ${p.lastName}` === name);
    if (person) {
      await fetch(`${apiBase()}/api/contacts/${person.id}`, { method: "DELETE", headers });
      await fetch(`${apiBase()}/api/invite-later/${person.id}`, { method: "POST", headers });
    }
  });

  test("profil soi : régler l’état, pas les actions visiteur", async ({ page }) => {
    await page.goto("/u/cesar_memoli");
    await expect(page.getByText("Ton état")).toBeVisible();
    await expect(page.getByRole("button", { name: "Disponible", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Je ne sais pas", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Indisponible", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Mon compte" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Message" })).toHaveCount(0);
    await page.getByRole("button", { name: "Je ne sais pas", exact: true }).click();
    await expect(page.getByRole("button", { name: "Je ne sais pas", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Disponible", exact: true }).click();
  });
});
