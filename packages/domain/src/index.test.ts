import { describe, expect, it } from "vitest";
import { maskPhone, parsePhone } from "../src/phone";
import { canResendOtp, evaluateOtp } from "../src/otp";
import { availableBalance, displayLikeRatio, likeProduction, pickUnitForLike, pickUnitForTarget, planHeartTransfer, planTransfer } from "../src/likes";
import { getLikePack, likeCreditAllowed, LIKE_PACKS, needsLikePurchase } from "../src/wallet";
import { availabilityUntil, isCurrentlyAvailable, presenceState } from "../src/availability";
import {
  displayLocation,
  formatApproxDistance,
  mapsDirectionsUrl,
  moodHasPlace,
  moodPlaceLabel,
  nearestZone,
  roundDistanceKm,
  validateMoodCoords,
} from "../src/location";
import {
  canAdministerGroup,
  canCreateEventGroup,
  canLeaveGroup,
  canRespondToGroupInvite,
  groupNameOk,
} from "../src/event-groups";
import {
  ageCategoryFromMinAge,
  ageCategoryLabel,
  canAcceptInvitation,
  canInteractWithEvent,
  canSendEventInvite,
  eventLifecycle,
  EVENT_INVITE_DAILY_LIMIT,
  evaluateInvite,
  filterHostPeople,
  hostPeopleCounts,
  hostPersonBucket,
  isEventParticipationPublic,
  remainingSeats,
  seatedGuestCount,
  dedupeSeriesOccurrences,
  occurrenceCount,
  shiftOccurrence,
  moodExpiresAt,
  isMoodActive,
} from "../src/events";
import { interestFromActivity, isMoodInterest, parseMoodInterests, statusExpiresAt, STATUS_HOURS } from "../src/moods";
import { canConsumeTicket, canShowQr, isInEntryWindow, signTicketQr, verifyTicketQr } from "../src/tickets";
import { cityCoords, osmEmbedUrl, WORLD_CITIES } from "../src/world-cities";
import { ANALYTICS_EVENTS, isAnalyticsEvent } from "../src/analytics";
import {
  applyWebhook,
  chargeBreakdown,
  mockCharge,
  normalizePlatformFeePercent,
  reservationAmountXaf,
  TIPTOP_PLATFORM_FEE_PERCENT,
  webhookRequestAllowed,
} from "../src/payments";
import {
  canOpenNewDirectConversation,
  canSendMessage,
  canStartDirect,
  directKey,
  NEW_DIRECT_CONVERSATION_DAILY_LIMIT,
  pairIsBlocked,
  shouldNotifyOffline,
} from "../src/chat";
import {
  assertNotSelf,
  canAccessAdmin,
  canChangePlatformFee,
  canRefundPayments,
  canSubmitReport,
  isValidReportReason,
  likeAnomalyFlags,
  refundAllowed,
  REPORT_DAILY_LIMIT,
} from "../src/admin";
import { assertReviewBody, canLeaveReview, reviewOpensAt, eventEndedAt } from "../src/reviews";

describe("parsePhone", () => {
  it("accepte un numéro camerounais national", () => {
    expect(parsePhone("695214785")).toEqual({
      ok: true,
      e164: "+237695214785",
      country: "CM",
      national: "695214785",
    });
  });

  it("accepte un E.164 +237", () => {
    expect(parsePhone("+237 695 21 47 85").ok).toBe(true);
  });

  it("rejette un numéro trop court", () => {
    expect(parsePhone("123")).toEqual({ ok: false, error: "invalid" });
  });
});

describe("maskPhone", () => {
  it("masque le milieu", () => {
    expect(maskPhone("+237695214785")).toMatch(/\*\*\*/);
  });
});

describe("OTP", () => {
  const hash = "abc";
  const future = new Date(Date.now() + 60_000);

  it("valide un code correct", () => {
    expect(
      evaluateOtp({
        expectedHash: hash,
        providedHash: hash,
        expiresAt: future,
        consumedAt: null,
        attempts: 0,
      }),
    ).toBe("valid");
  });

  it("expire", () => {
    expect(
      evaluateOtp({
        expectedHash: hash,
        providedHash: hash,
        expiresAt: new Date(Date.now() - 1),
        consumedAt: null,
        attempts: 0,
      }),
    ).toBe("expired");
  });

  it("refuse après trop de tentatives", () => {
    expect(
      evaluateOtp({
        expectedHash: hash,
        providedHash: "no",
        expiresAt: future,
        consumedAt: null,
        attempts: 5,
      }),
    ).toBe("locked");
  });

  it("respecte le cooldown de renvoi", () => {
    expect(canResendOtp({ lastSentAt: new Date(), cooldownSeconds: 30 })).toBe(false);
    expect(
      canResendOtp({
        lastSentAt: new Date(Date.now() - 31_000),
        cooldownSeconds: 30,
      }),
    ).toBe(true);
  });
});

