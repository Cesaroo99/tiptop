import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TestI18nProvider } from "@/lib/test-utils";
import { BookEventSheet } from "./BookEventSheet";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

vi.mock("@/lib/session", () => ({
  useSession: () => ({
    user: { id: "viewer", profileCompleted: true, currency: "CAD", country: "CA" },
    loading: false,
  }),
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
          currency: "XAF",
          minAge: 18,
          startsAt: "2026-10-12T18:00:00.000Z",
          isHost: false,
          canBook: true,
          host: { id: "host-1", firstName: "Alex", lastName: "Moullion", avatarUrl: null, certified: true },
        };
      }
      if (String(path).startsWith("/invite-pool")) {
        return {
          friends: [{ id: "u-boris", firstName: "Boris", lastName: "Nama", username: "boris", avatarUrl: null }],
          nearby: [{ id: "u-amina", firstName: "Amina", lastName: "Bell", username: "amina.bell", avatarUrl: null }],
          later: [{ id: "u-sarah", firstName: "Sarah", lastName: "Nkodo", username: "sarah.nkodo", avatarUrl: null }],
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
  it("ouvre la feuille avec prix en CAD et les cercles d’invités", async () => {
    render(
      <TestI18nProvider>
        <BookEventSheet open preview={preview} onClose={() => undefined} />
      </TestI18nProvider>,
    );
    expect(await screen.findByRole("dialog", { name: "Réserver l'évènement" })).toBeInTheDocument();
    expect(await screen.findByText("11,49 $ CA")).toBeInTheDocument();
    expect(screen.getByText("Pour moi même")).toBeInTheDocument();
    expect(screen.getByText("Inviter des amis")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Amis/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Autour/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Plus tard/ })).toBeInTheDocument();
    expect(await screen.findByText("Boris Nama")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Passer au paiement" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Liste" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cartes" })).toBeInTheDocument();
  });

  it("fait défiler les profils en cartes et propose d’attendre l’acceptation", async () => {
    render(
      <TestI18nProvider>
        <BookEventSheet open preview={preview} onClose={() => undefined} />
      </TestI18nProvider>,
    );
    await screen.findByText("Boris Nama");
    fireEvent.click(screen.getByRole("button", { name: "Cartes" }));
    expect(await screen.findByRole("button", { name: "Choisir pour cette place" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Choisir pour cette place" }));
    expect(await screen.findByText("Ils acceptent, puis je paie")).toBeInTheDocument();
    expect(screen.getByText("Chacun paie sa place")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Ils acceptent, puis je paie"));
    expect(screen.getByRole("button", { name: "Inviter et attendre" })).toBeInTheDocument();
  });

  it("parcourt Autour et Plus tard, puis calcule le total en CAD", async () => {
    render(
      <TestI18nProvider>
        <BookEventSheet open preview={preview} onClose={() => undefined} />
      </TestI18nProvider>,
    );
    await screen.findByText("Boris Nama");
    fireEvent.click(screen.getByRole("button", { name: /Autour/ }));
    expect(await screen.findByText("Amina Bell")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Plus tard/ }));
    expect(await screen.findByText("Sarah Nkodo")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Amis/ }));
    fireEvent.click(screen.getByText("Boris Nama"));
    expect(await screen.findByText(/Total · 22,99 \$ CA/)).toBeInTheDocument();
  });
});
