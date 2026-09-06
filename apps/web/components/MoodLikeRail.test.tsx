import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MoodLikeRail, moodLikeMeters } from "./MoodLikeRail";
import { TestI18nProvider } from "@/lib/test-utils";

describe("moodLikeMeters", () => {
  it("affiche une durée, jamais un débit ni un nombre de likes", () => {
    expect(
      moodLikeMeters({
        totalSeconds: 3723,
        activeCount: 1,
        likedByMe: false,
        label: "1 h 2 min",
        hourSeconds: 45,
        daySeconds: 1500,
        monthSeconds: 3723,
      }),
    ).toEqual({ total: "1 h 2", hour: "45 s", day: "25 min", month: "1 h 2" });
  });
});

describe("MoodLikeRail", () => {
  it("pose le like unique et montre le temps /H /J /M", () => {
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
            hourSeconds: 40,
            daySeconds: 40,
            monthSeconds: 40,
          }}
          commentsCount={2300}
          onLike={onLike}
          onComments={() => undefined}
          onShare={() => undefined}
          onMore={() => undefined}
        />
      </TestI18nProvider>,
    );
    expect(screen.getAllByText("40 s").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("/H")).toBeInTheDocument();
    expect(screen.getByText("/J")).toBeInTheDocument();
    expect(screen.getByText("/M")).toBeInTheDocument();
    expect(screen.getByText("2.3k")).toBeInTheDocument();
    expect(screen.queryByText("1 like")).not.toBeInTheDocument();
    expect(screen.queryByText("111k")).not.toBeInTheDocument();
    screen.getByRole("button", { name: "Poser mon like" }).click();
    expect(onLike).toHaveBeenCalledOnce();
  });
});
