import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestI18nProvider } from "@/lib/test-utils";

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
});