describe("likes", () => {
  it("transfère une unité d'Alice vers Sarah", () => {
    const plan = planTransfer(
      {
        id: "u1",
        ownerId: "cesar",
        source: "free",
        activeAllocationUserId: "alice",
      },
      "sarah",
      "cesar",
    );
    expect(plan.fromBeneficiaryId).toBe("alice");
    expect(plan.toBeneficiaryId).toBe("sarah");
  });

  it("interdit le like de soi-même", () => {
    expect(() =>
      planTransfer(
        { id: "u1", ownerId: "cesar", source: "free", activeAllocationUserId: null },
        "cesar",
        "cesar",
      ),
    ).toThrow("LIKE_SELF");
  });

  it("compte le solde disponible", () => {
    expect(
      availableBalance([
        { id: "1", ownerId: "c", source: "free", activeAllocationUserId: "a" },
        { id: "2", ownerId: "c", source: "purchased", activeAllocationUserId: null },
      ]),
    ).toBe(1);
  });

  it("transfère le coup de cœur", () => {
    const plan = planHeartTransfer({ userId: "c", eventId: "e1" }, "c", "e2");
    expect(plan.fromEventId).toBe("e1");
    expect(plan.toEventId).toBe("e2");
  });

  it("un like déjà posé se déplace — on n’en pose pas un second en parallèle", () => {
    const plan = pickUnitForLike(
      [
        { id: "busy", ownerId: "c", source: "free", activeAllocationUserId: "alice" },
        { id: "bought", ownerId: "c", source: "purchased", activeAllocationUserId: null },
      ],
      "sarah",
      "c",
    );
    expect(plan.unitId).toBe("busy");
    expect(plan.fromBeneficiaryId).toBe("alice");
  });

  it("un like sur une publication quitte la précédente", () => {
    const plan = pickUnitForTarget(
      [
        { id: "busy", ownerId: "c", activeTargetKey: "post:p1" },
        { id: "spare", ownerId: "c", activeTargetKey: null },
      ],
      "post:p2",
      "c",
    );
    expect(plan.unitId).toBe("busy");
    expect(plan.fromTargetKey).toBe("post:p1");
    expect(plan.toTargetKey).toBe("post:p2");
  });

  it("transfère si plus d'unité libre", () => {
    const plan = pickUnitForLike(
      [{ id: "only", ownerId: "c", source: "free", activeAllocationUserId: "alice" }],
      "sarah",
      "c",
    );
    expect(plan.fromBeneficiaryId).toBe("alice");
  });

  it("affiche /seconde au-delà du seuil influenceur", () => {
    const ratio = displayLikeRatio(120, 50);
    expect(ratio.unit).toBe("second");
    expect(ratio.value).toBeCloseTo(120 / 3600);
    const prod = likeProduction({ active: 8, perHour: 120, perDay: 200, perMonth: 400 });
    expect(prod.ratio.unit).toBe("second");
    expect(prod.active).toBe(8);
  });

  it("expose les packs 1 / 5 / 20", () => {
    expect(LIKE_PACKS.map((p) => p.units)).toEqual([1, 5, 20]);
    expect(getLikePack("p5").amountXaf).toBe(2000);
    expect(() => getLikePack("p99")).toThrow("LIKE_PACK_INVALID");
  });

  it("n’accorde des likes que si le paiement a réussi", () => {
    expect(likeCreditAllowed("FAILED", false).ok).toBe(false);
    expect(likeCreditAllowed("SUCCEEDED", true).ok).toBe(false);
    expect(likeCreditAllowed("SUCCEEDED", false)).toEqual({ ok: true });
    expect(needsLikePurchase(0)).toBe(true);
    expect(needsLikePurchase(2)).toBe(false);
  });
});

