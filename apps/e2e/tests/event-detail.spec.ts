import { expect, test } from "@playwright/test";
import { fetchSessionToken, loginOnPage } from "../helpers/auth";

const apiBase = () => process.env.E2E_API_URL ?? "http://localhost:3001";
const ERICA = "+237690000001";

async function createDetailEvent(token: string) {
  const startsAt = new Date(Date.now() + 2 * 3600_000).toISOString();
  const res = await fetch(`${apiBase()}/api/events`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      title: "Sortie détail e2e",
      description: "On se voit vraiment, pas en stories.",
      city: "Yaoundé",
      zone: "Odza",
      startsAt,
    }),
  });
  const event = (await res.json()) as { id: string };
  return event.id;
}

test.describe("Détail événement", () => {
  test("carte compacte et personnes liées filtrées par visibilité", async ({ page, browser }) => {
    const token = await fetchSessionToken();
    const eventId = await createDetailEvent(token);

    await loginOnPage(page);
    await page.goto(`/events/${eventId}`);
    await expect(page.getByRole("heading", { name: "Sortie détail e2e" })).toBeVisible();
    await expect(page.getByText("Gratuit")).toBeVisible();
    await expect(page.getByText("Événement dans :")).toBeVisible();
    await expect(page.getByLabel("Coup de cœur")).toBeVisible();
    await expect(page.getByLabel("Commentaires")).toBeVisible();

    const people = page.getByTestId("event-linked-people");
    await expect(people.getByText(/Personnes liées à l’événement/)).toBeVisible();
    await expect(people.getByText("César Memoli")).toBeVisible();
    await expect(people.getByText("HOST")).toHaveCount(0);
    await expect(people.getByText("Erica Sinclair")).toHaveCount(0);

    const ericaCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const ericaPage = await ericaCtx.newPage();
    await loginOnPage(ericaPage, ERICA);
    await ericaPage.goto(`/events/${eventId}`);
    await ericaPage.getByRole("button", { name: "Intéressé" }).click();
    const ericaPeople = ericaPage.getByTestId("event-linked-people");
    await expect(ericaPeople.getByText("Erica Sinclair")).toBeVisible();
    await expect(ericaPeople.getByText("Toi seulement")).toBeVisible();
    await expect(ericaPeople.getByRole("button", { name: "Afficher ma participation" })).toBeVisible();
    await ericaPage.getByRole("button", { name: "Afficher ma participation" }).click();
    await expect(ericaPeople.getByRole("button", { name: "Masquer ma participation" })).toBeVisible();
    await ericaPage.getByRole("button", { name: "Masquer ma participation" }).click();
    await expect(ericaPeople.getByRole("button", { name: "Afficher ma participation" })).toBeVisible();
    await ericaCtx.close();

    await page.reload();
    await expect(page.getByTestId("event-linked-people").getByText("Erica Sinclair")).toHaveCount(0);
  });
});
