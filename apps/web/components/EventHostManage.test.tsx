import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestI18nProvider } from "@/lib/test-utils";
import { EventDetailCard } from "./EventDetailCard";
import { HostPeopleList } from "@/components/HostPeopleList";
import type { EventCard as EventCardType, EventManagePerson } from "@/lib/api";

vi.mock("next/navigation", () => ({
  usePathname: () => "/events/evt_1/manage",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

vi.mock("@/lib/session", () => ({
  useSession: () => ({ user: { id: "host", profileCompleted: true }, loading: false }),
}));

const event: EventCardType = {
  id: "evt_1",
  title: "Piscine party - Odza, Yaoundé",
  description: "Bassin, dj set.",
  imageUrl: null,
  city: "Yaoundé",
  zone: "Odza",
  venue: null,
  startsAt: new Date(Date.now() + 13 * 60_000).toISOString(),
  endsAt: null,
  priceXaf: 35000,
  currency: "XAF",
  capacity: 40,
  taken: 5,
  minAge: null,
  requiresReservation: true,
  status: "PUBLISHED",
  hearts: 0,
  viewerHearted: false,
  viewerInterested: false,
  viewerStatus: "HOST",
  isHost: true,
  canBook: false,
  commentsCount: 12,
  reservedCount: 5,
  interestedCount: 3,
  host: {
    id: "host",
    username: "cesar_memoli",
    firstName: "César",
    lastName: "Memoli",
    certified: true,
    avatarUrl: null,
  },
  createdAt: new Date().toISOString(),
};

const people: EventManagePerson[] = [
  {
    id: "u1",
    username: "onguene.landry",
    firstName: "Onguene",
    lastName: "Landry",
    certified: false,
    avatarUrl: null,
    profession: "Designer UI",
    available: true,
    status: "RESERVED",
    ticketId: "t1",
    ticketStatus: "CONFIRMED",
    paid: true,
    consumedAt: null,
  },
  {
    id: "u2",
    username: "erica.sinclair",
    firstName: "Erica",
    lastName: "Sinclair",
    certified: true,
    avatarUrl: null,
    profession: "Photographer | videographer",
    available: false,
    status: "INTERESTED",
    ticketId: null,
    ticketStatus: null,
    paid: false,
    consumedAt: null,
  },
];

describe("écran organisateur", () => {
  it("montre Valider ticket et le compte à rebours, pas le coup de cœur", () => {
    render(
      <TestI18nProvider>
        <EventDetailCard event={event} variant="host" />
      </TestI18nProvider>,
    );
    expect(screen.getByRole("link", { name: /Valider ticket/i })).toHaveAttribute("href", "/events/evt_1/scan");
    expect(screen.getByText("Événement dans :")).toBeInTheDocument();
    expect(screen.queryByLabelText("Coup de cœur")).not.toBeInTheDocument();
    expect(screen.queryByText(/Partages/)).not.toBeInTheDocument();
  });

  it("affiche profession et badge payé, jamais le statut brut", () => {
    render(
      <TestI18nProvider>
        <HostPeopleList people={people} />
      </TestI18nProvider>,
    );
    expect(screen.getByText("Onguene Landry")).toBeInTheDocument();
    expect(screen.getByText("Designer UI")).toBeInTheDocument();
    expect(screen.getByText("Payé")).toBeInTheDocument();
    expect(screen.getByText("Non payé")).toBeInTheDocument();
    expect(screen.queryByText("RESERVED")).not.toBeInTheDocument();
    expect(screen.queryByText("INTERESTED")).not.toBeInTheDocument();
  });
});
