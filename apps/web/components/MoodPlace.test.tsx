import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MoodPlaceChip } from "./MoodPlace";
import { TestI18nProvider } from "@/lib/test-utils";

describe("MoodPlaceChip", () => {
  it("n’affiche rien sans lieu — le Mood n’impose pas d’adresse", () => {
    const { container } = render(
      <TestI18nProvider>
        <MoodPlaceChip place={{}} onOpen={() => undefined} />
      </TestI18nProvider>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("montre le nom du lieu et ouvre la carte au tap", () => {
    const onOpen = vi.fn();
    render(
      <TestI18nProvider>
        <MoodPlaceChip
          place={{ placeName: "Rooftop Bastos", address: "Rue 1.770, Bastos", latitude: 3.89, longitude: 11.512 }}
          onOpen={onOpen}
        />
      </TestI18nProvider>,
    );
    expect(screen.getByRole("button", { name: "Rooftop Bastos" })).toBeInTheDocument();
    screen.getByRole("button", { name: "Rooftop Bastos" }).click();
    expect(onOpen).toHaveBeenCalledOnce();
  });
});
