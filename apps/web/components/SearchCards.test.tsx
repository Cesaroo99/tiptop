import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestI18nProvider } from "@/lib/test-utils";
import { SearchEventCard, SearchPersonCard } from "./SearchCards";
import type { SearchEvent, SearchPerson } from "@/lib/api";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

vi.mock("@/lib/session", () => ({
  useSession: () => ({
    user: { id: "viewer", profileCompleted: true, currency: "CAD", country: "CA" },
    loading: false,
  }),
}));

const person: SearchPerson = {
  id: "u-erica",
  username: "erica.sinclair",
  firstName: "Erica",
  lastName: "Sinclair",
  certified: false,
  profession: "Téléconseillère",
  city: "Yaoundé",
  avatarUrl: null,
  available: true,
};

const event: SearchEvent = {
  id: "evt-piscine",
  title: "Piscine party - Odza, Yaoundé",
  imageUrl: "/seed/events/piscine.jpg",
  startsAt: new Date("2026-09-09T11:30:00.000Z").toISOString(),
  city: "Yaoundé",
  zone: "Odza",
  priceXaf: 5000,
  currency: "XAF",
  taken: 4,
  viewerHearted: false,
  host: {
    username: "alex.moullion",
    firstName: "Alex",
    lastName: "Moullion",
    avatarUrl: null,
  },
};

describe("Cartes de recherche", () => {
  it("affiche une personne : avatar, nom, profession", () => {
    render(
      <TestI18nProvider>
        <SearchPersonCard person={person} />
      </TestI18nProvider>,
    );
    expect(screen.getByText("Erica Sinclair")).toBeInTheDocument();
    expect(screen.getByText("Téléconseillère")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Erica Sinclair/ })).toHaveAttribute("href", "/u/erica.sinclair");
    expect(screen.getByLabelText("Plus d'options")).toBeInTheDocument();
  });

  it("affiche une sortie : participants réels, hôte, coup de cœur", () => {
    render(
      <TestI18nProvider>
        <SearchEventCard event={event} />
      </TestI18nProvider>,
    );
    expect(screen.getByText("Piscine party - Odza, Yaoundé")).toBeInTheDocument();
    expect(screen.getByText("4 participants")).toBeInTheDocument();
    expect(screen.getByText("Alex Moullion")).toBeInTheDocument();
    expect(screen.getByLabelText("Coup de cœur")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Intéressé" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Réserver" })).toBeInTheDocument();
    expect(screen.getAllByRole("link")[0]).toHaveAttribute("href", "/events/evt-piscine");
  });
});
