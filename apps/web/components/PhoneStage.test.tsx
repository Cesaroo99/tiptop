import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PhoneStage } from "./PhoneStage";

describe("PhoneStage", () => {
  it("enferme l’app dans un cadre téléphone unique", () => {
    render(
      <PhoneStage>
        <p>contenu</p>
      </PhoneStage>,
    );
    expect(document.querySelector("[data-phone-device]")).toBeTruthy();
    expect(document.querySelector(".phone-frame")).toBeTruthy();
    expect(document.querySelector(".phone-screen")).toBeTruthy();
    expect(screen.getByText("contenu")).toBeInTheDocument();
  });
});