describe("disponibilité", () => {
  it("expire après le TTL", () => {
    const from = new Date("2026-08-31T10:00:00Z");
    const until = availabilityUntil(from, 4);
    expect(until.toISOString()).toBe("2026-08-31T14:00:00.000Z");
    expect(
      isCurrentlyAvailable({
        availability: "AVAILABLE",
        availabilityUntil: until,
        now: new Date("2026-08-31T13:59:00Z"),
      }),
    ).toBe(true);
    expect(
      isCurrentlyAvailable({
        availability: "AVAILABLE",
        availabilityUntil: until,
        now: new Date("2026-08-31T14:01:00Z"),
      }),
    ).toBe(false);
  });

  it("ignore un statut busy même avec TTL", () => {
    expect(
      isCurrentlyAvailable({
        availability: "BUSY",
        availabilityUntil: new Date(Date.now() + 3600_000),
      }),
    ).toBe(false);
  });

  it("mappe les 3 voyants (dispo / je ne sais pas / indisponible)", () => {
    const until = new Date(Date.now() + 3600_000);
    expect(presenceState({ availability: "AVAILABLE", availabilityUntil: until })).toBe("AVAILABLE");
    expect(presenceState({ availability: "BUSY", availabilityUntil: until })).toBe("UNSURE");
    expect(presenceState({ availability: "HIDDEN", availabilityUntil: null })).toBe("UNAVAILABLE");
    expect(
      presenceState({
        availability: "AVAILABLE",
        availabilityUntil: new Date(Date.now() - 1000),
      }),
    ).toBe("UNAVAILABLE");
  });
});

describe("catégories d'âge (#16)", () => {
  it("associe le seuil le plus proche sans dépasser", () => {
    expect(ageCategoryFromMinAge(null)).toBe("ALL");
    expect(ageCategoryFromMinAge(0)).toBe("ALL");
    expect(ageCategoryFromMinAge(13)).toBe("U13");
    expect(ageCategoryFromMinAge(15)).toBe("U13");
    expect(ageCategoryFromMinAge(16)).toBe("U16");
    expect(ageCategoryFromMinAge(18)).toBe("U18");
    expect(ageCategoryFromMinAge(21)).toBe("U21");
    expect(ageCategoryFromMinAge(25)).toBe("U21");
  });

  it("n’affiche pas de badge pour « tout âge »", () => {
    expect(ageCategoryLabel(null)).toBeNull();
    expect(ageCategoryLabel(0)).toBeNull();
    expect(ageCategoryLabel(13)).toBe("-13");
    expect(ageCategoryLabel(18)).toBe("-18");
    expect(ageCategoryLabel(21)).toBe("21+");
  });
});

describe("cycle de vie événement", () => {
  it("compte à rebours avant, bientôt dans la dernière demi-heure, en cours pendant, terminé après", () => {
    const starts = new Date("2026-09-02T18:00:00Z");
    expect(eventLifecycle(starts, null, new Date("2026-09-02T17:00:00Z")).phase).toBe("upcoming");
    expect(eventLifecycle(starts, null, new Date("2026-09-02T17:45:00Z")).phase).toBe("startingSoon");
    expect(eventLifecycle(starts, null, new Date("2026-09-02T18:30:00Z")).phase).toBe("ongoing");
    expect(eventLifecycle(starts, null, new Date("2026-09-02T22:00:00Z")).phase).toBe("ended");
  });

  it("respecte endsAt explicite", () => {
    const starts = new Date("2026-09-02T18:00:00Z");
    const ends = new Date("2026-09-02T19:00:00Z");
    expect(eventLifecycle(starts, ends, new Date("2026-09-02T19:30:00Z")).phase).toBe("ended");
  });

  it("un événement annulé prime sur toute autre phase (#8, #14)", () => {
    const starts = new Date("2026-09-02T18:00:00Z");
    expect(eventLifecycle(starts, null, new Date("2026-09-02T10:00:00Z"), "CANCELLED").phase).toBe("cancelled");
    expect(eventLifecycle(starts, null, new Date("2026-09-02T20:00:00Z"), "CANCELLED").phase).toBe("cancelled");
  });

  it("seules les phases annulé/terminé bloquent l’interaction", () => {
    expect(canInteractWithEvent("upcoming")).toBe(true);
    expect(canInteractWithEvent("startingSoon")).toBe(true);
    expect(canInteractWithEvent("ongoing")).toBe(true);
    expect(canInteractWithEvent("ended")).toBe(false);
    expect(canInteractWithEvent("cancelled")).toBe(false);
  });
});

