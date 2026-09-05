import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestI18nProvider } from "@/lib/test-utils";

const search = { tab: "" };

vi.mock("next/navigation", () => ({
  usePathname: () => "/events",
  useSearchParams: () => ({
    get: (key: string) => (key === "tab" ? search.tab : null),
  }),
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
    api: vi.fn().mockResolvedValue({ items: [] }),
  };
});

import Page from "./page";

describe("Écran Events — Tous / Mes événements", () => {
  it("affiche les onglets de la maquette et le fil Découvrir par défaut", async () => {
    search.tab = "";
    render(
      <TestI18nProvider>
        <Page />
      </TestI18nProvider>,
    );
    expect(screen.getByRole("link", { name: "Tous" })).toHaveAttribute("href", "/events");
    expect(screen.getByRole("link", { name: "Mes événements" })).toHaveAttribute("href", "/events?tab=mine");
    expect(await screen.findByText("Pas de sortie ici")).toBeInTheDocument();
  });
});
