import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestI18nProvider } from "@/lib/test-utils";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
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
      username: "cesar",
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
      if (String(path) === "/feed") {
        return {
          items: [
            {
              id: "p1",
              body: "Un tour au Black&White : on se retrouve ce soir.",
              imageUrl: "/seed/events/black-white.jpg",
              city: "Yaoundé",
              zone: "Carrefour Damas",
              createdAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
              commentsCount: 12,
              sharesCount: 4,
              likedAuthor: false,
              viewerFollows: false,
              authorActiveLikes: 0,
              author: {
                id: "u1",
                username: "cesar_memoli",
                firstName: "César",
                lastName: "Memoli",
                certified: true,
                avatarUrl: null,
                available: true,
              },
              event: {
                id: "evt-bw",
                title: "Soirée Black & White",
                startsAt: new Date(Date.now() + 20 * 60_000).toISOString(),
                minAge: 18,
                interestedCount: 3,
                reservedCount: 8,
                viewerInterested: false,
              },
            },
          ],
          moods: [
            {
              id: "m1",
              body: "Dehors",
              imageUrl: null,
              videoUrl: null,
              expiresAt: new Date(Date.now() + 3600_000).toISOString(),
              createdAt: new Date().toISOString(),
              commentsCount: 0,
              likedAuthor: false,
              authorActiveLikes: 0,
              activity: null,
              city: "Yaoundé",
              zone: "Bastos",
              event: null,
              companion: null,
              author: {
                id: "u2",
                username: "erica",
                firstName: "Erica",
                lastName: "Sinclair",
                certified: false,
                avatarUrl: null,
                city: "Yaoundé",
              },
            },
          ],
        };
      }
      if (String(path).includes("/notifications")) return { unreadCount: 5 };
      if (String(path).includes("/conversations")) return { unreadTotal: 0 };
      return {};
    }),
  };
});

import Page from "./page";

describe("Accueil — maquette pulse", () => {
  it("montre le lieu, les moods et le fil — sans besoin ni « dehors maintenant »", async () => {
    render(
      <TestI18nProvider>
        <Page />
      </TestI18nProvider>,
    );
    expect(screen.getByText("Yaoundé - Carrefour Damas")).toBeInTheDocument();
    expect(screen.getByText("Ton statut")).toBeInTheDocument();
    expect(await screen.findByText("Erica Sinclair")).toBeInTheDocument();
    expect(await screen.findByText("César Memoli")).toBeInTheDocument();
    expect(screen.queryByText("Tu cherches quoi ?")).not.toBeInTheDocument();
    expect(screen.queryByText("Dehors maintenant")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Réserver")).toBeInTheDocument();
    expect(screen.getByLabelText("Intéressé")).toBeInTheDocument();
  });
});