describe("visibilité des personnes liées", () => {
  it("l’hôte est toujours public", () => {
    expect(
      isEventParticipationPublic({ userId: "h", status: "HOST", showOnProfile: false, viewerId: "x" }),
    ).toBe(true);
  });

  it("un participant masqué n’apparaît que pour lui-même", () => {
    expect(
      isEventParticipationPublic({ userId: "a", status: "INTERESTED", showOnProfile: false, viewerId: "b" }),
    ).toBe(false);
    expect(
      isEventParticipationPublic({ userId: "a", status: "INTERESTED", showOnProfile: false, viewerId: "a" }),
    ).toBe(true);
  });

  it("un participant qui a accepté est visible de tous", () => {
    expect(
      isEventParticipationPublic({ userId: "a", status: "RESERVED", showOnProfile: true, viewerId: "b" }),
    ).toBe(true);
  });

  it("une participation annulée n’apparaît jamais", () => {
    expect(
      isEventParticipationPublic({ userId: "a", status: "CANCELLED", showOnProfile: true, viewerId: "a" }),
    ).toBe(false);
  });
});

describe("onglets organisateur", () => {
  it("classe intéressé / réservé / validé", () => {
    expect(hostPersonBucket({ status: "INTERESTED" })).toBe("interested");
    expect(hostPersonBucket({ status: "RESERVED", ticketStatus: "AWAITING_PAYMENT" })).toBe("reserved");
    expect(hostPersonBucket({ status: "CONFIRMED", ticketStatus: "CONFIRMED" })).toBe("reserved");
    expect(hostPersonBucket({ status: "PRESENT", ticketStatus: "CONSUMED" })).toBe("validated");
    expect(hostPersonBucket({ status: "RESERVED", ticketStatus: "CONSUMED" })).toBe("validated");
  });

  it("filtre et compte sans doublon", () => {
    const people = [
      { status: "INTERESTED" },
      { status: "RESERVED", ticketStatus: "CONFIRMED" },
      { status: "PRESENT", ticketStatus: "CONSUMED" },
    ];
    expect(hostPeopleCounts(people)).toEqual({ all: 3, interested: 1, reserved: 1, validated: 1 });
    expect(filterHostPeople(people, "interested")).toHaveLength(1);
  });
});

describe("localisation", () => {
  it("n’arrondit jamais au mètre", () => {
    expect(roundDistanceKm(0.14)).toBe(1);
    expect(roundDistanceKm(13.6)).toBe(14);
  });

  it("affiche une distance approximative en seaux (500 m / km)", () => {
    expect(formatApproxDistance(0.48)).toBe("500 m");
    expect(formatApproxDistance(2.2)).toBe("2 km");
  });

  it("masque la position au niveau HIDDEN", () => {
    expect(displayLocation({ precision: "HIDDEN", city: "Yaoundé", zone: "Bastos" }).label).toBeNull();
  });

  it("grise la carte hors EXACT", () => {
    expect(displayLocation({ precision: "ZONE", city: "Yaoundé", zone: "Bastos" }).mapGrayed).toBe(true);
    expect(displayLocation({ precision: "EXACT", city: "Yaoundé", zone: "Bastos" }).mapGrayed).toBe(false);
  });

  it("le lieu d’un Mood est optionnel et le libellé privilégie le nom", () => {
    expect(moodHasPlace({})).toBe(false);
    expect(moodPlaceLabel({})).toBeNull();
    expect(moodHasPlace({ placeName: "Rooftop Bastos" })).toBe(true);
    expect(moodPlaceLabel({ placeName: "Rooftop Bastos", address: "Rue 1.770, Bastos" })).toBe("Rooftop Bastos");
    expect(moodPlaceLabel({ address: "Rue 1.770, Bastos, Yaoundé" })).toBe("Rue 1.770");
    expect(moodPlaceLabel({ city: "Yaoundé", zone: "Bastos" })).toBe("Bastos · Yaoundé");
  });

  it("rejette des coordonnées incomplètes ou hors bornes", () => {
    expect(validateMoodCoords(undefined, undefined)).toBeNull();
    expect(() => validateMoodCoords(3.89, undefined)).toThrow("MOOD_COORDS_INCOMPLETE");
    expect(() => validateMoodCoords(91, 11)).toThrow("MOOD_COORDS_INVALID");
    expect(validateMoodCoords(3.89, 11.512)).toEqual({ latitude: 3.89, longitude: 11.512 });
  });

  it("construit un itinéraire carte et reconnaît la zone la plus proche", () => {
    expect(mapsDirectionsUrl({ latitude: 3.89, longitude: 11.512 })).toContain("3.89,11.512");
    expect(mapsDirectionsUrl({ address: "Bastos, Yaoundé" })).toContain(encodeURIComponent("Bastos, Yaoundé"));
    expect(nearestZone(3.889, 11.511)?.zone).toBe("Bastos");
  });
});

