import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestI18nProvider } from "@/lib/test-utils";
import { FeedPersonCard } from "./FeedPersonCard";
import type { PersonCard } from "@/lib/api";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

vi.mock("@/lib/session", () => ({
  useSession: () => ({
    user: { id: "viewer", profileCompleted: true, city: "Yaoundé", zone: "Carrefour Damas" },
    loading: false,
  }),
}));

const person: PersonCard = {
  id: "u-lea",
  username: "lea",
  firstName: "Léa",
  lastName: "Moreau",
  certified: false,
  profession: "DJ",
  age: 24,
  avatarUrl: null,
  locationLabel: "Bastos",
  approximate: true,
  city: "Yaoundé",
  zone: "Bastos",
  distanceKm: 1,
  presence: "AVAILABLE",
  circle: "NEARBY",
};

describe("FeedPersonCard", () => {
  it("montre la distance par rapport à moi, pas seulement le quartier", () => {
    render(
      <TestI18nProvider>
        <FeedPersonCard person={person} />
      </TestI18nProvider>,
    );
    expect(screen.getByText("Léa Moreau")).toBeInTheDocument();
    expect(screen.getByText("DJ")).toBeInTheDocument();
    expect(screen.getByText(/de vous/)).toBeInTheDocument();
  });
});
