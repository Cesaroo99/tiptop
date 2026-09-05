import { describe, expect, it } from "vitest";
import { matchesInviteQuery, toInvitePerson } from "./invite-pool.service";

describe("invite-pool helpers", () => {
  const amina = {
    id: "u1",
    username: "amina.bell",
    firstName: "Amina",
    lastName: "Bell",
    certified: false,
    avatarUrl: null,
    profession: "DJ",
    city: "Yaoundé",
  };

  it("filtre par prénom, nom ou identifiant", () => {
    expect(matchesInviteQuery(amina)).toBe(true);
    expect(matchesInviteQuery(amina, "ami")).toBe(true);
    expect(matchesInviteQuery(amina, "BELL")).toBe(true);
    expect(matchesInviteQuery(amina, "amina.bell")).toBe(true);
    expect(matchesInviteQuery(amina, "koffi")).toBe(false);
  });

  it("aplatit un user Prisma vers une carte d’invité", () => {
    expect(
      toInvitePerson({
        id: "u1",
        username: "amina.bell",
        firstName: "Amina",
        lastName: "Bell",
        certified: true,
        profile: { avatarUrl: "/a.jpg", profession: "DJ", city: "Yaoundé" },
      }),
    ).toEqual({
      id: "u1",
      username: "amina.bell",
      firstName: "Amina",
      lastName: "Bell",
      certified: true,
      avatarUrl: "/a.jpg",
      profession: "DJ",
      city: "Yaoundé",
    });
  });
});
