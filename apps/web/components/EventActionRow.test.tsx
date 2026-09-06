import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestI18nProvider } from "@/lib/test-utils";
import { EventActionRow } from "./EventActionRow";

describe("EventActionRow", () => {
  it("affiche les 4 actions dans l’ordre et le compte à rebours, sans texte Réserver", () => {
    render(
      <TestI18nProvider>
        <EventActionRow
          likeLabel="Coup de cœur"
          commentLabel="Commentaires"
          reserveLabel="Réserver"
          interestedLabel="Intéressé"
          startsAt={new Date(Date.now() + 13 * 60_000).toISOString()}
          onLike={vi.fn()}
          onReserve={vi.fn()}
          onInterested={vi.fn()}
        />
      </TestI18nProvider>,
    );
    const row = screen.getByTestId("event-actions");
    const actions = [...row.querySelectorAll("[data-action]")].map((el) => el.getAttribute("data-action"));
    expect(actions.slice(0, 5)).toEqual(["like", "comment", "reserve", "interested", "countdown"]);
    expect(screen.getByLabelText("Réserver")).toBeInTheDocument();
    expect(screen.queryByText("Réserver")).not.toBeInTheDocument();
    expect(screen.getByText("Événement dans :")).toBeInTheDocument();
    expect(screen.getByText("13min")).toBeInTheDocument();
  });
});
