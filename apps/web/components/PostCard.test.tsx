import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestI18nProvider } from "@/lib/test-utils";
import { PostCard } from "./PostCard";
import type { FeedItem } from "@/lib/api";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

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

const organic: FeedItem = {
  ...post,
  id: "p-organic",
  body: "Match à Omnisports puis bières. Places limitées, on se parle.",
  event: null,
  commentsCount: 2,
  sharesCount: 0,
  likedByMe: false,
  likeTime: { totalSeconds: 0, activeCount: 0, likedByMe: false, label: "0 s" },
};

describe("PostCard — publication vs événement", () => {
  it("événement : âge, carte, 4 actions et countdown — jamais sur une simple publication", () => {
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
    expect(screen.queryByText(/seconde/)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Commentaires")).toHaveAttribute("href", "/posts/p1");
    expect(screen.getByLabelText("Réserver")).toBeInTheDocument();
    expect(screen.getByLabelText("Intéressé")).toBeInTheDocument();
    expect(screen.getByText("Événement dans :")).toBeInTheDocument();
    expect(screen.getByText("13min")).toBeInTheDocument();
    expect(screen.queryByText("Suivre")).not.toBeInTheDocument();
    expect(document.querySelector("[data-kind=event]")).toBeTruthy();
  });

  it("publication : like + commentaire seulement, pas d’âge ni de timing d’événement", () => {
    render(
      <TestI18nProvider>
        <PostCard post={organic} />
      </TestI18nProvider>,
    );
    expect(screen.getByText("Match à Omnisports puis bières. Places limitées, on se parle.")).toBeInTheDocument();
    expect(screen.getByText("2 Commentaires . 0 Partages")).toBeInTheDocument();
    expect(screen.queryByText("-18")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Réserver")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Intéressé")).not.toBeInTheDocument();
    expect(screen.queryByText("Événement dans :")).not.toBeInTheDocument();
    expect(screen.queryByText("Réservations")).not.toBeInTheDocument();
    expect(screen.queryByText("Intéressés")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Poser mon like")).toBeInTheDocument();
    expect(screen.getByLabelText("Commentaires")).toHaveAttribute("href", "/posts/p-organic");
    expect(document.querySelector("[data-kind=post]")).toBeTruthy();
  });
});
