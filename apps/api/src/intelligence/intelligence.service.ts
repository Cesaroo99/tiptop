import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  allowRate,
  achievementForProgress,
  applyPreferenceSignal,
  buildExperiencePlan,
  canRunAgent,
  canSocialMatch,
  canUseHistory,
  canUsePersonalizedRecs,
  cityDiscoveryPercent,
  dayKey,
  DEFAULT_AI_CONSENT,
  emptyPreferenceVector,
  eventCategoryGuess,
  EXPERIENCE_CATEGORIES,
  experienceMoodToSignal,
  feedbackToSignal,
  filterScoredRecommendations,
  foldPreferenceSignals,
  INTEL_RATE_LIMITS,
  inferCategoryFromText,
  isExperienceCategory,
  pickAdaptiveMissions,
  publicMatchDistance,
  refineExperiencePlan,
  scoreEventForUser,
  scoreSocialMatch,
  SIGNAL_WEIGHT,
  typicalBudgetFromPrices,
  type AiConsent,
  type ExperienceCategory,
  type OutingIntent,
  type PreferenceSignalKind,
  type PreferenceSnapshot,
  type PreferenceVector,
} from "@tiptop/domain";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { DiscoveryService } from "../discovery/discovery.service";
import { EventsService } from "../events/events.service";
import { SocialInvitesService } from "../social-invites/social-invites.service";
import { createAiProvider, type AiProvider } from "./ai-provider";

const hits = new Map<string, number[]>();

function hit(key: string, max: number, windowMs = 3600_000): boolean {
  const now = Date.now();
  const prev = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (!allowRate(prev.length, max)) return false;
  prev.push(now);
  hits.set(key, prev);
  return true;
}

