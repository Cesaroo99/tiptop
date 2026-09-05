import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestI18nProvider } from "@/lib/test-utils";
import { PostCard } from "./PostCard";
import type { FeedItem } from "@/lib/api";

vi.mock("@/lib/session", () => ({
  useSession: () => ({
    user: { id: "viewer", profileCompleted: true },
    loading: false,
  }),
}));

const post: FeedItem = {
  id: "p1",
  body: "Un tour au Black&White : on se retrouve ce soir, on sort vraiment. 🥳💎",
  imageUrl: "/seed/events/black-white.jpg",
  city: "Yaoundé",
  zone: "Carrefour Damas",
  createdAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
  commentsCount: 3400,
  sharesCount: 46,
  likedAuthor: false,
  likedByMe: true,
  viewerFollows: false,
  authorActiveLikes: 1,
  likeTime: { totalSeconds: 12, activeCount: 1, likedByMe: true, label: "12 s" },
  author: {
    id: "u-cesar",
    username: "cesar_memoli",
    firstName: "César",
    lastName: "Memoli",
    certified: true,
    avatarUrl: null,
    available: true,
  },
  event: {
    id: "evt-bw",
    title: "Soirée Black & White",
    startsAt: new Date(Date.now() + 13 * 60_000).toISOString(),
    minAge: 18,
    interestedCount: 3,
    reservedCount: 35,
    viewerInterested: false,
  },
};

describe("PostCard — maquette accueil", () => {
  it("affiche header, stats et les 4 actions Like / Commentaire / Réservation / Intéressé", () => {
    render(
      <TestI18nProvider>
        <PostCard post={post} />
      </TestI18nProvider>,
    );
    expect(screen.getByText("César Memoli")).toBeInTheDocument();
    expect(screen.getByText("Il y a 2 heures")).toBeInTheDocument();
    expect(screen.getByText("-18")).toBeInTheDocument();
    expect(screen.getByText("Un tour au Black&White :")).toBeInTheDocument();
    expect(screen.getByText("3.4k Commentaires . 46 Partages . 35 Réservations . 3 Intéressés")).toBeInTheDocument();
    expect(screen.getByLabelText("Mon like est ici")).toBeInTheDocument();
    expect(screen.getByLabelText("Commentaires")).toHaveAttribute("href", "/posts/p1");
    expect(screen.getByLabelText("Réserver")).toHaveAttribute("href", "/events/evt-bw/book");
    expect(screen.getByLabelText("Intéressé")).toBeInTheDocument();
    expect(screen.getByText("Événement dans :")).toBeInTheDocument();
    expect(screen.getByText("13min")).toBeInTheDocument();
    expect(screen.queryByText("Suivre")).not.toBeInTheDocument();
  });
});
