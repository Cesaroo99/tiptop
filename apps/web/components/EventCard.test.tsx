import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestI18nProvider } from "@/lib/test-utils";
import { EventCard } from "./EventCard";
import type { EventCard as EventCardType } from "@/lib/api";

vi.mock("next/navigation", () => ({
  usePathname: () => "/events",
}));

const baseEvent: EventCardType = {
  id: "evt_1",
  title: "Afterwork Bastos",
  description: "Rooftop, ambiance chill.",
  imageUrl: null,
  city: "Yaoundé",
  zone: "Bastos",
  venue: "Rooftop 237",
  startsAt: new Date(Date.now() + 3 * 3600_000).toISOString(),
  endsAt: null,
  priceXaf: 0,
  currency: "XAF",
  capacity: 40,
  taken: 5,
  minAge: null,
  requiresReservation: false,
  status: "PUBLISHED",
  hearts: 2,
  viewerHearted: false,
  viewerInterested: false,
  viewerStatus: null,
  isHost: false,
  canBook: false,
  viewerTicketId: null,
  canChatGroup: false,
  host: {
    id: "u1",
    username: "cesar_memoli",
    firstName: "César",
    lastName: "Memoli",
    certified: true,
    avatarUrl: null,
  },
  interestedCount: 3,
  reservedCount: 5,
  createdAt: new Date().toISOString(),
};

describe("EventCard (#23-25)", () => {
  it("affiche titre, lieu, prix et un CTA principal net", () => {
    render(
      <TestI18nProvider>
        <EventCard event={baseEvent} />
      </TestI18nProvider>,
    );
    expect(screen.getByText("Afterwork Bastos")).toBeInTheDocument();
    expect(screen.getAllByText(/Bastos/).length).toBeGreaterThan(0);
    expect(screen.getByText("Gratuit")).toBeInTheDocument();
    // Sans réservation requise : CTA "Intéressé", jamais un faux "Réserver".
    expect(screen.getByText("Intéressé")).toBeInTheDocument();
    expect(screen.queryByText("Réserver")).not.toBeInTheDocument();
  });

  it("affiche le CTA Réserver seulement quand la réservation est possible", () => {
    render(
      <TestI18nProvider>
        <EventCard event={{ ...baseEvent, canBook: true }} />
      </TestI18nProvider>,
    );
    expect(screen.getByText("Réserver")).toBeInTheDocument();
    expect(screen.queryByText("Intéressé")).not.toBeInTheDocument();
  });

  it("affiche le badge « Terminé » pour un événement passé (#9, #25)", () => {
    const past = { ...baseEvent, startsAt: new Date(Date.now() - 5 * 3600_000).toISOString() };
    render(
      <TestI18nProvider>
        <EventCard event={past} />
      </TestI18nProvider>,
    );
    expect(screen.getByText("Terminé")).toBeInTheDocument();
  });
});