@Injectable()
export class IntelligenceService {
  private readonly ai: AiProvider;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(DiscoveryService) private readonly discovery: DiscoveryService,
    @Inject(EventsService) private readonly events: EventsService,
    @Inject(SocialInvitesService) private readonly invites: SocialInvitesService,
  ) {
    this.ai = createAiProvider();
  }

  async consent(userId: string) {
    const row = await this.prisma.aiConsent.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    return this.mapConsent(row);
  }

  async updateConsent(userId: string, patch: Partial<AiConsent>) {
    const row = await this.prisma.aiConsent.upsert({
      where: { userId },
      create: { userId, ...patch },
      update: patch,
    });
    return this.mapConsent(row);
  }

  async forgetLearning(userId: string) {
    await this.prisma.$transaction([
      this.prisma.preferenceSignal.deleteMany({ where: { userId } }),
      this.prisma.userPreferenceProfile.deleteMany({ where: { userId } }),
      this.prisma.experienceRecommendation.deleteMany({ where: { userId } }),
      this.prisma.recommendationFeedback.deleteMany({ where: { userId } }),
      this.prisma.agentSuggestion.deleteMany({ where: { userId } }),
    ]);
    return { ok: true };
  }

  async today(userId: string, locale: string) {
    const consent = await this.consent(userId);
    if (!canUsePersonalizedRecs(consent)) {
      return { enabled: false, items: [], intro: null };
    }
    const prefs = await this.preferenceSnapshot(userId, consent);
    const day = dayKey();
    const cached = await this.prisma.experienceRecommendation.findMany({
      where: { userId, dayKey: day },
      orderBy: { score: "desc" },
      take: 3,
    });
    if (cached.length > 0) {
      return { enabled: true, items: await this.hydrateRecs(userId, cached), intro: null };
    }
    const scored = await this.rankPublishedEvents(userId, prefs);
    const top = filterScoredRecommendations(scored, 3);
    const created = await Promise.all(
      top.map((row) =>
        this.prisma.experienceRecommendation.create({
          data: {
            userId,
            eventId: row.event.id,
            reasonKey: row.reasons[0] ?? "habit_category",
            reasonParams: row.reasons,
            score: row.score,
            category: row.category,
            dayKey: day,
          },
        }),
      ),
    );
    const copy = await this.ai.refineCopy(
      locale === "en"
        ? "I picked experiences that match what you seem to want to do today."
        : "J’ai sélectionné des expériences qui correspondent à ce que tu sembles avoir envie de faire aujourd’hui.",
      locale,
    );
    return { enabled: true, items: await this.hydrateRecs(userId, created), intro: copy };
  }

  async feedback(
    userId: string,
    input: { recommendationId?: string; eventId?: string; kind: "LIKE" | "NOT_INTERESTED" | "HIDE_TYPE" | "WHY" },
  ) {
    if (!hit(`fb:${userId}`, INTEL_RATE_LIMITS.signalsPerHour)) {
      throw new BadRequestException({ code: "INTEL_RATE_LIMIT" });
    }
    const rec = input.recommendationId
      ? await this.prisma.experienceRecommendation.findFirst({
          where: { id: input.recommendationId, userId },
        })
      : null;
    const category = rec?.category ?? null;
    await this.prisma.recommendationFeedback.create({
      data: {
        userId,
        recommendationId: rec?.id,
        eventId: input.eventId ?? rec?.eventId,
        kind: input.kind,
        category,
      },
    });
    const signal = feedbackToSignal(input.kind);
    if (signal && isExperienceCategory(category)) {
      await this.recordSignal(userId, { kind: signal, category, eventId: rec?.eventId ?? input.eventId });
      if (input.kind === "HIDE_TYPE") {
        await this.addDisliked(userId, category);
      }
    }
    if (input.kind === "WHY") {
      return { why: rec?.reasonParams ?? [rec?.reasonKey ?? "habit_category"] };
    }
    return { ok: true };
  }

  async recordSignal(
    userId: string,
    input: { kind: PreferenceSignalKind; category?: string | null; eventId?: string | null; entityType?: string; entityId?: string },
  ) {
    if (!hit(`sig:${userId}`, INTEL_RATE_LIMITS.signalsPerHour)) {
      throw new BadRequestException({ code: "INTEL_RATE_LIMIT" });
    }
    const category = isExperienceCategory(input.category) ? input.category : inferCategoryFromText(input.category ?? "");
    await this.prisma.preferenceSignal.create({
      data: {
        userId,
        kind: input.kind,
        weight: SIGNAL_WEIGHT[input.kind],
        category,
        eventId: input.eventId ?? null,
        entityType: input.entityType,
        entityId: input.entityId,
      },
    });
    await this.recomputeProfile(userId);
    return { ok: true };
  }

  async plan(userId: string, rawText: string, surprise = false, locale = "fr") {
    if (!hit(`plan:${userId}`, INTEL_RATE_LIMITS.planPerHour)) {
      throw new BadRequestException({ code: "INTEL_RATE_LIMIT" });
    }
    const consent = await this.consent(userId);
    if (!canUsePersonalizedRecs(consent)) throw new ForbiddenException({ code: "INTEL_DISABLED" });
    const intent = (await this.ai.parseIntent(rawText, locale)) ?? {
      rawText,
      dateHint: null,
      hour: null,
      durationMin: null,
      budgetXaf: null,
      partySize: 2,
      maxKm: null,
      category: null,
      vibe: null,
      surprise,
    };
    intent.surprise = surprise || intent.surprise;
    const request = await this.prisma.experienceRequest.create({
      data: { userId, rawText: rawText.slice(0, 500), parsed: intent as unknown as Prisma.InputJsonValue },
    });
    const prefs = await this.preferenceSnapshot(userId, consent);
    const events = await this.publishedEvents(userId);
    const built = buildExperiencePlan({ intent, events, prefs, surprise: intent.surprise });
    const title = intent.dateHint === "saturday" || intent.dateHint === "weekend" ? "Ton samedi" : "Ta sortie";
    const plan = await this.prisma.experiencePlan.create({
      data: {
        userId,
        requestId: request.id,
        title,
        surprise: intent.surprise,
        totalCostXaf: built.totalCostXaf,
        status: "DRAFT",
        steps: {
          create: built.steps.map((step) => ({
            order: step.order,
            startsAt: new Date(step.startsAt),
            title: step.title,
            category: step.category,
            eventId: step.eventId,
            costXaf: step.costXaf,
            travelMin: step.travelMin,
            revealed: step.revealed,
            bookable: step.bookable,
            hint: step.hint,
          })),
        },
      },
      include: { steps: { orderBy: { order: "asc" } } },
    });
    return this.mapPlan(plan, intent);
  }

  async tweakPlan(userId: string, planId: string, tweak: "cheaper" | "closer" | "calmer" | "social" | "spontaneous" | "replace", step?: number) {
    const plan = await this.prisma.experiencePlan.findFirst({
      where: { id: planId, userId },
      include: { steps: { orderBy: { order: "asc" } } },
    });
    if (!plan) throw new NotFoundException({ code: "PLAN_NOT_FOUND" });
    const consent = await this.consent(userId);
    const prefs = await this.preferenceSnapshot(userId, consent);
    const events = await this.publishedEvents(userId);
    const pool = buildExperiencePlan({
      intent: { rawText: "", dateHint: null, hour: null, durationMin: null, budgetXaf: null, partySize: 2, maxKm: null, category: null, vibe: null, surprise: false },
      events,
      prefs,
    }).steps;
    const current = plan.steps.map((s) => ({
      order: s.order,
      startsAt: s.startsAt.toISOString(),
      title: s.title,
      category: (isExperienceCategory(s.category) ? s.category : "hangout") as ExperienceCategory,
      eventId: s.eventId,
      costXaf: s.costXaf,
      travelMin: s.travelMin,
      bookable: s.bookable,
      hint: s.hint,
      revealed: s.revealed,
    }));
    const next = refineExperiencePlan(current, tweak === "replace" && step ? step : tweak, pool);
    await this.prisma.$transaction([
      this.prisma.experiencePlanStep.deleteMany({ where: { planId } }),
      ...next.map((stepRow) =>
        this.prisma.experiencePlanStep.create({
          data: {
            planId,
            order: stepRow.order,
            startsAt: new Date(stepRow.startsAt),
            title: stepRow.title,
            category: stepRow.category,
            eventId: stepRow.eventId,
            costXaf: stepRow.costXaf,
            travelMin: stepRow.travelMin,
            revealed: true,
            bookable: stepRow.bookable,
            hint: stepRow.hint,
          },
        }),
      ),
      this.prisma.experiencePlan.update({
        where: { id: planId },
        data: { totalCostXaf: next.reduce((sum, s) => sum + s.costXaf, 0) },
      }),
    ]);
    const fresh = await this.prisma.experiencePlan.findUniqueOrThrow({
      where: { id: planId },
      include: { steps: { orderBy: { order: "asc" } } },
    });
    return this.mapPlan(fresh);
  }

  async revealStep(userId: string, planId: string, order: number) {
    const step = await this.prisma.experiencePlanStep.findFirst({
      where: { planId, order, plan: { userId } },
    });
    if (!step) throw new NotFoundException({ code: "STEP_NOT_FOUND" });
    await this.prisma.experiencePlanStep.update({ where: { id: step.id }, data: { revealed: true } });
    const plan = await this.prisma.experiencePlan.findUniqueOrThrow({
      where: { id: planId },
      include: { steps: { orderBy: { order: "asc" } } },
    });
    return this.mapPlan(plan);
  }

  async matches(userId: string, input: { category?: string; eventId?: string }) {
    const consent = await this.consent(userId);
    if (!canSocialMatch(consent)) {
      return { enabled: false, items: [] };
    }
    const category =
      (isExperienceCategory(input.category) ? input.category : null) ??
      (input.eventId
        ? eventCategoryGuess(await this.prisma.event.findUniqueOrThrow({ where: { id: input.eventId } }))
        : "hangout");
    const found = await this.discovery.people(userId, { availableOnly: false });
    const items = found.items
      .map((person) => {
        const interests = person.why?.some((w) => w.key === "shared_interests") ? [category] : [];
        const score = scoreSocialMatch(
          {
            id: person.id,
            interests: interests,
            available: person.presence === "AVAILABLE" || Boolean(person.available),
            distanceKm: person.distanceKm ?? null,
            sameCategory: Boolean(person.activeMood?.activity && inferCategoryFromText(person.activeMood.activity) === category),
            seeking: person.presence === "AVAILABLE",
          },
          category,
        );
        return {
          id: person.id,
          username: person.username,
          firstName: person.firstName,
          lastName: person.lastName,
          avatarUrl: person.avatarUrl,
          category,
          available: person.presence === "AVAILABLE" || Boolean(person.available),
          distanceLabel: publicMatchDistance(person.distanceKm ?? null),
          score,
        };
      })
      .filter((row) => row.score > 0.4)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
    await this.prisma.socialActivityMatch.createMany({
      data: items.map((row) => ({
        userId,
        peerId: row.id,
        category,
        eventId: input.eventId,
        score: row.score,
      })),
    });
    return { enabled: true, category, items };
  }

  async proposeMeetup(
    userId: string,
    input: { title: string; category?: string; startsAt: string; city?: string; zone?: string; peerIds: string[] },
  ) {
    const consent = await this.consent(userId);
    if (!canSocialMatch(consent)) throw new ForbiddenException({ code: "SOCIAL_MATCH_OFF" });
    if (!input.peerIds.length || input.peerIds.length > 8) {
      throw new BadRequestException({ code: "PEERS_INVALID" });
    }
    const category = isExperienceCategory(input.category) ? input.category : inferCategoryFromText(input.title) ?? "hangout";
    const requested = new Date(input.startsAt);
    const startsAt =
      Number.isNaN(requested.getTime()) || requested.getTime() <= Date.now()
        ? new Date(Date.now() + 2 * 3600_000).toISOString()
        : input.startsAt;
    const event = await this.events.create(userId, {
      title: input.title.slice(0, 120),
      description: `Activité TipTop · ${category}`,
      city: input.city,
      zone: input.zone,
      startsAt,
      wanted: true,
      priceXaf: 0,
    });
    const group = await this.prisma.activityGroup.create({
      data: {
        creatorId: userId,
        category,
        title: event.title,
        city: event.city,
        zone: event.zone,
        startsAt: new Date(event.startsAt),
        eventId: event.id,
      },
    });
    for (const peerId of input.peerIds) {
      try {
        await this.invites.create(userId, {
          inviteeId: peerId,
          context: "ACTIVITY",
          label: event.title,
        });
      } catch {
        /* déjà invitée ou quota */
      }
      await this.recordSignal(userId, { kind: "INVITED", category, eventId: event.id, entityType: "user", entityId: peerId }).catch(
        () => undefined,
      );
    }
    return { groupId: group.id, eventId: event.id, title: event.title, startsAt: event.startsAt };
  }

  async agentInbox(userId: string, locale: string) {
    const consent = await this.consent(userId);
    if (!canRunAgent(consent)) return { enabled: false, items: [] };
    const existing = await this.prisma.agentSuggestion.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
    });
    if (existing.length > 0) return { enabled: true, items: existing.map(this.mapSuggestion) };
    const today = await this.today(userId, locale);
    const titles = today.items.map((item) => item.title).filter(Boolean);
    const created = await this.prisma.agentSuggestion.create({
      data: {
        userId,
        kind: "DAILY",
        title: locale === "en" ? "Ideas for later" : "Idées pour plus tard",
        body:
          titles.length > 0
            ? locale === "en"
              ? `I found ${titles.length} experiences that fit your habits.`
              : `J’ai trouvé ${titles.length} expériences qui correspondent à tes habitudes.`
            : locale === "en"
              ? "Tell me what you want to live — I will look around you."
              : "Dis-moi ce que tu as envie de vivre — je cherche autour de toi.",
        eventIds: today.items.map((item) => item.eventId).filter(Boolean) as string[],
        fromAgent: true,
      },
    });
    return { enabled: true, items: [this.mapSuggestion(created)] };
  }

  async agentAsk(userId: string, text: string, locale: string) {
    const consent = await this.consent(userId);
    if (!canRunAgent(consent)) throw new ForbiddenException({ code: "AGENT_OFF" });
    if (!hit(`agent:${userId}`, INTEL_RATE_LIMITS.agentPerHour)) {
      throw new BadRequestException({ code: "INTEL_RATE_LIMIT" });
    }
    const plan = await this.plan(userId, text, false, locale);
    const created = await this.prisma.agentSuggestion.create({
      data: {
        userId,
        kind: /soir|tonight/i.test(text) ? "TONIGHT" : "WEEKEND",
        title: locale === "en" ? "I prepared a plan" : "J’ai préparé un plan",
        body: plan.steps.map((s) => s.title).join(" · ").slice(0, 220),
        planId: plan.id,
        eventIds: plan.steps.map((s) => s.eventId).filter(Boolean) as string[],
        fromAgent: true,
      },
    });
    return { suggestion: this.mapSuggestion(created), plan };
  }

  async world(userId: string) {
    const participations = await this.prisma.eventParticipant.findMany({
      where: { userId, status: { in: ["PRESENT", "CONFIRMED", "RESERVED"] } },
      include: { event: true },
    });
    const attended = participations.filter((p) => p.status === "PRESENT" || p.status === "CONFIRMED");
    const cities = new Map<string, typeof attended>();
    for (const row of attended) {
      const list = cities.get(row.event.city) ?? [];
      list.push(row);
      cities.set(row.event.city, list);
    }
    const cityRows = [];
    const tried = new Set<ExperienceCategory>();
    for (const [city, rows] of cities) {
      const cats = [...new Set(rows.map((r) => eventCategoryGuess(r.event)))];
      cats.forEach((c) => tried.add(c));
      const venues = new Set(rows.map((r) => r.event.venue || r.event.zone || r.event.title));
      const weeks = new Set(rows.map((r) => dayKey(r.event.startsAt).slice(0, 7)));
      const percent = cityDiscoveryPercent({
        categoriesTried: cats.length,
        attendedCount: rows.length,
        uniqueVenues: venues.size,
        activeWeeks: weeks.size,
      });
      await this.prisma.cityDiscoveryProgress.upsert({
        where: { userId_city: { userId, city } },
        create: {
          userId,
          city,
          percent,
          categoriesTried: cats,
          venuesCount: venues.size,
          attendedCount: rows.length,
        },
        update: { percent, categoriesTried: cats, venuesCount: venues.size, attendedCount: rows.length },
      });
      cityRows.push({ city, percent, categoriesTried: cats, venuesCount: venues.size, attendedCount: rows.length });
    }
    const collections = EXPERIENCE_CATEGORIES.map((category) => ({
      category,
      discovered: tried.has(category),
    }));
    for (const item of collections) {
      await this.prisma.categoryDiscoveryProgress.upsert({
        where: { userId_category: { userId, category: item.category } },
        create: { userId, category: item.category, discovered: item.discovered, firstAt: item.discovered ? new Date() : null },
        update: { discovered: item.discovered },
      });
    }
    const weekKey = weekKeyOf();
    const missions = pickAdaptiveMissions({
      triedCategories: [...tried],
      attendedWithOthers: attended.filter((a) => a.event.hostId !== userId).length,
      uniqueVenuesInCity: cityRows[0]?.venuesCount ?? 0,
    });
    const userMissions = [];
    for (const kind of missions) {
      const row = await this.prisma.userMission.upsert({
        where: { userId_kind_weekKey: { userId, kind, weekKey } },
        create: { userId, kind, weekKey },
        update: {},
      });
      userMissions.push(row);
    }
    const badges = achievementForProgress({
      firstTimeCategory: collections.some((c) => c.discovered),
      uniqueVenues: cityRows.reduce((n, c) => n + c.venuesCount, 0),
      socialAttend: attended.some((a) => a.event.hostId !== userId),
    });
    for (const id of badges) {
      await this.prisma.userAchievement.upsert({
        where: { userId_achievementId: { userId, achievementId: id } },
        create: { userId, achievementId: id },
        update: {},
      });
    }
    const achievements = await this.prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    });
    const score = cityRows.length ? Math.round(cityRows.reduce((s, c) => s + c.percent, 0) / cityRows.length) : 0;
    await this.prisma.userWorldProgress.upsert({
      where: { userId },
      create: { userId, score },
      update: { score, lastComputedAt: new Date() },
    });
    return { score, cities: cityRows, collections, missions: userMissions, achievements };
  }

  async experienceFeedback(
    userId: string,
    input: { eventId?: string; planId?: string; mood: "LOVED" | "GOOD" | "OK" | "DISLIKED"; comment?: string; isPublic?: boolean },
  ) {
    const row = await this.prisma.experienceFeedback.create({
      data: {
        userId,
        eventId: input.eventId,
        planId: input.planId,
        mood: input.mood,
        comment: input.comment?.slice(0, 400),
        isPublic: Boolean(input.isPublic),
      },
    });
    let category: ExperienceCategory | null = null;
    if (input.eventId) {
      const event = await this.prisma.event.findUnique({ where: { id: input.eventId } });
      if (event) category = eventCategoryGuess(event);
    }
    if (category) {
      await this.recordSignal(userId, {
        kind: experienceMoodToSignal(input.mood),
        category,
        eventId: input.eventId,
      }).catch(() => undefined);
    }
    return { id: row.id };
  }

  private mapConsent(row: { personalizedRecs: boolean; useHistory: boolean; socialMatch: boolean; agentEnabled: boolean }): AiConsent {
    return {
      personalizedRecs: row.personalizedRecs,
      useHistory: row.useHistory,
      socialMatch: row.socialMatch,
      agentEnabled: row.agentEnabled,
    };
  }

  private async preferenceSnapshot(userId: string, consent: AiConsent): Promise<PreferenceSnapshot> {
    const cached = await this.prisma.userPreferenceProfile.findUnique({ where: { userId } });
    const fresh = !cached || Date.now() - cached.computedAt.getTime() > 60 * 60_000;
    if (fresh) await this.recomputeProfile(userId);
    const row = await this.prisma.userPreferenceProfile.findUnique({ where: { userId } });
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
    const vector = (row?.categoryScores as PreferenceVector | null) ?? emptyPreferenceVector();
    if (!canUseHistory(consent)) {
      return {
        vector: foldPreferenceSignals([], user?.profile?.interests ?? []),
        disliked: [],
        typicalBudgetXaf: null,
        maxBudgetXaf: null,
        maxDistanceKm: null,
        preferredHours: null,
      };
    }
    return {
      vector,
      disliked: (row?.dislikedCategories ?? []).filter(isExperienceCategory),
      typicalBudgetXaf: row?.typicalBudgetXaf ?? null,
      maxBudgetXaf: row?.maxBudgetXaf ?? null,
      maxDistanceKm: row?.maxDistanceKm ?? null,
      preferredHours: (row?.preferredHours as { start: number; end: number } | null) ?? null,
    };
  }

  private async recomputeProfile(userId: string) {
    const [signals, user, hearts, parts, reviews] = await Promise.all([
      this.prisma.preferenceSignal.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 200 }),
      this.prisma.user.findUnique({ where: { id: userId }, include: { profile: true } }),
      this.prisma.eventHeart.findMany({ where: { userId, releasedAt: null }, include: { event: true } }),
      this.prisma.eventParticipant.findMany({
        where: { userId, status: { in: ["INTERESTED", "RESERVED", "CONFIRMED", "PRESENT", "CANCELLED"] } },
        include: { event: true },
      }),
      this.prisma.eventReview.findMany({ where: { authorId: userId }, include: { event: true } }),
    ]);
    const derived: Array<{ kind: PreferenceSignalKind; category: ExperienceCategory }> = [];
    for (const h of hearts) {
      const cat = eventCategoryGuess(h.event);
      derived.push({ kind: "FAVORITED", category: cat });
    }
    for (const p of parts) {
      const cat = eventCategoryGuess(p.event);
      if (p.status === "PRESENT" || p.status === "CONFIRMED") derived.push({ kind: "ATTENDED", category: cat });
      else if (p.status === "RESERVED") derived.push({ kind: "BOOKED", category: cat });
      else if (p.status === "INTERESTED") derived.push({ kind: "SAVED", category: cat });
      else if (p.status === "CANCELLED") derived.push({ kind: "CANCELLED", category: cat });
    }
    for (const r of reviews) {
      const cat = eventCategoryGuess(r.event);
      derived.push({ kind: (r.rating ?? 0) >= 4 ? "POSITIVE_FEEDBACK" : "NOT_INTERESTED", category: cat });
    }
    const explicit = signals
      .filter((s) => isExperienceCategory(s.category))
      .map((s) => ({ kind: s.kind as PreferenceSignalKind, category: s.category as ExperienceCategory }));
    const vector = foldPreferenceSignals([...derived, ...explicit], user?.profile?.interests ?? []);
    const prices = [...hearts, ...parts].map((row) => row.event.priceXaf);
    const hours = parts
      .filter((p) => p.status === "PRESENT" || p.status === "CONFIRMED")
      .map((p) => p.event.startsAt.getHours());
    const preferredHours =
      hours.length >= 2
        ? { start: Math.min(...hours), end: Math.max(...hours) }
        : { start: 18, end: 22 };
    await this.prisma.userPreferenceProfile.upsert({
      where: { userId },
      create: {
        userId,
        categoryScores: vector as unknown as Prisma.InputJsonValue,
        typicalBudgetXaf: typicalBudgetFromPrices(prices),
        maxBudgetXaf: typicalBudgetFromPrices(prices) ? typicalBudgetFromPrices(prices)! * 2 : null,
        preferredHours,
      },
      update: {
        categoryScores: vector as unknown as Prisma.InputJsonValue,
        typicalBudgetXaf: typicalBudgetFromPrices(prices),
        maxBudgetXaf: typicalBudgetFromPrices(prices) ? typicalBudgetFromPrices(prices)! * 2 : null,
        preferredHours,
        computedAt: new Date(),
      },
    });
  }

  private async addDisliked(userId: string, category: ExperienceCategory) {
    const row = await this.prisma.userPreferenceProfile.findUnique({ where: { userId } });
    const disliked = new Set(row?.dislikedCategories ?? []);
    disliked.add(category);
    await this.prisma.userPreferenceProfile.upsert({
      where: { userId },
      create: {
        userId,
        categoryScores: applyPreferenceSignal(emptyPreferenceVector(), "NOT_INTERESTED", category) as unknown as Prisma.InputJsonValue,
        dislikedCategories: [...disliked],
      },
      update: { dislikedCategories: [...disliked] },
    });
  }

  private async publishedEvents(userId: string) {
    const hidden = await this.prisma.userBlock.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    });
    const hiddenIds = new Set(hidden.flatMap((b) => [b.blockerId, b.blockedId]));
    hiddenIds.delete(userId);
    const events = await this.prisma.event.findMany({
      where: {
        status: "PUBLISHED",
        wanted: false,
        startsAt: { gt: new Date() },
        hostId: { notIn: [...hiddenIds] },
      },
      include: { _count: { select: { participants: true, hearts: true } } },
      take: 40,
      orderBy: { startsAt: "asc" },
    });
    return events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      city: event.city,
      zone: event.zone,
      startsAt: event.startsAt,
      priceXaf: event.priceXaf,
      latitude: event.latitude,
      longitude: event.longitude,
      interestedCount: event._count.participants,
      reservedCount: event._count.hearts,
    }));
  }

  private async rankPublishedEvents(userId: string, prefs: PreferenceSnapshot) {
    const events = await this.publishedEvents(userId);
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
    const origin =
      user?.profile?.latitude != null && user.profile.longitude != null
        ? { latitude: user.profile.latitude, longitude: user.profile.longitude }
        : null;
    return events.map((event) => ({ event, ...scoreEventForUser(event, prefs, origin) }));
  }

  private async hydrateRecs(
    _userId: string,
    recs: Array<{ id: string; eventId: string | null; reasonKey: string; reasonParams: Prisma.JsonValue; score: number; category: string | null }>,
  ) {
    const ids = recs.map((r) => r.eventId).filter(Boolean) as string[];
    const events = ids.length
      ? await this.prisma.event.findMany({
          where: { id: { in: ids } },
          include: { host: { include: { profile: true } }, _count: { select: { participants: true } } },
        })
      : [];
    const map = new Map(events.map((e) => [e.id, e]));
    return recs
      .map((rec) => {
        const event = rec.eventId ? map.get(rec.eventId) : null;
        if (!event) return null;
        return {
          id: rec.id,
          eventId: event.id,
          title: event.title,
          startsAt: event.startsAt.toISOString(),
          city: event.city,
          zone: event.zone,
          priceXaf: event.priceXaf,
          currency: event.currency,
          interestedCount: event._count.participants,
          score: rec.score,
          category: rec.category,
          reasonKey: rec.reasonKey,
          reasons: Array.isArray(rec.reasonParams) ? rec.reasonParams : [rec.reasonKey],
        };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row));
  }

  private mapPlan(
    plan: {
      id: string;
      title: string;
      surprise: boolean;
      totalCostXaf: number;
      status: string;
      steps: Array<{
        order: number;
        startsAt: Date;
        title: string;
        category: string;
        eventId: string | null;
        costXaf: number;
        travelMin: number;
        revealed: boolean;
        bookable: boolean;
        hint: boolean;
      }>;
    },
    intent?: OutingIntent,
  ) {
    return {
      id: plan.id,
      title: plan.title,
      surprise: plan.surprise,
      totalCostXaf: plan.totalCostXaf,
      status: plan.status,
      intent: intent ?? null,
      steps: plan.steps.map((step) => ({
        order: step.order,
        startsAt: step.startsAt.toISOString(),
        title: step.revealed ? step.title : "Étape surprise",
        category: step.category,
        eventId: step.revealed ? step.eventId : null,
        costXaf: step.costXaf,
        travelMin: step.travelMin,
        revealed: step.revealed,
        bookable: step.bookable,
        hint: step.hint,
        legalVisible: true,
      })),
    };
  }

  private mapSuggestion(row: {
    id: string;
    kind: string;
    title: string;
    body: string;
    eventIds: string[];
    planId: string | null;
    fromAgent: boolean;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      kind: row.kind,
      title: row.title,
      body: row.body,
      eventIds: row.eventIds,
      planId: row.planId,
      fromAgent: row.fromAgent,
      createdAt: row.createdAt.toISOString(),
    };
  }
}

function weekKeyOf(date = new Date()): string {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
