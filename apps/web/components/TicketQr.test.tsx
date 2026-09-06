import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { TicketQr } from "./TicketQr";

vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn(async (value: string) => `data:image/png;base64,${Buffer.from(value).toString("base64")}`),
  },
}));

describe("TicketQr", () => {
  it("génère une image QR scannable à partir du token", async () => {
    render(<TicketQr value="tt1.ticket1.2000000000.abcdef0123456789" />);
    const img = await waitFor(() => screen.getByAltText("QR"));
    expect(img).toHaveAttribute("src", expect.stringMatching(/^data:image\/png;base64,/));
  });
});
