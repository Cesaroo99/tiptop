import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TestI18nProvider } from "@/lib/test-utils";

const apiMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/lib/session", () => ({
  useSession: () => ({
    user: {
      id: "1",
      phoneE164: "+237695214785",
      firstName: "César",
      lastName: "Memoli",
      username: "cesar_memoli",
      profession: "Fondateur",
      bio: "On sort vraiment.",
      website: "tiptop.cm",
      avatarUrl: "/seed/avatars/cesar.jpg",
      coverUrl: "/seed/covers/night.jpg",
      birthDate: "1994-05-12",
      country: "CM",
      city: "Yaoundé",
      zone: "Carrefour Damas",
      availability: "AVAILABLE",
    },
    loading: false,
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    api: (...args: unknown[]) => apiMock(...args),
  };
});

import Page from "./page";

describe("Mon compte", () => {
  it("permet de modifier bio, site et photos, et liste les blocages", async () => {
    apiMock.mockImplementation(async (path: string, init?: { method?: string }) => {
      if (String(path) === "/users/me/blocks" && !init?.method) {
        return {
          items: [{ id: "u-erica", username: "erica.sinclair", firstName: "Erica", lastName: "Sinclair", avatarUrl: null }],
        };
      }
      return { ok: true };
    });

    render(
      <TestI18nProvider>
        <Page />
      </TestI18nProvider>,
    );

    expect(screen.getByLabelText("Retour")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mon compte" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("On sort vraiment.")).toBeInTheDocument();
    expect(screen.getByDisplayValue("tiptop.cm")).toBeInTheDocument();
    expect(screen.getByText("Yaoundé · Carrefour Damas")).toBeInTheDocument();
    expect(await screen.findByText("Erica Sinclair")).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue("On sort vraiment."), { target: { value: "Brunch et rooftops." } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer les modifications" }));

    await waitFor(() => {
      const patch = apiMock.mock.calls.find(
        (call) => String(call[0]) === "/users/me" && (call[1] as { method?: string } | undefined)?.method === "PATCH",
      );
      expect(patch).toBeTruthy();
      const body = JSON.parse(String((patch?.[1] as { body?: string }).body));
      expect(body.bio).toBe("Brunch et rooftops.");
      expect(body.website).toBe("tiptop.cm");
      expect(body.avatarUrl).toBe("/seed/avatars/cesar.jpg");
    });
  });
});
