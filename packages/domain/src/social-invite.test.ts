import { describe, expect, it } from "vitest";
import {
  assertSocialInviteTarget,
  canRespondSocialInvite,
  canSendSocialInvite,
  socialInviteCtaLabel,
  socialInviteExpiresAt,
  SOCIAL_INVITE_DAILY_LIMIT,
} from "./social-invite";

describe("invitation sociale", () => {
  it("CTA contextuel FR/EN", () => {
    expect(socialInviteCtaLabel("MEETUP", "fr")).toBe("Inviter à me rejoindre");
    expect(socialInviteCtaLabel("ACTIVITY", "fr")).toBe("Proposer cette activité");
    expect(socialInviteCtaLabel("WISH", "fr")).toBe("Je t’invite");
    expect(socialInviteCtaLabel("RESTAURANT", "en")).toBe("Invite to a restaurant");
  });

  it("interdit de s’inviter soi-même", () => {
    expect(assertSocialInviteTarget("a", "a")).toBe("INVITE_SELF");
    expect(assertSocialInviteTarget("a", "b")).toBe("OK");
  });

  it("expire après 72 h par défaut", () => {
    const from = new Date("2026-09-02T10:00:00Z");
    expect(socialInviteExpiresAt(from).toISOString()).toBe("2026-09-05T10:00:00.000Z");
  });

  it("seul le destinataire peut répondre, une seule fois, avant expiration", () => {
    const base = {
      status: "SENT" as const,
      expiresAt: new Date("2026-09-05T10:00:00Z"),
      inviteeId: "b",
    };
    expect(canRespondSocialInvite({ ...base, actorId: "a", now: new Date("2026-09-02T00:00:00Z") })).toBe(
      "NOT_INVITEE",
    );
    expect(canRespondSocialInvite({ ...base, actorId: "b", now: new Date("2026-09-02T00:00:00Z") })).toBe("OK");
    expect(
      canRespondSocialInvite({ ...base, status: "ACCEPTED", actorId: "b", now: new Date("2026-09-02T00:00:00Z") }),
    ).toBe("NOT_PENDING");
    expect(canRespondSocialInvite({ ...base, actorId: "b", now: new Date("2026-09-06T00:00:00Z") })).toBe("EXPIRED");
  });

  it("anti-spam : pas de doublon en attente, limite quotidienne", () => {
    expect(canSendSocialInvite({ sentTodayCount: 0, hasPendingToSameInvitee: true })).toBe("ALREADY_PENDING");
    expect(canSendSocialInvite({ sentTodayCount: SOCIAL_INVITE_DAILY_LIMIT, hasPendingToSameInvitee: false })).toBe(
      "RATE_LIMITED",
    );
    expect(canSendSocialInvite({ sentTodayCount: 1, hasPendingToSameInvitee: false })).toBe("OK");
  });
});
