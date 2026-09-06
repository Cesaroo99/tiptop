import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AvailabilityBadge } from "./AvailabilityBadge";
import { TestI18nProvider } from "@/lib/test-utils";

describe("AvailabilityBadge (#16, #22)", () => {
  it("affiche « Disponible » avec une pastille verte", () => {
    const { container } = render(
      <TestI18nProvider>
        <AvailabilityBadge presence="AVAILABLE" />
      </TestI18nProvider>,
    );
    expect(screen.getByText("Disponible")).toBeInTheDocument();
    expect(container.querySelector(".bg-success")).toBeTruthy();
  });

  it("affiche « Je ne sais pas » en orange", () => {
    const { container } = render(
      <TestI18nProvider>
        <AvailabilityBadge presence="BUSY" />
      </TestI18nProvider>,
    );
    expect(screen.getByText("Je ne sais pas")).toBeInTheDocument();
    expect(container.querySelector(".bg-warning")).toBeTruthy();
    expect(container.querySelector(".animate-ping")).toBeNull();
  });

  it("affiche « Indisponible » en rouge, sans animation", () => {
    const { container } = render(
      <TestI18nProvider>
        <AvailabilityBadge presence="HIDDEN" />
      </TestI18nProvider>,
    );
    expect(screen.getByText("Indisponible")).toBeInTheDocument();
    expect(container.querySelector(".bg-danger")).toBeTruthy();
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