describe("invitations & moods", () => {
  const base = {
    inviterId: "cesar",
    inviteeId: "erica",
    startsAt: new Date(Date.now() + 86400_000),
    status: "PUBLISHED",
    capacity: 10,
    taken: 2,
    minAge: 18,
    inviteeBirthDate: new Date("1996-07-22"),
    alreadyParticipating: false,
    priceXaf: 0,
    payer: "FREE" as const,
  };

  it("interdit de s’inviter soi-même", () => {
    expect(evaluateInvite({ ...base, inviteeId: "cesar" })).toBe("INVITE_SELF");
  });

  it("autorise l’hôte payeur (checkout ensuite)", () => {
    expect(evaluateInvite({ ...base, priceXaf: 2500, payer: "HOST" })).toBe("OK");
  });

  it("refuse un event complet", () => {
    expect(evaluateInvite({ ...base, capacity: 2, taken: 2 })).toBe("EVENT_FULL");
  });

  it("compte les places restantes sans l’organisateur", () => {
    expect(seatedGuestCount([{ status: "HOST" }, { status: "RESERVED" }, { status: "INTERESTED" }])).toBe(1);
    expect(remainingSeats(40, 5)).toBe(35);
    expect(remainingSeats(40, 40)).toBe(0);
    expect(remainingSeats(null, 3)).toBeNull();
  });

  it("matérielise une série hebdomadaire et ne garde que la prochaine date", () => {
    expect(occurrenceCount("WEEKLY")).toBe(8);
    const start = new Date("2026-09-10T18:00:00.000Z");
    expect(shiftOccurrence(start, "WEEKLY", 1).toISOString()).toBe("2026-09-17T18:00:00.000Z");
    const now = new Date("2026-09-12T00:00:00.000Z");
    const kept = dedupeSeriesOccurrences(
      [
        { id: "a", startsAt: start, recurrence: "WEEKLY" },
        { id: "b", startsAt: shiftOccurrence(start, "WEEKLY", 1), seriesId: "a", recurrence: "WEEKLY" },
        { id: "c", startsAt: new Date("2026-09-11T20:00:00.000Z") },
      ],
      now,
    );
    expect(kept.map((e) => e.id)).toEqual(["c", "b"]);
  });

  it("refuse une invitation expirée", () => {
    expect(
      canAcceptInvitation({
        status: "PENDING",
        expiresAt: new Date(Date.now() - 1000),
        inviteeId: "erica",
        actorId: "erica",
      }),
    ).toBe("INVITE_EXPIRED");
  });

  it("limite un mood à 24 h", () => {
    expect(() => moodExpiresAt(new Date(), 48)).toThrow("MOOD_DURATION_INVALID");
    expect(moodExpiresAt(new Date("2026-08-31T00:00:00Z"), 12).toISOString()).toBe(
      "2026-08-31T12:00:00.000Z",
    );
  });

  it("un mood sans expiration reste actif", () => {
    expect(isMoodActive(null)).toBe(true);
    expect(isMoodActive(undefined)).toBe(true);
    expect(isMoodActive(new Date(Date.now() - 1000))).toBe(false);
  });

  it("un statut expire après 24 h", () => {
    const from = new Date("2026-09-06T00:00:00Z");
    expect(STATUS_HOURS).toBe(24);
    expect(statusExpiresAt(from).toISOString()).toBe("2026-09-07T00:00:00.000Z");
  });

  it("reconnaît un centre d’intérêt depuis l’activité", () => {
    expect(interestFromActivity("🎵 Concert")).toBe("concert");
    expect(interestFromActivity("🍣 Restaurant japonais")).toBe("food");
    expect(isMoodInterest("rooftop")).toBe(true);
    expect(parseMoodInterests(["food", "nope", "food"])).toEqual(["food"]);
  });

  it("anti-spam (#56) : limite le nombre d’invitations événement par jour", () => {
    expect(canSendEventInvite(EVENT_INVITE_DAILY_LIMIT - 1)).toBe("OK");
    expect(canSendEventInvite(EVENT_INVITE_DAILY_LIMIT)).toBe("RATE_LIMITED");
  });
});

