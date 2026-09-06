import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestI18nProvider } from "@/lib/test-utils";
import { SearchEntry } from "./SearchEntry";

describe("SearchEntry", () => {
  it("pointe vers /search par défaut", () => {
    render(
      <TestI18nProvider>
        <SearchEntry />
      </TestI18nProvider>,
    );
    expect(screen.getByRole("link", { name: "Recherche" })).toHaveAttribute("href", "/search");
  });

  it("préremplit l’onglet demandé", () => {
    render(
      <TestI18nProvider>
        <SearchEntry href="/search?type=events" />
      </TestI18nProvider>,
    );
    expect(screen.getByRole("link", { name: "Recherche" })).toHaveAttribute("href", "/search?type=events");
  });
});
