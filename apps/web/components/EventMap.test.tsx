import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestI18nProvider } from "@/lib/test-utils";
import { EventMap, resolveEventPoint } from "./EventMap";

describe("EventMap", () => {
  it("résout les coordonnées réelles puis la ville", () => {
    expect(resolveEventPoint({ latitude: 48.8566, longitude: 2.3522 })).toEqual({ lat: 48.8566, lng: 2.3522 });
    expect(resolveEventPoint({ city: "Paris" })).toEqual({ lat: 48.8566, lng: 2.3522 });
  });

  it("affiche une carte OSM et un lien de guidage", () => {
    render(
      <TestI18nProvider>
        <EventMap city="Yaoundé" zone="Bastos" venue="Bastos Live Hall" address="Rue 1.742, Bastos, Yaoundé" latitude={3.89} longitude={11.512} />
      </TestI18nProvider>,
    );
    const frame = screen.getByTitle(/Bastos Live Hall/);
    expect(frame).toHaveAttribute("src", expect.stringContaining("openstreetmap.org/export/embed.html"));
    const link = screen.getByRole("link", { name: "Y aller" });
    expect(link).toHaveAttribute("href", expect.stringContaining("google.com/maps/dir"));
    expect(link).toHaveAttribute("href", expect.stringContaining("3.89,11.512"));
  });
});
