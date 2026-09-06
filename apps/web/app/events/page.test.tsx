import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestI18nProvider } from "@/lib/test-utils";

vi.mock("next/navigation", () => ({
  usePathname: () => "/events",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), back: vi.fn() }),
}));

vi.mock("@/lib/session", () => ({
  useSession: () => ({
    user: {
      id: "1",
      profileCompleted: true,
      city: "Yaoundé",
      zone: "Bastos",
      firstName: "César",
      lastName: "Memoli",
      username: "cesar",
      availability: "HIDDEN",
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
      if (String(path).includes("/invitations")) return { items: [] };
      return { items: [] };
    }),
  };
});

import Page from "./page";

describe("Écran Events — gestion, pas un fil", () => {
  it("ouvre le hub de gestion : tickets, invitations, mes sorties", async () => {
    render(
      <TestI18nProvider>
        <Page />
      </TestI18nProvider>,
    );
    expect(screen.queryByRole("link", { name: "Tous" })).toBeNull();
    expect(screen.getAllByRole("link", { name: "Recherche" }).some((el) => el.getAttribute("href") === "/search?type=events")).toBe(true);
    expect(screen.getByRole("link", { name: "Les Tickets" })).toHaveAttribute("href", "/tickets");
    expect(screen.getByRole("link", { name: "Mes invitations" })).toHaveAttribute("href", "/tickets?tab=invites");
    expect(await screen.findByText("Tu n'as encore créé ni rejoint aucun événement. Découvre-en dans le fil d'accueil, ou crée le tien.")).toBeInTheDocument();
  });
});
