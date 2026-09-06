import { expect, test } from "@playwright/test";
import { fetchSessionToken, loginOnPage } from "../helpers/auth";

const apiBase = () => process.env.E2E_API_URL ?? "http://localhost:3001";
const ERICA = "+237690000001";

test.describe("CTA Intéressé / Réserver + série", () => {
  test("fil et fiche : Intéressé + Réserver, même déjà réservé", async ({ page }) => {
    const token = await fetchSessionToken(ERICA);
    const startsAt = new Date(Date.now() + 4 * 3600_000).toISOString();
    const created = await fetch(`${apiBase()}/api/events`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({
        title: "Sortie CTA e2e",
        description: "On réserve aussi pour un autre.",
        city: "Yaoundé",
        zone: "Bastos",
        startsAt,
      }),
    });
    const event = (await created.json()) as { id: string };
    expect(created.ok).toBeTruthy();

    await loginOnPage(page);
    await page.goto("/");
    const card = page.locator("[data-kind=event]").filter({ hasText: "Sortie CTA e2e" }).first();
    await expect(card.getByRole("button", { name: "Intéressé" })).toBeVisible();
    await expect(card.getByLabel("Réserver")).toBeVisible();

    await page.goto(`/events/${event.id}`);
    await expect(page.getByRole("button", { name: "Intéressé" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Réserver" })).toBeVisible();

    const booked = await fetch(`${apiBase()}/api/reservations`, {
      method: "POST",
      headers: { Authorization: `Bearer ${await fetchSessionToken()}`, "content-type": "application/json" },
      body: JSON.stringify({ eventId: event.id, includeSelf: true }),
    });
    expect(booked.ok).toBeTruthy();

    await page.reload();
    await expect(page.getByRole("button", { name: "Intéressé" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Réserver pour un autre" })).toBeVisible();
  });

  test("compose hebdo : une carte, insigne Toutes les semaines", async ({ page }) => {
    await loginOnPage(page);
    await page.goto("/compose?type=event");
    await page.getByRole("button", { name: "Afterwork" }).click();
    await page.getByPlaceholder("Titre de la sortie").fill(`Afterwork série ${Date.now()}`);
    await page.getByRole("button", { name: "Publier" }).first().click();
    await expect(page.getByText("Votre mood !")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Toutes les semaines").first()).toBeVisible();
  });
});
