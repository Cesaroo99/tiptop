import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestI18nProvider } from "@/lib/test-utils";
import { LikePlacementScope } from "@/lib/like-placement";
import { LikePlacementDock } from "./LikePlacementDock";

vi.mock("@/lib/session", () => ({
  useSession: () => ({
    user: { id: "viewer", profileCompleted: true },
    loading: false,
  }),
}));

describe("LikePlacementDock", () => {
  it("n’affiche rien si le like n’est posé nulle part", () => {
    const { container } = render(
      <TestI18nProvider>
        <LikePlacementScope value={{ placement: null, loadedAt: Date.now(), refresh: async () => undefined }}>
          <LikePlacementDock />
        </LikePlacementScope>
      </TestI18nProvider>,
    );
    expect(container.querySelector("[data-like-dock]")).toBeNull();
  });

  it("reste visible hors de la carte, avec durée et cible", () => {
    render(
      <TestI18nProvider>
        <LikePlacementScope
          value={{
            placement: {
              targetType: "post",
              targetId: "p1",
              label: "Expo photo Hilton",
              href: "/events/evt-1",
              startedAt: new Date().toISOString(),
              seconds: 15,
            },
            loadedAt: Date.now(),
            refresh: async () => undefined,
          }}
        >
          <LikePlacementDock />
        </LikePlacementScope>
      </TestI18nProvider>,
    );
    const dock = screen.getByLabelText(/Expo photo Hilton/);
    expect(dock).toHaveAttribute("href", "/events/evt-1");
    expect(dock).toHaveAttribute("data-like-dock", "active");
    expect(dock.textContent).toMatch(/15 s/);
    expect(dock.textContent).toMatch(/Expo photo Hilton/);
  });
});
