import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestI18nProvider } from "@/lib/test-utils";
import { InterestedBadge } from "./InterestedBadge";

describe("InterestedBadge", () => {
  it("insigne : toujours « Intéressé » avec le compte", () => {
    render(
      <TestI18nProvider>
        <InterestedBadge variant="stamp" active={false} count={3} />
      </TestI18nProvider>,
    );
    expect(screen.getByText("Intéressé")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("action : bouton toggle avec aria-pressed", () => {
    const onClick = vi.fn();
    render(
      <TestI18nProvider>
        <InterestedBadge active onClick={onClick} count={4} />
      </TestI18nProvider>,
    );
    const btn = screen.getByRole("button", { name: "Plus intéressé" });
    expect(btn).toHaveAttribute("aria-pressed", "true");
    btn.click();
    expect(onClick).toHaveBeenCalled();
  });
});
