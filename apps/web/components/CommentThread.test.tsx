import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CommentThread } from "./CommentThread";
import { TestI18nProvider } from "@/lib/test-utils";
import type { CommentItem } from "@/lib/api";

const author = {
  id: "u1",
  firstName: "Erica",
  lastName: "Sinclair",
  username: "erica",
  certified: false,
  avatarUrl: "/seed/avatars/erica.jpg",
};

function comment(partial: Partial<CommentItem>): CommentItem {
  return {
    id: "c1",
    body: "Ça donne trop faim",
    createdAt: new Date().toISOString(),
    likedByMe: false,
    likeTime: { totalSeconds: 12, activeCount: 0, likedByMe: false, label: "12 s" },
    author,
    ...partial,
  };
}

describe("CommentThread", () => {
  it("montre la photo, le temps de like et une réponse imbriquée", () => {
    render(
      <TestI18nProvider>
        <CommentThread
          items={[
            comment({ id: "c1" }),
            comment({
              id: "c2",
              parentId: "c1",
              body: "On y va ce soir ?",
              author: { ...author, id: "u2", firstName: "César", lastName: "Memoli", avatarUrl: "/seed/avatars/cesar.jpg" },
            }),
          ]}
          onChange={() => undefined}
          onReply={vi.fn()}
        />
      </TestI18nProvider>,
    );
    expect(screen.getByText(/Ça donne trop faim/)).toBeInTheDocument();
    expect(screen.getByText(/On y va ce soir/)).toBeInTheDocument();
    expect(document.querySelectorAll("img").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("12 s").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("button", { name: "Répondre" }).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("/H")).not.toBeInTheDocument();
  });
});
