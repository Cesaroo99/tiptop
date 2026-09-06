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
  it("anime le logo et affiche le slogan", () => {
    render(
      <TestI18nProvider>
        <SplashPage />
      </TestI18nProvider>,
    );
    expect(screen.getByTestId("splash-screen")).toBeInTheDocument();
    expect(screen.getAllByAltText("TipTop").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Sors. Rencontre. Vis.")).toBeInTheDocument();
    expect(document.querySelector(".splash-logo-mark")).toBeTruthy();
  });
});
