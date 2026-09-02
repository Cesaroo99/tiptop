import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar, AVATAR_SIZES } from "./Avatar";

describe("Avatar", () => {
  it("affiche les initiales quand aucune photo n’est fournie", () => {
    render(<Avatar firstName="César" lastName="Memoli" />);
    expect(screen.getByText("CM")).toBeInTheDocument();
  });

  it("affiche la photo quand src est fourni", () => {
    const { container } = render(<Avatar src="/seed/avatars/cesar.jpg" firstName="César" lastName="Memoli" />);
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", "/seed/avatars/cesar.jpg");
  });

  it("résout les tailles nommées vers les presets standard (#20)", () => {
    const { container, rerender } = render(<Avatar firstName="A" lastName="B" size="xl" />);
    expect(container.querySelector("span")).toHaveStyle({ width: `${AVATAR_SIZES.xl}px` });
    rerender(<Avatar firstName="A" lastName="B" size="xs" />);
    expect(container.querySelector("span")).toHaveStyle({ width: `${AVATAR_SIZES.xs}px` });
  });

  it("reste compatible avec une taille numérique existante", () => {
    const { container } = render(<Avatar firstName="A" lastName="B" size={64} />);
    expect(container.querySelector("span")).toHaveStyle({ width: "64px" });
  });

  it("affiche l’indicateur en ligne", () => {
    const { container } = render(<Avatar firstName="A" lastName="B" online />);
    expect(container.querySelector(".bg-success")).toBeTruthy();
  });
});