describe("tickets & paiement", () => {
  it("signe et vérifie un QR HMAC", () => {
    const token = signTicketQr("t1", 2_000_000_000, "abcdef0123456789ffff");
    const ok = verifyTicketQr({ token, expectedSig: "abcdef0123456789ffff", nowSeconds: 1_700_000_000 });
    expect(ok).toEqual({ ok: true, ticketId: "t1" });
  });

  it("refuse un HMAC invalide ou expiré", () => {
    const token = signTicketQr("t1", 100, "abcdef0123456789");
    expect(verifyTicketQr({ token, expectedSig: "deadbeefdeadbeef", nowSeconds: 50 }).ok).toBe(false);
    expect(verifyTicketQr({ token, expectedSig: "abcdef0123456789", nowSeconds: 101 })).toEqual({
      ok: false,
      reason: "EXPIRED",
    });
  });

  it("n’autorise la conso que si confirmed et jamais consommé", () => {
    expect(canConsumeTicket("CONFIRMED", null)).toBe("OK");
    expect(canConsumeTicket("CONFIRMED", new Date())).toBe("ALREADY_CONSUMED");
    expect(canConsumeTicket("AWAITING_PAYMENT", null)).toBe("NOT_CONFIRMED");
  });

  it("affiche le QR tant que le billet est confirmé et l’événement pas fini", () => {
    const startsAt = new Date("2026-08-31T18:00:00Z");
    const endsAt = new Date("2026-08-31T22:00:00Z");
    expect(isInEntryWindow({ startsAt, endsAt, now: new Date("2026-08-31T16:00:00Z") })).toBe(true);
    expect(isInEntryWindow({ startsAt, endsAt, now: new Date("2026-08-31T15:00:00Z") })).toBe(false);
    expect(canShowQr({ status: "CONFIRMED", startsAt, endsAt, now: new Date("2026-08-31T10:00:00Z") })).toBe(true);
    expect(canShowQr({ status: "CONFIRMED", startsAt, endsAt, now: new Date("2026-08-31T23:00:00Z") })).toBe(false);
    expect(canShowQr({ status: "AWAITING_PAYMENT", startsAt, endsAt, now: new Date("2026-08-31T17:00:00Z") })).toBe(false);
  });

  it("couvre des villes réelles et une carte OSM guidable", () => {
    expect(WORLD_CITIES.length).toBeGreaterThanOrEqual(50);
    expect(cityCoords("Paris")).toEqual({ lat: 48.8566, lng: 2.3522 });
    expect(cityCoords("Yaoundé")?.lat).toBeCloseTo(3.848);
    expect(osmEmbedUrl(3.89, 11.512)).toContain("openstreetmap.org/export/embed.html");
    expect(osmEmbedUrl(3.89, 11.512)).toContain("marker=3.89%2C11.512");
  });

  it("calcule le montant et ignore un webhook dupliqué", () => {
    expect(reservationAmountXaf(2500, 2)).toBe(5000);
    expect(mockCharge({ provider: "CARD" }).status).toBe("SUCCEEDED");
    expect(mockCharge({ provider: "MTN_MOMO", fail: true }).status).toBe("FAILED");
    expect(applyWebhook("SUCCEEDED", "FAILED")).toEqual({ applied: false, status: "SUCCEEDED" });
    expect(applyWebhook("PENDING", "SUCCEEDED")).toEqual({ applied: true, status: "SUCCEEDED" });
  });

  it("garde la commission TipTop à 0 % sans l’ajouter au prix acheteur", () => {
    expect(TIPTOP_PLATFORM_FEE_PERCENT).toBe(0);
    expect(normalizePlatformFeePercent(-1)).toBe(0);
    expect(normalizePlatformFeePercent(250)).toBe(0);
    const free = chargeBreakdown({ ticketAmountXaf: 0 });
    expect(free.chargeTotalXaf).toBe(0);
    expect(free.platformFeeXaf).toBe(0);
    const paid = chargeBreakdown({ ticketAmountXaf: 5000 });
    expect(paid.chargeTotalXaf).toBe(5000);
    expect(paid.platformFeePercent).toBe(0);
    expect(paid.organizerNetXaf).toBe(5000);
    const later = chargeBreakdown({ ticketAmountXaf: 5000, platformFeePercent: 10, providerFeeXaf: 100 });
    expect(later.chargeTotalXaf).toBe(5000);
    expect(later.platformFeeXaf).toBe(500);
    expect(later.organizerNetXaf).toBe(4400);
  });

  it("catalogue les événements analytics de lancement", () => {
    expect(isAnalyticsEvent("auth.signup")).toBe(true);
    expect(isAnalyticsEvent("ticket.checkin")).toBe(true);
    expect(isAnalyticsEvent("unknown")).toBe(false);
    expect(ANALYTICS_EVENTS).toContain("mood.view");
    expect(ANALYTICS_EVENTS).toContain("payment.succeed");
  });

  it("refuse un webhook de production sans secret", () => {
    expect(webhookRequestAllowed({ nodeEnv: "production" })).toBe(false);
    expect(webhookRequestAllowed({ nodeEnv: "test" })).toBe(true);
    expect(
      webhookRequestAllowed({
        nodeEnv: "production",
        configuredSecret: "s3cret",
        providedSecret: "s3cret",
      }),
    ).toBe(true);
    expect(
      webhookRequestAllowed({
        nodeEnv: "production",
        configuredSecret: "s3cret",
        providedSecret: "nope",
      }),
    ).toBe(false);
  });
});

