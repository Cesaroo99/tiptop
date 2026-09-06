import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestI18nProvider } from "@/lib/test-utils";
import { LikePlacementScope } from "@/lib/like-placement";

vi.mock("next/navigation", () => ({
  usePathname: () => "/people",
}));

import { BottomNav, SideNav } from "./Nav";

describe("Navigation (#49-50)", () => {
  it("BottomNav marque l’onglet actif correspondant au chemin courant", () => {
    render(
      <TestI18nProvider>
        <BottomNav />
      </TestI18nProvider>,
    );
    const peopleLink = screen.getByRole("link", { name: /Amies/i });
    expect(peopleLink.className).toContain("text-accent");
  });

  it("SideNav affiche tous les items de navigation cohérents avec BottomNav", () => {
    render(
      <TestI18nProvider>
        <SideNav />
      </TestI18nProvider>,
    );
    expect(screen.getAllByRole("link").length).toBeGreaterThanOrEqual(5);
  });

  it("BottomNav reste visible dans le cadre téléphone (pas cachée dès md)", () => {
    const { container } = render(
      <TestI18nProvider>
        <BottomNav />
      </TestI18nProvider>,
    );
    expect(container.querySelector("nav")?.className).not.toContain("md:hidden");
    expect(container.querySelector("nav")?.className).toContain("phone-nav");
  });

  it("accroche le décompte de like au-dessus des onglets, pas dans les cartes", () => {
    render(
      <TestI18nProvider>
        <LikePlacementScope
          value={{
            placement: {
              targetType: "post",
              targetId: "p1",
              label: "César Memoli",
              href: "/events/evt-1",
              startedAt: new Date().toISOString(),
              seconds: 20,
            },
            loadedAt: Date.now(),
            refresh: async () => undefined,
          }}
        >
          <BottomNav />
        </LikePlacementScope>
      </TestI18nProvider>,
    );
    const dock = screen.getByLabelText(/César Memoli/);
    expect(dock.closest("nav")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Amies/i })).toBeInTheDocument();
  });
});
