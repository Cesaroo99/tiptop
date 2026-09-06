import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestI18nProvider } from "@/lib/test-utils";
import { EventDetailCard, EventLinkedPeople } from "./EventDetailCard";
import type { EventCard as EventCardType } from "@/lib/api";

vi.mock("next/navigation", () => ({
  usePathname: () => "/events/evt_1",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

vi.mock("@/lib/session", () => ({
  useSession: () => ({ user: { id: "viewer", profileCompleted: true }, loading: false }),
}));

const baseEvent: EventCardType = {
  id: "evt_1",
  title: "Piscine party - Odza, Yaoundé",
  description: "Bassin, dj set. On se voit vraiment.",
  imageUrl: "/seed/events/piscine.jpg",
  city: "Yaoundé",
  zone: "Odza",
  venue: "Villa Odza",
  startsAt: new Date(Date.now() + 13 * 60_000).toISOString(),
  endsAt: null,
  priceXaf: 35000,
  currency: "XAF",
  capacity: 40,
  taken: 5,
  minAge: 18,
  requiresReservation: true,
  status: "PUBLISHED",
  hearts: 2,
  viewerHearted: false,
  viewerInterested: false,
  viewerStatus: "INTERESTED",
  viewerShowOnProfile: false,
  isHost: false,
  canBook: true,
  viewerTicketId: null,
  canChatGroup: false,
  commentsCount: 3400,
  postId: "post_1",
  host: {
    id: "u-host",
    username: "alex.moullion",
    firstName: "Alex",
    lastName: "Moullion",
    certified: true,
    avatarUrl: null,
  },
  interestedCount: 3,
  reservedCount: 35,
  createdAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
  people: [
    {
      id: "u-host",
      username: "alex.moullion",
      firstName: "Alex",
      lastName: "Moullion",
      certified: true,
      avatarUrl: null,
      status: "HOST",
      profession: "Entrepreneur",
      available: true,
    },
    {
      id: "u-onguene",
      username: "onguene.landry",
      firstName: "Onguene",
      lastName: "Landry",
      certified: false,
      avatarUrl: null,
      status: "RESERVED",
      profession: "Designer UI",
      available: true,
    },
    {
      id: "viewer",
      username: "cesar_memoli",
      firstName: "César",
      lastName: "Memoli",
      certified: true,
      avatarUrl: null,
      status: "INTERESTED",
      profession: "Fondateur TipTop",
      available: false,
    },
  ],
};

describe("EventDetailCard", () => {
  it("affiche le prix, le compte à rebours et les stats réelles sans partages inventés", () => {
    render(
      <TestI18nProvider>
        <EventDetailCard event={baseEvent} />
      </TestI18nProvider>,
    );
    expect(screen.getByText("35.000 FCFA")).toBeInTheDocument();
    expect(screen.getByText("Événement dans :")).toBeInTheDocument();
    expect(screen.getByText("13min")).toBeInTheDocument();
    expect(screen.getByText(/3\.4k Commentaires/)).toBeInTheDocument();
    expect(screen.getByText(/35 Réservations/)).toBeInTheDocument();
    expect(screen.getByText(/3 Intéressés/)).toBeInTheDocument();
    expect(screen.queryByText(/Partages/)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Coup de cœur")).toBeInTheDocument();
    expect(screen.getByLabelText("Commentaires")).toBeInTheDocument();
    expect(screen.getByText("Réserver")).toBeInTheDocument();
  });

  it("n’affiche pas le statut brut HOST / INTERESTED dans la liste liée", () => {
    render(
      <TestI18nProvider>
        <EventLinkedPeople event={baseEvent} onChanged={() => undefined} />
      </TestI18nProvider>,
    );
    expect(screen.getByText("Personnes liées à l’événement (3)")).toBeInTheDocument();
    expect(screen.getByText("Onguene Landry")).toBeInTheDocument();
    expect(screen.getByText("Designer UI")).toBeInTheDocument();
    expect(screen.getByText("Toi seulement")).toBeInTheDocument();
    expect(screen.queryByText("HOST")).not.toBeInTheDocument();
    expect(screen.queryByText("INTERESTED")).not.toBeInTheDocument();
    expect(screen.queryByText("RESERVED")).not.toBeInTheDocument();
    expect(screen.getByText("Afficher ma participation")).toBeInTheDocument();
  });
});
