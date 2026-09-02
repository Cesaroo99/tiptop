import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AvailabilityBadge } from "./AvailabilityBadge";
import { TestI18nProvider } from "@/lib/test-utils";

describe("AvailabilityBadge (#16, #22)", () => {
  it("affiche « Disponible » avec une pastille active", () => {
    const { container } = render(
      <TestI18nProvider>
        <AvailabilityBadge available />
      </TestI18nProvider>,
    );
    expect(screen.getByText("Disponible")).toBeInTheDocument();
    expect(container.querySelector(".bg-success")).toBeTruthy();
  });

  it("affiche « Masqué » quand indisponible, sans animation de pastille", () => {
    const { container } = render(
      <TestI18nProvider>
        <AvailabilityBadge available={false} />
      </TestI18nProvider>,
    );
    expect(screen.getByText("Masqué")).toBeInTheDocument();
    expect(container.querySelector(".animate-ping")).toBeNull();
  });

  it("reste le même composant en mode compact (cohérence #56)", () => {
    render(
      <TestI18nProvider>
        <AvailabilityBadge available compact />
      </TestI18nProvider>,
    );
    expect(screen.getByText("Disponible")).toBeInTheDocument();
  });
});
