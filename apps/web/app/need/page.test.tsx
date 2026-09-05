import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestI18nProvider } from "@/lib/test-utils";

vi.mock("next/navigation", () => ({
  usePathname: () => "/need",
  useSearchParams: () => ({ get: () => null }),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), back: vi.fn() }),
}));

vi.mock("@/lib/session", () => ({
  useSession: () => ({
    user: { id: "1", profileCompleted: true, city: "Yaoundé", zone: "Bastos" },
    loading: false,
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    api: vi.fn().mockResolvedValue({
      items: [
        {
          id: "off_1",
          kind: "PRODUCT",
          sellerKind: "SHOP",
          title: "Pain chaud du matin",
          description: "Baguettes",
          shopName: "Boulangerie Fouda",
          priceXaf: 250,
          currency: "XAF",
          city: "Yaoundé",
          zone: "Odza",
          placeName: "Boulangerie Fouda",
          address: "Odza",
          latitude: 3.8,
          longitude: 11.54,
          placeLabel: "Boulangerie Fouda",
          directionsUrl: "https://maps.example",
          imageUrl: null,
          status: "ACTIVE",
          isMine: false,
          distanceKm: 2,
          distanceLabel: "2 km",
          seller: {
            id: "u2",
            username: "jp.fouda",
            firstName: "Jean-Pierre",
            lastName: "Fouda",
            certified: false,
            avatarUrl: null,
            profession: null,
          },
        },
      ],
    }),
  };
});

import Page from "./page";

describe("Autour de moi", () => {
  it("cherche un besoin local avec tri proximité / prix", async () => {
    render(
      <TestI18nProvider>
        <Page />
      </TestI18nProvider>,
    );
    expect(screen.getByPlaceholderText("Tu cherches quoi ?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Les plus proches" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Les moins chers" })).toBeInTheDocument();
    expect(await screen.findByText("Pain chaud du matin")).toBeInTheDocument();
    expect(screen.getByText("250 XAF")).toBeInTheDocument();
  });
});
