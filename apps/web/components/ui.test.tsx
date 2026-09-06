import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Chip, IconButton, Modal, PrimaryButton } from "./ui";

describe("PrimaryButton", () => {
  it("affiche son contenu et déclenche le clic", () => {
    const onClick = vi.fn();
    render(<PrimaryButton onClick={onClick}>Réserver</PrimaryButton>);
    fireEvent.click(screen.getByText("Réserver"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("se désactive pendant le chargement (#17-18)", () => {
    render(<PrimaryButton loading>Envoyer</PrimaryButton>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});

describe("Chip", () => {
  it("marque l’état actif visuellement", () => {
    const { rerender } = render(<Chip active={false}>Restaurant</Chip>);
    expect(screen.getByText("Restaurant").className).not.toContain("bg-accent ");
    rerender(<Chip active>Restaurant</Chip>);
    expect(screen.getByText("Restaurant").className).toContain("bg-accent");
  });
});

describe("IconButton", () => {
  it("expose un label accessible (#53)", () => {
    render(
      <IconButton label="Partager">
        <span>icon</span>
      </IconButton>,
    );
    expect(screen.getByRole("button", { name: "Partager" })).toBeInTheDocument();
  });
});

describe("Modal", () => {
  it("ne rend rien quand fermée", () => {
    const { container } = render(
      <Modal open={false} title="Titre" onClose={() => undefined}>
        Contenu
      </Modal>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("affiche le titre et le contenu, ferme au clic sur le fond (#52)", () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Confirmer" onClose={onClose}>
        Es-tu sûr ?
      </Modal>,
    );
    expect(screen.getByText("Confirmer")).toBeInTheDocument();
    expect(screen.getByText("Es-tu sûr ?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalled();
  });

  it("propose Annuler/Confirmer seulement quand onConfirm est fourni", () => {
    const { rerender } = render(
      <Modal open title="T" onClose={() => undefined}>
        C
      </Modal>,
    );
    expect(screen.queryByText("Annuler")).not.toBeInTheDocument();
    rerender(
      <Modal open title="T" onClose={() => undefined} onConfirm={() => undefined} confirmLabel="Continuer">
        C
      </Modal>,
    );
    expect(screen.getByText("Annuler")).toBeInTheDocument();
    expect(screen.getByText("Continuer")).toBeInTheDocument();
  });
});
