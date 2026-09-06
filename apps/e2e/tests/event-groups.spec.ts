import { expect, test } from "@playwright/test";
import { fetchSessionToken, loginOnPage } from "../helpers/auth";

const apiBase = () => process.env.E2E_API_URL ?? "http://localhost:3001";
const ERICA = "+237690000001";

async function createGroupedEvent(token: string) {
  const startsAt = new Date(Date.now() + 36 * 3600_000).toISOString();
  const res = await fetch(`${apiBase()}/api/events`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      title: "Sortie groupes e2e",
      city: "Yaoundé",
      startsAt,
      allowGroups: true,
    }),
  });
  const event = (await res.json()) as { id: string };
  return event.id;
}

test.describe("Groupes d’événement", () => {
  test("créer, inviter, accepter, quitter", async ({ page, browser }) => {
    const token = await fetchSessionToken();
    const ericaIdRes = await fetch(`${apiBase()}/api/profiles/erica.sinclair`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const erica = (await ericaIdRes.json()) as { id: string };
    await fetch(`${apiBase()}/api/contacts/${erica.id}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });

    const eventId = await createGroupedEvent(token);
    await loginOnPage(page);
    await page.goto(`/events/${eventId}`);
    await expect(page.getByText("Groupes")).toBeVisible();
    await page.getByRole("button", { name: "Créer un groupe" }).click();
    await page.getByPlaceholder("Ex. Table 4, Voiture A").fill("Voiture A");
    await page.getByRole("button", { name: "Créer un groupe" }).click();
    await expect(page.getByText("Voiture A")).toBeVisible();
    await expect(page.getByText("Créateur")).toBeVisible();

    await page.getByRole("button", { name: "Inviter" }).click();
    await expect(page.getByText("Erica Sinclair")).toBeVisible();
    await page.locator("li").filter({ hasText: "Erica Sinclair" }).getByRole("button", { name: "Inviter" }).click();
    await expect(page.locator("li").filter({ hasText: "Erica Sinclair" })).toHaveCount(0);

    const ericaCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const ericaPage = await ericaCtx.newPage();
    await loginOnPage(ericaPage, ERICA);
    await ericaPage.goto(`/events/${eventId}`);
    await expect(ericaPage.getByRole("button", { name: "Rejoindre" })).toBeVisible();
    await ericaPage.getByRole("button", { name: "Rejoindre" }).click();
    await expect(ericaPage.getByRole("button", { name: "Quitter" })).toBeVisible();
    await ericaPage.getByRole("button", { name: "Quitter" }).click();
    await expect(ericaPage.getByRole("button", { name: "Quitter" })).toHaveCount(0);
    await ericaCtx.close();
  });
});
