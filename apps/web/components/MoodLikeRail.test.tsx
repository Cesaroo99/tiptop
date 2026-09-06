import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MoodLikeRail, moodLikeDuration } from "./MoodLikeRail";
import { TestI18nProvider } from "@/lib/test-utils";

describe("moodLikeDuration", () => {
  it("affiche le cumul de temps, jamais /H /J /M ni un nombre de likes", () => {
    expect(
      moodLikeDuration({
        totalSeconds: 3723,
        activeCount: 1,
        likedByMe: false,
        label: "1 h 2 min",
      }),
    ).toBe("1 h 2");
  });
});

describe("MoodLikeRail", () => {
  it("pose le like unique et montre uniquement le temps cumulé", () => {
    const onLike = vi.fn();
    render(
      <TestI18nProvider>
        <MoodLikeRail
          liked={false}
          loadedAt={Date.now()}
          likeTime={{
            totalSeconds: 40,
            activeCount: 0,
            likedByMe: false,
            label: "40 s",
          }}
          commentsCount={2300}
          onLike={onLike}
          onComments={() => undefined}
          onShare={() => undefined}
          onMore={() => undefined}
        />
      </TestI18nProvider>,
    );
    expect(screen.getByText("40 s")).toBeInTheDocument();
    expect(screen.queryByText("/H")).not.toBeInTheDocument();
    expect(screen.queryByText("/J")).not.toBeInTheDocument();
    expect(screen.queryByText("/M")).not.toBeInTheDocument();
    expect(screen.getByText("2.3k")).toBeInTheDocument();
    expect(screen.queryByText("1 like")).not.toBeInTheDocument();
    screen.getByRole("button", { name: "Poser ma vie" }).click();
    expect(onLike).toHaveBeenCalledOnce();
  });
});
