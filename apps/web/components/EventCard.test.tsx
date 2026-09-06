import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestI18nProvider } from "@/lib/test-utils";
import { EventCard } from "./EventCard";
import type { EventCard as EventCardType } from "@/lib/api";

vi.mock("next/navigation", () => ({
  usePathname: () => "/events",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

vi.mock("@/lib/session", () => ({
  useSession: () => ({ user: { id: "viewer", profileCompleted: true }, loading: false }),
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
    expect(screen.getAllByText(/35 places restantes/).length).toBe(1);
    expect(screen.getByLabelText("Coup de cœur")).toBeInTheDocument();
    expect(screen.getByLabelText("Commentaires")).toBeInTheDocument();
    expect(screen.getByLabelText("Intéressé")).toBeInTheDocument();
    expect(screen.getByLabelText("Réserver")).toBeInTheDocument();
    expect(screen.queryByText("Réserver")).not.toBeInTheDocument();
    expect(screen.getByText("Événement dans :")).toBeInTheDocument();
  });

  it("garde Intéressé et Réserver ensemble, même déjà réservé", () => {
    render(
      <TestI18nProvider>
        <EventCard event={{ ...baseEvent, canBook: true, viewerReserved: true, viewerTicketId: "t1" }} />
      </TestI18nProvider>,
    );
    expect(screen.getByLabelText("Intéressé")).toBeInTheDocument();
    expect(screen.getByLabelText("Réserver pour un autre")).toBeInTheDocument();
    expect(screen.queryByText("Réserver pour un autre")).not.toBeInTheDocument();
  });

  it("affiche le badge « Terminé » pour un événement passé (#9, #25)", () => {
    const past = { ...baseEvent, startsAt: new Date(Date.now() - 5 * 3600_000).toISOString() };
    render(
      <TestI18nProvider>
        <EventCard event={past} />
      </TestI18nProvider>,
    );
    expect(screen.getAllByText("Terminé").length).toBeGreaterThan(0);
  });

  it("annulé : aucun CTA de réservation/intérêt, message explicite (#8, #14)", () => {
    const cancelled = { ...baseEvent, status: "CANCELLED" };
    render(
      <TestI18nProvider>
        <EventCard event={cancelled} />
      </TestI18nProvider>,
    );
    expect(screen.getAllByText("Annulé").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Intéressé")).toBeDisabled();
    expect(screen.getByLabelText("Réserver")).toBeDisabled();
    expect(screen.getByLabelText("Commentaires")).toBeInTheDocument();
    expect(screen.getByLabelText("Coup de cœur")).toBeDisabled();
    expect(screen.getByText(/a été annulé par l’organisateur/)).toBeInTheDocument();
  });

  it("montre la preuve sociale seulement si le réseau participe", () => {
    render(
      <TestI18nProvider>
        <EventCard event={{ ...baseEvent, friendsGoing: 2, networkGoing: 5 }} />
      </TestI18nProvider>,
    );
    expect(screen.getByText("2 amies participent")).toBeInTheDocument();
    expect(screen.queryByText(/personnes de ton réseau/)).not.toBeInTheDocument();
  });

  it("bientôt : badge « Commence bientôt » dans les 30 dernières minutes (#7-8)", () => {
    const soon = { ...baseEvent, startsAt: new Date(Date.now() + 10 * 60_000).toISOString() };
    render(
      <TestI18nProvider>
        <EventCard event={soon} />
      </TestI18nProvider>,
    );
    expect(screen.getByText("Commence bientôt")).toBeInTheDocument();
  });
});
