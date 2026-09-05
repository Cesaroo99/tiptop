import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MoodLikeRail, moodLikeMeters } from "./MoodLikeRail";
import { TestI18nProvider } from "@/lib/test-utils";

describe("moodLikeMeters", () => {
  it("affiche le temps /H /J /M, jamais un nombre de likes", () => {
    expect(
      moodLikeMeters({
        totalSeconds: 12,
        activeCount: 3,
        likedByMe: false,
        label: "12 secondes",
        hourSeconds: 111_000,
        daySeconds: 78_000,
        monthSeconds: 32,
        hourLabel: "111k",
        dayLabel: "78k",
        monthLabel: "32",
      }),
    ).toEqual({ hour: "111k", day: "78k", month: "32" });
  });
});

describe("MoodLikeRail", () => {
  it("pose le like unique et montre les trois fenêtres de temps", () => {
    const onLike = vi.fn();
    render(
      <TestI18nProvider>
        <MoodLikeRail
          liked={false}
          likeTime={{
            totalSeconds: 40,
            activeCount: 1,
            likedByMe: false,
            label: "40 s",
            hourLabel: "1.5k",
            dayLabel: "78k",
            monthLabel: "32",
          }}
          commentsCount={2300}
          onLike={onLike}
          onComments={() => undefined}
          onShare={() => undefined}
          onMore={() => undefined}
        />
      </TestI18nProvider>,
    );
    expect(screen.getByText("1.5k")).toBeInTheDocument();
    expect(screen.getByText("/H")).toBeInTheDocument();
    expect(screen.getByText("78k")).toBeInTheDocument();
    expect(screen.getByText("/J")).toBeInTheDocument();
    expect(screen.getByText("32")).toBeInTheDocument();
    expect(screen.getByText("/M")).toBeInTheDocument();
    expect(screen.getByText("2.3k")).toBeInTheDocument();
    expect(screen.queryByText("1 like")).not.toBeInTheDocument();
    screen.getByRole("button", { name: "Poser mon like" }).click();
    expect(onLike).toHaveBeenCalledOnce();
  });
});