describe("chat", () => {
  it("interdit un DM avec soi-même et ordonne la clé 1:1", () => {
    expect(canStartDirect("cesar", "cesar")).toBe("CHAT_SELF");
    expect(directKey("b", "a")).toBe("a:b");
    expect(directKey("a", "b")).toBe("a:b");
  });

  it("bloque l’envoi si pas membre, bloqué, ou texte vide", () => {
    expect(canSendMessage({ isMember: false, blocked: false, kind: "TEXT", body: "salut" })).toBe("NOT_MEMBER");
    expect(canSendMessage({ isMember: true, blocked: true, kind: "TEXT", body: "salut" })).toBe("BLOCKED");
    expect(canSendMessage({ isMember: true, blocked: false, kind: "TEXT", body: "  " })).toBe("EMPTY");
    expect(canSendMessage({ isMember: true, blocked: false, kind: "AUDIO" })).toBe("EMPTY");
    expect(canSendMessage({ isMember: true, blocked: false, kind: "AUDIO", audioUrl: "/uploads/chat/a.webm" })).toBe("OK");
    expect(canSendMessage({ isMember: true, blocked: false, kind: "FILE", fileUrl: "/uploads/chat/x.pdf" })).toBe("OK");
    expect(canSendMessage({ isMember: true, blocked: false, kind: "INVITE" })).toBe("EMPTY");
    expect(pairIsBlocked([{ blockerId: "a", blockedId: "b" }], "b", "a")).toBe(true);
  });

  it("n’envoie pas de push si le destinataire lit le fil", () => {
    expect(shouldNotifyOffline({ viewingThread: true, pushEnabled: true })).toBe(false);
    expect(shouldNotifyOffline({ viewingThread: false, pushEnabled: true })).toBe(true);
    expect(shouldNotifyOffline({ viewingThread: false, pushEnabled: false })).toBe(false);
  });

  it("anti-spam (#56) : débit de messages limité, prospection de nouvelles conversations limitée", () => {
    expect(
      canSendMessage({ isMember: true, blocked: false, kind: "TEXT", body: "salut", recentMessageCount: 29 }),
    ).toBe("OK");
    expect(
      canSendMessage({ isMember: true, blocked: false, kind: "TEXT", body: "salut", recentMessageCount: 30 }),
    ).toBe("RATE_LIMITED");
    expect(canOpenNewDirectConversation(NEW_DIRECT_CONVERSATION_DAILY_LIMIT - 1)).toBe("OK");
    expect(canOpenNewDirectConversation(NEW_DIRECT_CONVERSATION_DAILY_LIMIT)).toBe("RATE_LIMITED");
  });
});

