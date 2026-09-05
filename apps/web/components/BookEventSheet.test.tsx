import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TestI18nProvider } from "@/lib/test-utils";
import { BookEventSheet } from "./BookEventSheet";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

vi.mock("@/lib/session", () => ({
  useSession: () => ({ user: { id: "viewer", profileCompleted: true }, loading: false }),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    api: vi.fn().mockImplementation(async (path: string) => {
      if (String(path).startsWith("/events/")) {
        return {
          id: "evt-piscine",
          title: "Piscine party - Odza, Yaoundé",
          description: "Bassin, dj set.",
          priceXaf: 5000,
          minAge: 18,
          startsAt: "2026-10-12T18:00:00.000Z",
          isHost: false,
          canBook: true,
          host: { firstName: "Alex", lastName: "Moullion", avatarUrl: null, certified: true },
        };
      }
      if (String(path) === "/contacts") {
        return {
          items: [{ id: "u-boris", firstName: "Boris", lastName: "Nama", username: "boris", avatarUrl: null }],
        };
      }
      return {};
    }),
  };
});

const preview = {
  eventId: "evt-piscine",
  title: "Piscine party - Odza, Yaoundé",
  body: "Piscine party - Odza, Yaoundé : Bassin, dj set, -18.",
  startsAt: "2026-10-12T18:00:00.000Z",
  createdAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
  minAge: 18,
  author: { firstName: "Alex", lastName: "Moullion", certified: true, avatarUrl: null },
};

describe("BookEventSheet", () => {
  it("ouvre la feuille de réservation avec prix, soi-même et amis", async () => {
    render(
      <TestI18nProvider>
        <BookEventSheet open preview={preview} onClose={() => undefined} />
      </TestI18nProvider>,
    );
    expect(await screen.findByRole("dialog", { name: "Réserver l'évènement" })).toBeInTheDocument();
    expect(await screen.findByText("5.000 FCFA")).toBeInTheDocument();
    expect(screen.getByText("Pour moi même")).toBeInTheDocument();
    expect(screen.getByText("Inviter des amis")).toBeInTheDocument();
    expect(await screen.findByText("Boris Nama")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Passer au paiement" })).toBeInTheDocument();
  });

  it("calcule le total si un ami est ajouté", async () => {
    render(
      <TestI18nProvider>
        <BookEventSheet open preview={preview} onClose={() => undefined} />
      </TestI18nProvider>,
    );
    await screen.findByText("Boris Nama");
    fireEvent.click(screen.getByText("Boris Nama"));
    expect(await screen.findByText(/Total · 10.000 FCFA/)).toBeInTheDocument();
  });
});
