import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestI18nProvider } from "@/lib/test-utils";
import SplashPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

vi.mock("@/lib/session", () => ({
  useSession: () => ({ user: null, loading: false }),
}));

describe("splash", () => {
  it("anime le globe puis un seul logo avec le nom", () => {
    render(
      <TestI18nProvider>
        <SplashPage />
      </TestI18nProvider>,
    );
    expect(screen.getByTestId("splash-screen")).toBeInTheDocument();
    expect(screen.getByText("TipTop")).toBeInTheDocument();
    expect(screen.queryByText("Sors. Rencontre. Vis.")).not.toBeInTheDocument();
    expect(document.querySelectorAll("img[alt='TipTop']").length).toBe(0);
    expect(document.querySelector(".splash-globe")).toBeTruthy();
    expect(document.querySelector(".splash-orbit-a")).toBeTruthy();
    expect(document.querySelectorAll(".splash-ball-g").length).toBe(3);
  });
});