describe("admin", () => {
  it("ouvre le back-office aux staff seulement", () => {
    expect(canAccessAdmin("ADMIN")).toBe(true);
    expect(canAccessAdmin("MODERATOR")).toBe(true);
    expect(canAccessAdmin("USER")).toBe(false);
    expect(canRefundPayments("ADMIN")).toBe(true);
    expect(canRefundPayments("MODERATOR")).toBe(false);
    expect(canChangePlatformFee("ADMIN")).toBe(true);
    expect(canChangePlatformFee("MODERATOR")).toBe(false);
  });

  it("interdit de se bloquer soi-même et un remboursement non réussi", () => {
    expect(() => assertNotSelf("a", "a")).toThrow("ADMIN_SELF");
    assertNotSelf("a", "b");
    expect(() => refundAllowed("FAILED")).toThrow("PAYMENT_NOT_REFUNDABLE");
    refundAllowed("SUCCEEDED");
    expect(isValidReportReason("SPAM")).toBe(true);
    expect(isValidReportReason("xyz")).toBe(false);
  });

  it("anti-spam (#56) : limite le nombre de signalements par jour", () => {
    expect(canSubmitReport(REPORT_DAILY_LIMIT - 1)).toBe("OK");
    expect(canSubmitReport(REPORT_DAILY_LIMIT)).toBe("RATE_LIMITED");
  });

  it("signale un pack acheté non utilisé", () => {
    expect(
      likeAnomalyFlags({
        allocationsLastHour: 0,
        totalUnits: 8,
        purchasedUnits: 6,
        allocatedActive: 0,
      }),
    ).toEqual(["UNUSED_PACK"]);
    expect(
      likeAnomalyFlags({
        allocationsLastHour: 8,
        totalUnits: 40,
        purchasedUnits: 0,
        allocatedActive: 1,
      }),
    ).toEqual(["BURST", "HIGH_BALANCE"]);
  });
});

describe("avis post-event", () => {
  const ended = new Date("2026-01-01T20:00:00Z");
  const opens = reviewOpensAt(ended);

  it("ouvre 24 h après la fin", () => {
    expect(opens.getTime() - ended.getTime()).toBe(24 * 3600_000);
    expect(eventEndedAt(new Date("2026-01-01T18:00:00Z"), null).getTime()).toBe(
      new Date("2026-01-01T22:00:00Z").getTime(),
    );
  });

  it("refuse l’hôte, l’absent, le trop tôt et le doublon", () => {
    const base = {
      isHost: false,
      attended: true,
      alreadyReviewed: false,
      eventStatus: "ENDED",
      opensAt: opens,
      now: opens,
    };
    expect(canLeaveReview(base)).toBe("OK");
    expect(canLeaveReview({ ...base, isHost: true })).toBe("HOST");
    expect(canLeaveReview({ ...base, attended: false })).toBe("NOT_ATTENDED");
    expect(canLeaveReview({ ...base, alreadyReviewed: true })).toBe("ALREADY");
    expect(canLeaveReview({ ...base, now: new Date(opens.getTime() - 1) })).toBe("TOO_EARLY");
    expect(canLeaveReview({ ...base, eventStatus: "CANCELLED" })).toBe("EVENT_CANCELLED");
  });

  it("exige un texte", () => {
    expect(() => assertReviewBody("  ")).toThrow("REVIEW_BODY_REQUIRED");
    expect(assertReviewBody("  Super rooftop  ")).toBe("Super rooftop");
  });
});

describe("groupes de participants", () => {
  it("seul l’hôte crée un groupe si l’événement le permet", () => {
    expect(canCreateEventGroup(true, true)).toBe(true);
    expect(canCreateEventGroup(true, false)).toBe(false);
    expect(canCreateEventGroup(false, true)).toBe(false);
  });

  it("on accepte une invitation, on quitte sauf le créateur", () => {
    expect(canRespondToGroupInvite("INVITED")).toBe(true);
    expect(canRespondToGroupInvite("JOINED")).toBe(false);
    expect(canLeaveGroup("JOINED", "MEMBER")).toBe(true);
    expect(canLeaveGroup("JOINED", "ADMIN")).toBe(true);
    expect(canLeaveGroup("JOINED", "HOST")).toBe(false);
    expect(canAdministerGroup("ADMIN", false)).toBe(true);
    expect(canAdministerGroup("MEMBER", false)).toBe(false);
    expect(canAdministerGroup("MEMBER", true)).toBe(true);
    expect(groupNameOk("Table 4")).toBe(true);
    expect(groupNameOk("A")).toBe(false);
  });
});
