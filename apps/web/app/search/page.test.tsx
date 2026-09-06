import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TestI18nProvider } from "@/lib/test-utils";

const searchMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/search",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), back: vi.fn() }),
}));

vi.mock("@/lib/session", () => ({
  useSession: () => ({
    user: {
      id: "1",
      profileCompleted: true,
      city: "Yaoundé",
      zone: "Carrefour Damas",
      firstName: "César",
      lastName: "Memoli",
      username: "cesar_memoli",
    },
    loading: false,
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    api: vi.fn().mockImplementation(async (path: string) => {
      if (String(path).includes("/notifications")) return { unreadCount: 5 };
      if (String(path).includes("/conversations")) return { unreadTotal: 0 };
      if (String(path).startsWith("/search")) {
        searchMock(String(path));
        return {
          suggested: !String(path).includes("q=Piscine"),
          people: [
            {
              id: "u-erica",
              username: "erica.sinclair",
              firstName: "Erica",
              lastName: "Sinclair",
              certified: false,
              profession: "Téléconseillère",
              city: "Yaoundé",
              avatarUrl: null,
              available: true,
            },
          ],
          posts: [],
          events: [
            {
              id: "evt-piscine",
              title: "Piscine party - Odza, Yaoundé",
              imageUrl: "/seed/events/piscine.jpg",
              startsAt: new Date(Date.now() + 3 * 24 * 3600_000).toISOString(),
              city: "Yaoundé",
              zone: "Odza",
              priceXaf: 5000,
              currency: "XAF",
              taken: 4,
              capacity: 40,
              remaining: 36,
              viewerHearted: false,
              host: {
                username: "alex.moullion",
                firstName: "Alex",
                lastName: "Moullion",
                avatarUrl: null,
              },
            },
          ],
          wishes: [],
          moods: [],
          offers: [],
        };
      }
      return {};
    }),
  };
});

import Page from "./page";

describe("Écran recherche", () => {
  it("montre le lieu, les onglets, le bouton apply et les suggestions", async () => {
    render(
      <TestI18nProvider>
        <Page />
      </TestI18nProvider>,
    );
    expect(screen.getByRole("heading", { name: "Recherche" })).toBeInTheDocument();
    expect(screen.getByLabelText("Retour")).toBeInTheDocument();
    expect(screen.getByText("Yaoundé - Carrefour Damas")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Recherche")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tout" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Personnes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publications" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Événements" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Appliquer la recherche" })).toBeInTheDocument();
    expect(await screen.findByText("Erica Sinclair")).toBeInTheDocument();
    expect(screen.getByText("Téléconseillère")).toBeInTheDocument();
    expect(screen.getByText("Piscine party - Odza, Yaoundé")).toBeInTheDocument();
    expect(screen.getByText(/36 places restantes/)).toBeInTheDocument();
    expect(screen.getByText(/Autour de Yaoundé/)).toBeInTheDocument();
  });

  it("applique une recherche texte via le bouton", async () => {
    render(
      <TestI18nProvider>
        <Page />
      </TestI18nProvider>,
    );
    await screen.findByText("Erica Sinclair");
    fireEvent.change(screen.getByPlaceholderText("Recherche"), { target: { value: "Piscine" } });
    fireEvent.click(screen.getByRole("button", { name: "Appliquer la recherche" }));
    await waitFor(() => {
      expect(searchMock.mock.calls.some((call) => String(call[0]).includes("q=Piscine"))).toBe(true);
    });
  });
});
