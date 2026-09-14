import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AgeBadge } from "./AgeBadge";

describe("AgeBadge", () => {
  it("affiche une pastille discrète, pas un bandeau danger", () => {
    const { container } = render(<AgeBadge minAge={18} />);
    expect(screen.getByText("-18")).toBeInTheDocument();
    expect(container.querySelector(".bg-danger")).toBeNull();
    expect(container.querySelector(".bg-ink\\/80")).toBeTruthy();
  });

  it("ne rend rien sans limite d’âge", () => {
    const { container } = render(<AgeBadge minAge={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
