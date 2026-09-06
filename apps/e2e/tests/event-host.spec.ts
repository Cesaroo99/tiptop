import { expect, test } from "@playwright/test";
import { fetchSessionToken, loginOnPage } from "../helpers/auth";

const apiBase = () => process.env.E2E_API_URL ?? "http://localhost:3001";
const ERICA = "+237690000001";

async function createHostEvent(token: string) {
  const startsAt = new Date(Date.now() + 25 * 60_000).toISOString();
  const res = await fetch(`${apiBase()}/api/events`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      title: "Sortie hôte e2e",
      city: "Yaoundé",
      startsAt,
      requiresReservation: true,
    }),
  });
  const event = (await res.json()) as { id: string };
  return event.id;
}

test.describe("Organisateur — gestion et scan", () => {
  test("liste filtrée, badges paiement, validation d’entrée", async ({ page, browser }) => {
    const hostToken = await fetchSessionToken();
    const eventId = await createHostEvent(hostToken);

    const ericaToken = await fetchSessionToken(ERICA);
    const booked = await fetch(`${apiBase()}/api/reservations`, {
      method: "POST",
      headers: { Authorization: `Bearer ${ericaToken}`, "content-type": "application/json" },
      body: JSON.stringify({ eventId, includeSelf: true }),
    });
    expect(booked.ok).toBeTruthy();
    const reservation = (await booked.json()) as { tickets: Array<{ id: string }> };
    const ticketId = reservation.tickets[0]?.id;
    expect(ticketId).toBeTruthy();

    await loginOnPage(page);
    await page.goto(`/events/${eventId}/manage`);
    await expect(page.getByRole("heading", { name: "Sortie hôte e2e" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Valider ticket/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Tout/ })).toBeVisible();
    const list = page.getByTestId("host-people");
    await expect(list.getByText("Erica Sinclair")).toBeVisible();
    await expect(list.getByText("Payé")).toBeVisible();
    await expect(list.getByText("HOST")).toHaveCount(0);

    const ticket = (await (
      await fetch(`${apiBase()}/api/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${ericaToken}` },
      })
    ).json()) as { qr: string | null };
    expect(ticket.qr).toBeTruthy();

    await page.getByRole("link", { name: /Valider ticket/i }).click();
    await expect(page.getByRole("heading", { name: "Valider une entrée" })).toBeVisible();
    await page.getByLabel("Colle le code du ticket").fill(ticket.qr ?? "");
    await page.getByRole("button", { name: "Valider ticket" }).click();
    await expect(page.getByText(/Entrée validée/)).toBeVisible();

    await page.getByRole("button", { name: "Retour" }).click();
    await page.getByRole("button", { name: /Validés/ }).click();
    await expect(page.getByTestId("host-people").getByText("Erica Sinclair")).toBeVisible();
  });
});
