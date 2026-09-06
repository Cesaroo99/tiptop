import { describe, expect, it } from "vitest";
import { notifAction, notifLabel } from "./notif";
import type { NotifItem } from "./api";
import { fr } from "@tiptop/i18n";

const actor = {
  id: "u1",
  firstName: "Erica",
  lastName: "Sinclair",
  username: "erica.sinclair",
  certified: false,
  avatarUrl: null,
};

function n(partial: Partial<NotifItem>): NotifItem {
  return {
    id: "n1",
    type: "FOLLOW",
    entityType: "user",
    entityId: "u2",
    read: false,
    createdAt: new Date().toISOString(),
    actor,
    ...partial,
  };
}

describe("notifAction / notifLabel", () => {
  it("ouvre une invitation événement à consulter, pas un accept aveugle", () => {
    expect(notifAction(n({ type: "INVITE", entityType: "invitation", entityId: "inv-1" }))).toEqual({
      kind: "event-invite",
      id: "inv-1",
    });
    expect(notifLabel(n({ type: "INVITE", entityType: "invitation", entityId: "inv-1" }), fr)).toContain(
      "t’a invité à une sortie",
    );
  });

  it("envoie un like mood vers le flux et parle de temps, pas d’un compteur", () => {
    const like = n({ type: "LIKE", entityType: "mood", entityId: "m1" });
    expect(notifAction(like)).toEqual({ kind: "href", href: "/mood?start=m1" });
    expect(notifLabel(like, fr)).toContain("like sur ton mood");
    expect(notifLabel(like, fr)).not.toMatch(/ont aimé|likes/);
  });

  it("ouvre une invitation sociale à consulter", () => {
    expect(
      notifAction(n({ type: "SOCIAL_INVITE", entityType: "social_invite_sent", entityId: "s1" })),
    ).toEqual({ kind: "social-invite", id: "s1" });
    expect(notifLabel(n({ type: "SOCIAL_INVITE", entityType: "social_invite_sent", entityId: "s1" }), fr)).toContain(
      "t’a proposé une sortie",
    );
  });

  it("envoie un commentaire mood vers la vidéo", () => {
    expect(notifAction(n({ type: "COMMENT", entityType: "mood", entityId: "m9" }))).toEqual({
      kind: "href",
      href: "/mood?start=m9",
    });
  });
});
