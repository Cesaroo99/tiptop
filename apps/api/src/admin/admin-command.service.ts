import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ADMIN_SETTINGS_CONFIG_KEY,
  AI_LIMITS_CONFIG_KEY,
  AdminAlert,
  FEATURE_FLAGS_CONFIG_KEY,
  MAPS_SETTINGS_CONFIG_KEY,
  PHONE_AUTH_CONFIG_KEY,
  REFUND_RULES_CONFIG_KEY,
  ServiceProbe,
  canChangeRoles,
  canPerformSensitiveAdminAction,
  chargeBreakdown,
  defaultAdminSettings,
  defaultAiLimits,
  defaultPhoneAuthSettings,
  defaultRefundRules,
  hasPermission,
  isOrganizerStatus,
  isProtectedDemoAccount,
  maskPhoneE164,
  maskSecret,
  normalizeWorldMission,
  parseAdminSettings,
  parseAiLimits,
  parseFeatureFlags,
  parsePhoneAuthSettings,
  parseRefundRules,
  refundAllowed,
  serviceStatus,
  type AdminPermission,
  type FeatureFlagKey,
} from "@tiptop/domain";
import type { AdminAction, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { AdminService } from "./admin.service";
import { loadEnv } from "../env";

const person = { id: true, username: true, firstName: true, lastName: true, certified: true } as const;

const sensitiveHits = new Map<string, number[]>();

@Injectable()
export class AdminCommandService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
    @Inject(AdminService) private readonly admin: AdminService,
  ) {}

  assertPerm(role: string, permission: AdminPermission) {
    if (!hasPermission(role, permission)) throw new ForbiddenException({ code: "ADMIN_FORBIDDEN", permission });
  }

  private assertSensitive(actorId: string) {
    const now = Date.now();
    const prev = (sensitiveHits.get(actorId) ?? []).filter((t) => now - t < 3600_000);
    if (canPerformSensitiveAdminAction(prev.length) !== "OK") {
      throw new ForbiddenException({ code: "ADMIN_RATE_LIMITED" });
    }
    prev.push(now);
    sensitiveHits.set(actorId, prev);
  }

  async commandOverview() {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 86400_000);
    const monthAgo = new Date(now.getTime() - 30 * 86400_000);
    const weekAgo = new Date(now.getTime() - 7 * 86400_000);

    const [
      usersTotal,
      usersNew,
      usersBlocked,
      usersDeleted,
      dau,
      mau,
      eventsPublished,
      eventsUpcoming,
      eventsEnded,
      eventsDraft,
      eventsCancelled,
      eventsSuspended,
      eventsReported,
      ticketsConfirmed,
      ticketsRefunded,
      reservations,
      gmv,
      refundedSum,
      failedPayments,
      posts,
      moods,
      comments,
      messages,
      groups,
      openReports,
      recs,
      plans,
      matches,
      agentCalls,
      aiErrors,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.user.count({ where: { status: "BLOCKED" } }),
      this.prisma.user.count({ where: { status: "DELETED" } }),
      this.prisma.device.count({ where: { lastSeenAt: { gte: dayAgo } } }),
      this.prisma.device.count({ where: { lastSeenAt: { gte: monthAgo } } }),
      this.prisma.event.count({ where: { status: "PUBLISHED", suspendedAt: null } }),
      this.prisma.event.count({ where: { status: "PUBLISHED", startsAt: { gt: now }, suspendedAt: null } }),
      this.prisma.event.count({ where: { status: "ENDED" } }),
      this.prisma.event.count({ where: { status: "DRAFT" } }),
      this.prisma.event.count({ where: { status: "CANCELLED" } }),
      this.prisma.event.count({ where: { suspendedAt: { not: null } } }),
      this.prisma.report.count({ where: { kind: "EVENT", status: "OPEN" } }),
      this.prisma.ticket.count({ where: { status: { in: ["CONFIRMED", "CONSUMED"] } } }),
      this.prisma.ticket.count({ where: { status: "REFUNDED" } }),
      this.prisma.reservation.count(),
      this.prisma.payment.aggregate({
        where: { status: { in: ["SUCCEEDED", "PARTIALLY_REFUNDED", "REFUNDED"] }, kind: "RESERVATION" },
        _sum: { amountXaf: true },
      }),
      this.prisma.payment.aggregate({
        where: { refundedAmountXaf: { not: null } },
        _sum: { refundedAmountXaf: true },
      }),
      this.prisma.payment.count({ where: { status: "FAILED" } }),
      this.prisma.post.count({ where: { hiddenAt: null } }),
      this.prisma.mood.count({ where: { hiddenAt: null } }),
      this.prisma.moodComment.count(),
      this.prisma.message.count(),
      this.prisma.eventGroup.count(),
      this.prisma.report.count({ where: { status: "OPEN" } }),
      this.prisma.experienceRecommendation.count(),
      this.prisma.experiencePlan.count(),
      this.prisma.socialActivityMatch.count(),
      this.prisma.agentSuggestion.count(),
      Promise.resolve(0),
    ]);

    const fee = await this.admin.platformFeePercent();
    const gross = gmv._sum.amountXaf ?? 0;
    const refunded = refundedSum._sum.refundedAmountXaf ?? 0;
    const net = Math.max(0, gross - refunded);
    const commission = chargeBreakdown({ ticketAmountXaf: net, platformFeePercent: fee }).platformFeeXaf;
    const toOrganizers = net - commission;

    const byCountry = await this.prisma.profile.groupBy({
      by: ["country"],
      _count: { _all: true },
      where: { user: { createdAt: { gte: monthAgo } } },
    });

    const services = await this.probeServices();
    const alerts = this.buildAlerts({
      services,
      openReports,
      eventsDraft,
      eventsReported,
      failedPayments,
      refunded,
      gross,
    });

    return {
      generatedAt: now.toISOString(),
      users: {
        total: usersTotal,
        new7d: usersNew,
        activeDaily: dau,
        activeMonthly: mau,
        blocked: usersBlocked,
        deleted: usersDeleted,
        byCountry: byCountry.map((r) => ({ country: r.country, count: r._count._all })),
      },
      events: {
        active: eventsPublished,
        upcoming: eventsUpcoming,
        ended: eventsEnded,
        pendingReview: eventsDraft,
        reported: eventsReported,
        cancelled: eventsCancelled,
        suspended: eventsSuspended,
      },
      ticketing: {
        ticketsSold: ticketsConfirmed,
        ticketsRefunded,
        reservations,
        gmvXaf: gross,
        refundedXaf: refunded,
        chargebacksXaf: 0,
        transactions: await this.prisma.payment.count(),
        commissionXaf: commission,
        toOrganizersXaf: toOrganizers,
        provider: "mock",
      },
      social: { posts, moods, comments, messages, groups },
      ai: {
        recommendations: recs,
        plans,
        matches,
        agentSuggestions: agentCalls,
        estimatedErrors: aiErrors,
      },
      alerts,
      services: services.map((s) => ({ id: s.id, status: s.status, label: s.label })),
    };
  }

  async probeServices(): Promise<ServiceProbe[]> {
    const env = loadEnv();
    const probes: ServiceProbe[] = [];

    let dbOk = false;
    let dbError = "";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch (err) {
      dbError = err instanceof Error ? err.message : String(err);
    }
    probes.push({
      id: "postgres",
      label: "PostgreSQL",
      group: "core",
      status: serviceStatus({ inStack: true, configured: true, testedOk: dbOk, error: dbError || undefined }),
      configured: true,
      tested: true,
      message: dbOk ? "Connexion Prisma / Postgres OK." : dbError,
    });

    probes.push({
      id: "sessions",
      label: "Sessions cookie",
      group: "core",
      status: env.SESSION_SECRET && env.SESSION_SECRET !== "dev-only-secret" ? "ok" : "needs_config",
      configured: Boolean(env.SESSION_SECRET),
      tested: true,
      message:
        env.SESSION_SECRET && env.SESSION_SECRET !== "dev-only-secret"
          ? "SESSION_SECRET posé."
          : "SESSION_SECRET trop faible ou valeur de développement.",
      masked: maskSecret(env.SESSION_SECRET),
    });

    probes.push({
      id: "otp",
      label: "OTP téléphone",
      group: "core",
      status: "ok",
      configured: true,
      tested: true,
      message: env.OTP_ALLOW_MOCK
        ? "OTP mock actif (code de démo). Ne jamais afficher le code dans l’admin."
        : "OTP mock désactivé — un fournisseur SMS réel n’est pas branché.",
    });

    probes.push({
      id: "push",
      label: "Notifications push",
      group: "core",
      status: "disabled",
      configured: false,
      tested: true,
      message: "PushService est un no-op. Pas de FCM dans TipTop aujourd’hui. Les notifs in-app existent.",
    });

    for (const id of ["firebase_auth", "firestore", "firebase_storage", "fcm", "app_check"] as const) {
      probes.push({
        id,
        label: labelFirebase(id),
        group: "firebase",
        status: "disabled",
        configured: false,
        tested: true,
        message: "TipTop n’utilise pas Firebase. Auth = OTP + cookie, données = Postgres, fichiers = stockage local / URLs.",
        hint: "Ne pas afficher « Firebase connecté ». Voir docs/admin/FIREBASE_SETUP.md si l’équipe décide de l’ajouter.",
      });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY ?? "";
    probes.push({
      id: "stripe_payments",
      label: "Stripe Payments",
      group: "stripe",
      status: "disabled",
      configured: Boolean(stripeKey),
      tested: true,
      message: stripeKey
        ? "Une clé Stripe est présente dans l’environnement mais TipTop n’appelle pas Stripe. Les paiements restent mock CARD / Orange / MoMo."
        : "Stripe n’est pas dans la stack. Ledger mock uniquement. Aucun argent réel.",
      masked: maskSecret(stripeKey),
      hint: "Voir TIPTOP_PAYMENTS.md et docs/admin/STRIPE_SETUP.md.",
    });
    for (const id of ["stripe_connect", "stripe_webhooks", "stripe_refunds", "stripe_payouts"] as const) {
      probes.push({
        id,
        label: labelStripe(id),
        group: "stripe",
        status: "disabled",
        configured: false,
        tested: true,
        message: "Non implémenté. TipTop contrôle le flux financier via le ledger mock.",
      });
    }

    probes.push({
      id: "tiptop_webhook",
      label: "Webhook paiements TipTop",
      group: "stripe",
      status: env.PAYMENT_WEBHOOK_SECRET ? "ok" : env.NODE_ENV === "production" ? "needs_config" : "needs_config",
      configured: Boolean(env.PAYMENT_WEBHOOK_SECRET),
      tested: true,
      message: env.PAYMENT_WEBHOOK_SECRET
        ? "PAYMENT_WEBHOOK_SECRET posé — POST /payments/webhook exige le header."
        : "Secret webhook mock absent. Obligatoire en production.",
      masked: maskSecret(env.PAYMENT_WEBHOOK_SECRET),
    });

    const googleKey = process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";
    const nominatim = await probeNominatim();
    probes.push({
      id: "nominatim",
      label: "Nominatim (OSM)",
      group: "maps",
      status: nominatim.ok ? "ok" : "error",
      configured: true,
      tested: true,
      message: nominatim.ok
        ? "Geocoding TipTop via Nominatim — test HTTP réussi."
        : `Nominatim injoignable : ${nominatim.error}`,
    });
    for (const id of ["google_maps", "google_places", "google_geocoding", "google_routes"] as const) {
      probes.push({
        id,
        label: labelGoogle(id),
        group: "maps",
        status: "disabled",
        configured: Boolean(googleKey),
        tested: true,
        message: googleKey
          ? "Clé Google présente mais TipTop n’appelle pas les APIs Google Maps."
          : "Google Maps / Places / Routes / Geocoding non utilisés. Carte = Nominatim + zones domaine.",
        masked: maskSecret(googleKey),
      });
    }

    const openai = await probeOpenAi(env.OPENAI_API_KEY);
    probes.push({
      id: "openai",
      label: "OpenAI",
      group: "ai",
      status: openai.status,
      configured: Boolean(env.OPENAI_API_KEY),
      tested: openai.tested,
      message: openai.message,
      masked: maskSecret(env.OPENAI_API_KEY),
      hint: `Modèle configuré : ${env.OPENAI_MODEL}`,
    });

    probes.push({
      id: "firebase_analytics",
      label: "Analytics produit",
      group: "analytics",
      status: "ok",
      configured: true,
      tested: true,
      message: "Catalogue ANALYTICS_EVENTS TipTop (in-app). Pas de Firebase Analytics.",
    });

    return probes;
  }

  private buildAlerts(input: {
    services: ServiceProbe[];
    openReports: number;
    eventsDraft: number;
    eventsReported: number;
    failedPayments: number;
    refunded: number;
    gross: number;
  }): AdminAlert[] {
    const alerts: AdminAlert[] = [];
    const stripe = input.services.find((s) => s.id === "stripe_payments");
    if (stripe) {
      alerts.push({
        id: "stripe-absent",
        level: "INFO",
        title: "Stripe n’est pas le prestataire actuel",
        body: "Les paiements sont un ledger mock (CARD / Orange Money / MoMo). Aucun encaissement réel.",
        href: "/admin/finance",
      });
    }
    const firebase = input.services.find((s) => s.id === "firebase_auth");
    if (firebase?.status === "disabled") {
      alerts.push({
        id: "firebase-absent",
        level: "INFO",
        title: "Firebase n’est pas dans la stack",
        body: "Auth téléphone interne, Firestore absent, FCM absent. Ne pas traiter ça comme une panne.",
        href: "/admin/services",
      });
    }
    const maps = input.services.find((s) => s.id === "nominatim");
    if (maps?.status === "error") {
      alerts.push({
        id: "nominatim-down",
        level: "CRITICAL",
        title: "Nominatim injoignable",
        body: maps.message,
        href: "/admin/maps",
      });
    }
    const openai = input.services.find((s) => s.id === "openai");
    if (openai && !openai.configured) {
      alerts.push({
        id: "openai-missing",
        level: "WARNING",
        title: "OpenAI non configuré",
        body: "Le moteur Intelligence utilise le parseur de règles domaine. Pas d’appels LLM.",
        href: "/admin/ai",
      });
    }
    if (openai?.status === "error") {
      alerts.push({
        id: "openai-error",
        level: "CRITICAL",
        title: "OpenAI en erreur",
        body: openai.message,
        href: "/admin/ai",
      });
    }
    if (input.eventsDraft > 0) {
      alerts.push({
        id: "drafts",
        level: "WARNING",
        title: `${input.eventsDraft} sorties en brouillon`,
        body: "À valider ou publier depuis Events.",
        href: "/admin/events",
      });
    }
    if (input.eventsReported > 0) {
      alerts.push({
        id: "event-reports",
        level: "WARNING",
        title: `${input.eventsReported} sorties signalées`,
        body: "File de modération.",
        href: "/admin/moderation",
      });
    }
    if (input.openReports >= 5) {
      alerts.push({
        id: "reports",
        level: "WARNING",
        title: `${input.openReports} signalements ouverts`,
        body: "La file de modération demande une revue humaine.",
        href: "/admin/moderation",
      });
    }
    if (input.gross > 0 && input.refunded / input.gross > 0.25) {
      alerts.push({
        id: "refund-spike",
        level: "CRITICAL",
        title: "Hausse anormale des remboursements (ledger mock)",
        body: `${input.refunded} XAF remboursés sur ${input.gross} XAF encaissés (mock).`,
        href: "/admin/refunds",
      });
    }
    if (input.failedPayments >= 8) {
      alerts.push({
        id: "pay-fail",
        level: "WARNING",
        title: `${input.failedPayments} paiements mock en échec`,
        body: "Vérifier le provider mock et les tentatives utilisateur.",
        href: "/admin/finance",
      });
    }
    return alerts;
  }

  async search(q: string, role: string) {
    const query = q.trim();
    if (query.length < 2) return { users: [], events: [], tickets: [], payments: [], reports: [] };
    const sensitive = hasPermission(role, "users.sensitive");
    const [users, events, tickets, payments, reports] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: query, mode: "insensitive" } },
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } },
            { id: { equals: query } },
            { phoneE164: { contains: query } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 8,
        select: { id: true, username: true, firstName: true, lastName: true, role: true, status: true, phoneE164: true },
      }),
      this.prisma.event.findMany({
        where: {
          OR: [
            { id: { equals: query } },
            { title: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 8,
        select: { id: true, title: true, status: true, city: true, startsAt: true },
      }),
      this.prisma.ticket.findMany({
        where: { OR: [{ id: { equals: query } }, { reservationId: { equals: query } }] },
        take: 8,
        select: { id: true, status: true, eventId: true, holderId: true, reservationId: true },
      }),
      this.prisma.payment.findMany({
        where: {
          OR: [{ id: { equals: query } }, { idempotencyKey: { contains: query } }, { providerRef: { contains: query } }],
        },
        take: 8,
        select: { id: true, status: true, amountXaf: true, kind: true, provider: true },
      }),
      this.prisma.report.findMany({
        where: { OR: [{ id: { equals: query } }, { body: { contains: query, mode: "insensitive" } }] },
        take: 8,
        select: { id: true, kind: true, reason: true, status: true },
      }),
    ]);
    return {
      users: users.map((u) => ({
        ...u,
        phoneE164: sensitive ? u.phoneE164 : undefined,
        phoneMasked: maskPhoneE164(u.phoneE164),
      })),
      events: events.map((e) => ({ ...e, startsAt: e.startsAt.toISOString() })),
      tickets,
      payments,
      reports,
    };
  }

  async userDetail(actorRole: string, userId: string) {
    const sensitive = hasPermission(actorRole, "users.sensitive");
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        aiConsent: true,
        _count: {
          select: {
            hostedEvents: true,
            reservations: true,
            tickets: true,
            reportsAbout: true,
            reportsMade: true,
            payments: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException({ code: "USER_NOT_FOUND" });
    const lastDevice = await this.prisma.device.findFirst({
      where: { userId },
      orderBy: { lastSeenAt: "desc" },
    });
    const audits = await this.prisma.adminAudit.findMany({
      where: { entityId: userId, entityType: { in: ["user", "User"] } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { actor: { select: person } },
    });
    const payments = await this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      certified: user.certified,
      organizerStatus: user.organizerStatus,
      salesBlocked: user.salesBlocked,
      createdAt: user.createdAt.toISOString(),
      lastSeenAt: lastDevice?.lastSeenAt.toISOString() ?? null,
      phoneMasked: maskPhoneE164(user.phoneE164),
      phoneE164: sensitive ? user.phoneE164 : undefined,
      email: sensitive ? user.email : undefined,
      locale: user.locale,
      country: user.profile?.country ?? null,
      city: user.profile?.city ?? null,
      zone: user.profile?.zone ?? null,
      protected: isProtectedDemoAccount(user),
      counts: user._count,
      aiConsent: user.aiConsent,
      payments: payments.map((p) => ({
        id: p.id,
        status: p.status,
        amountXaf: p.amountXaf,
        kind: p.kind,
        createdAt: p.createdAt.toISOString(),
      })),
      audits: audits.map((a) => ({
        id: a.id,
        action: a.action,
        createdAt: a.createdAt.toISOString(),
        actor: a.actor,
        meta: a.meta,
      })),
    };
  }

  async patchStaffUser(
    actor: { id: string; role: string },
    userId: string,
    input: {
      role?: string;
      status?: "ACTIVE" | "BLOCKED" | "DELETED";
      certified?: boolean;
      organizerStatus?: string;
      salesBlocked?: boolean;
      revokeSessions?: boolean;
    },
  ) {
    this.assertSensitive(actor.id);
    const target = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!target) throw new NotFoundException({ code: "USER_NOT_FOUND" });
    if (isProtectedDemoAccount(target) && (input.status === "BLOCKED" || input.status === "DELETED" || input.role)) {
      throw new ForbiddenException({ code: "PROTECTED_DEMO_ACCOUNT" });
    }
    if (input.role && input.role !== target.role) {
      if (!canChangeRoles(actor.role)) throw new ForbiddenException({ code: "ADMIN_ONLY" });
      if (actor.id === userId) throw new BadRequestException({ code: "ADMIN_SELF" });
      await this.prisma.user.update({ where: { id: userId }, data: { role: input.role as never } });
      await this.audit(actor.id, "USER_ROLE", "user", userId, { previous: target.role, next: input.role });
    }
    if (input.organizerStatus && isOrganizerStatus(input.organizerStatus)) {
      this.assertPerm(actor.role, "organizers.write");
      await this.prisma.user.update({ where: { id: userId }, data: { organizerStatus: input.organizerStatus } });
      await this.audit(actor.id, "ORGANIZER_RESTRICT", "user", userId, { organizerStatus: input.organizerStatus });
    }
    if (typeof input.salesBlocked === "boolean") {
      this.assertPerm(actor.role, "organizers.write");
      await this.prisma.user.update({ where: { id: userId }, data: { salesBlocked: input.salesBlocked } });
      await this.audit(actor.id, "ORGANIZER_RESTRICT", "user", userId, { salesBlocked: input.salesBlocked });
    }
    if (input.revokeSessions) {
      this.assertPerm(actor.role, "users.write");
      await this.prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
      await this.audit(actor.id, "SESSION_REVOKE", "user", userId);
    }
    if (input.status || typeof input.certified === "boolean") {
      return this.admin.patchUser(actor, userId, {
        status: input.status === "DELETED" ? "BLOCKED" : input.status,
        certified: input.certified,
      });
    }
    return this.userDetail(actor.role, userId);
  }

  async organizers() {
    const hosts = await this.prisma.user.findMany({
      where: { hostedEvents: { some: {} } },
      orderBy: { createdAt: "desc" },
      take: 80,
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        certified: true,
        organizerStatus: true,
        salesBlocked: true,
        _count: { select: { hostedEvents: true } },
      },
    });
    const ids = hosts.map((h) => h.id);
    const payments = await this.prisma.payment.groupBy({
      by: ["userId"],
      where: { kind: "RESERVATION", reservation: { event: { hostId: { in: ids } } } },
      _sum: { amountXaf: true, refundedAmountXaf: true },
    });
    const payMap = new Map(payments.map((p) => [p.userId, p]));
    return {
      items: hosts.map((h) => ({
        ...h,
        salesXaf: payMap.get(h.id)?._sum.amountXaf ?? 0,
        refundedXaf: payMap.get(h.id)?._sum.refundedAmountXaf ?? 0,
        trustScore: trustScore(h.certified, h.organizerStatus, h.salesBlocked),
      })),
    };
  }

  async events(filter?: {
    status?: string;
    city?: string;
    host?: string;
    paid?: string;
    q?: string;
  }) {
    const now = new Date();
    const where: Prisma.EventWhereInput = {};
    if (filter?.status === "upcoming") where.AND = [{ status: "PUBLISHED" }, { startsAt: { gt: now } }, { suspendedAt: null }];
    else if (filter?.status === "ended") where.status = "ENDED";
    else if (filter?.status === "draft") where.status = "DRAFT";
    else if (filter?.status === "cancelled") where.status = "CANCELLED";
    else if (filter?.status === "reported") where.reports = { some: { status: "OPEN" } };
    else if (filter?.status === "suspended") where.suspendedAt = { not: null };
    if (filter?.city) where.city = { contains: filter.city, mode: "insensitive" };
    if (filter?.host) {
      where.host = {
        OR: [
          { username: { contains: filter.host, mode: "insensitive" } },
          { firstName: { contains: filter.host, mode: "insensitive" } },
        ],
      };
    }
    if (filter?.paid === "paid") where.priceXaf = { gt: 0 };
    if (filter?.paid === "free") where.priceXaf = 0;
    if (filter?.q) {
      where.OR = [
        { title: { contains: filter.q, mode: "insensitive" } },
        { id: { equals: filter.q } },
      ];
    }
    const items = await this.prisma.event.findMany({
      where,
      orderBy: { startsAt: "desc" },
      take: 80,
      include: {
        host: { select: person },
        _count: { select: { tickets: true, reservations: true, reports: true } },
      },
    });
    return {
      items: items.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        city: e.city,
        zone: e.zone,
        venue: e.venue,
        address: e.address,
        latitude: e.latitude,
        longitude: e.longitude,
        startsAt: e.startsAt.toISOString(),
        endsAt: e.endsAt?.toISOString() ?? null,
        priceXaf: e.priceXaf,
        capacity: e.capacity,
        status: e.status,
        featured: e.featured,
        suspended: Boolean(e.suspendedAt),
        host: e.host,
        tickets: e._count.tickets,
        reservations: e._count.reservations,
        reports: e._count.reports,
      })),
    };
  }

  async eventDetail(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        host: { select: { ...person, organizerStatus: true, salesBlocked: true } },
        tickets: { take: 30, include: { holder: { select: person } } },
        reservations: { take: 20, include: { booker: { select: person }, payment: true } },
        reports: { take: 10 },
      },
    });
    if (!event) throw new NotFoundException({ code: "EVENT_NOT_FOUND" });
    const sold = event.tickets.filter((t) => t.status === "CONFIRMED" || t.status === "CONSUMED").length;
    const revenue = event.reservations.reduce((sum, r) => sum + (r.payment?.status === "SUCCEEDED" ? r.payment.amountXaf : 0), 0);
    return {
      ...event,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt?.toISOString() ?? null,
      sold,
      remaining: event.capacity != null ? Math.max(0, event.capacity - sold) : null,
      revenueXaf: revenue,
      previewPath: `/events/${event.id}`,
    };
  }

  async mutateEvent(
    actor: { id: string; role: string },
    eventId: string,
    action: "approve" | "refuse" | "suspend" | "restore" | "feature" | "unfeature" | "cancel",
    patch?: { title?: string; description?: string },
  ) {
    this.assertSensitive(actor.id);
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException({ code: "EVENT_NOT_FOUND" });
    if (action === "cancel") return this.admin.cancelEvent(actor.id, eventId);
    if (action === "approve") {
      this.assertPerm(actor.role, "events.moderate");
      await this.prisma.event.update({ where: { id: eventId }, data: { status: "PUBLISHED", suspendedAt: null } });
      await this.audit(actor.id, "EVENT_APPROVE", "event", eventId);
    }
    if (action === "refuse") {
      this.assertPerm(actor.role, "events.moderate");
      await this.prisma.event.update({ where: { id: eventId }, data: { status: "DRAFT" } });
      await this.audit(actor.id, "EVENT_UPDATE", "event", eventId, { refused: true });
    }
    if (action === "suspend") {
      this.assertPerm(actor.role, "events.moderate");
      await this.prisma.event.update({ where: { id: eventId }, data: { suspendedAt: new Date() } });
      await this.audit(actor.id, "EVENT_SUSPEND", "event", eventId);
    }
    if (action === "restore") {
      this.assertPerm(actor.role, "events.moderate");
      await this.prisma.event.update({ where: { id: eventId }, data: { suspendedAt: null, status: "PUBLISHED" } });
      await this.audit(actor.id, "EVENT_RESTORE", "event", eventId);
    }
    if (action === "feature" || action === "unfeature") {
      this.assertPerm(actor.role, "events.write");
      await this.prisma.event.update({ where: { id: eventId }, data: { featured: action === "feature" } });
      await this.audit(actor.id, "EVENT_FEATURE", "event", eventId, { featured: action === "feature" });
    }
    if (patch && (patch.title || patch.description)) {
      this.assertPerm(actor.role, "events.write");
      await this.prisma.event.update({
        where: { id: eventId },
        data: {
          ...(patch.title ? { title: patch.title.slice(0, 160) } : {}),
          ...(patch.description ? { description: patch.description.slice(0, 4000) } : {}),
        },
      });
      await this.audit(actor.id, "EVENT_UPDATE", "event", eventId, patch);
    }
    return this.eventDetail(eventId);
  }

  async tickets(q = "", status?: string) {
    const where: Prisma.TicketWhereInput = {};
    if (status) where.status = status as never;
    if (q.trim()) {
      where.OR = [
        { id: { equals: q.trim() } },
        { reservationId: { equals: q.trim() } },
        { holder: { username: { contains: q.trim(), mode: "insensitive" } } },
        { event: { title: { contains: q.trim(), mode: "insensitive" } } },
      ];
    }
    const items = await this.prisma.ticket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 60,
      include: {
        holder: { select: person },
        event: { select: { id: true, title: true, startsAt: true } },
        reservation: { include: { payment: true, booker: { select: person } } },
      },
    });
    return {
      items: items.map((t) => ({
        id: t.id,
        status: t.status,
        consumedAt: t.consumedAt?.toISOString() ?? null,
        createdAt: t.createdAt.toISOString(),
        holder: t.holder,
        event: { ...t.event, startsAt: t.event.startsAt.toISOString() },
        reservationId: t.reservationId,
        booker: t.reservation.booker,
        amountXaf: t.reservation.amountXaf,
        paymentStatus: t.reservation.payment?.status ?? (t.reservation.amountXaf === 0 ? "FREE" : "NONE"),
        provider: t.reservation.payment?.provider ?? null,
      })),
    };
  }

  async finance() {
    const fee = await this.admin.platformFeePercent();
    const rules = await this.refundRules();
    const settings = await this.settings();
    const [succeeded, refunded, partial, pending, failed] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { status: "SUCCEEDED", kind: "RESERVATION" },
        _sum: { amountXaf: true },
        _count: { _all: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: "REFUNDED" },
        _sum: { refundedAmountXaf: true, amountXaf: true },
        _count: { _all: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: "PARTIALLY_REFUNDED" },
        _sum: { refundedAmountXaf: true, amountXaf: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: "PENDING", kind: "RESERVATION" },
        _sum: { amountXaf: true },
      }),
      this.prisma.payment.count({ where: { status: "FAILED" } }),
    ]);
    const gmv = succeeded._sum.amountXaf ?? 0;
    const refundedXaf = (refunded._sum.refundedAmountXaf ?? 0) + (partial._sum.refundedAmountXaf ?? 0);
    const commission = chargeBreakdown({ ticketAmountXaf: Math.max(0, gmv - refundedXaf), platformFeePercent: fee }).platformFeeXaf;
    return {
      provider: "mock",
      stripe: { connected: false, reason: "Stripe n’est pas branché. Ledger mock uniquement." },
      gmvXaf: gmv,
      refundedXaf,
      chargebacksXaf: 0,
      stripeFeesXaf: 0,
      pendingXaf: pending._sum.amountXaf ?? 0,
      transferredXaf: 0,
      availableXaf: 0,
      heldXaf: pending._sum.amountXaf ?? 0,
      payoutsXaf: 0,
      commissionXaf: commission,
      toOrganizersXaf: Math.max(0, gmv - refundedXaf - commission),
      failedCount: failed,
      platformFeePercent: fee,
      payoutDelayDays: settings.payoutDelayDays,
      refundRules: rules,
      note: "Aucun payout automatique vers les organisateurs. TipTop reste au centre du flux.",
    };
  }

  async refundCenter() {
    const items = await this.prisma.payment.findMany({
      where: { status: { in: ["SUCCEEDED", "PARTIALLY_REFUNDED", "REFUNDED"] }, kind: "RESERVATION" },
      orderBy: { createdAt: "desc" },
      take: 60,
      include: {
        user: { select: person },
        reservation: { select: { id: true, eventId: true, event: { select: { title: true, status: true } } } },
      },
    });
    return {
      items: items.map((p) => ({
        id: p.id,
        status: p.status,
        amountXaf: p.amountXaf,
        refundedAmountXaf: p.refundedAmountXaf,
        createdAt: p.createdAt.toISOString(),
        refundedAt: p.refundedAt?.toISOString() ?? null,
        user: p.user,
        reservationId: p.reservation?.id ?? null,
        eventId: p.reservation?.eventId ?? null,
        eventTitle: p.reservation?.event.title ?? null,
        eventStatus: p.reservation?.event.status ?? null,
        refundable: p.status === "SUCCEEDED",
      })),
    };
  }

  async refundEventTickets(actor: { id: string; role: string }, eventId: string) {
    this.assertPerm(actor.role, "finance.refund");
    this.assertSensitive(actor.id);
    const payments = await this.prisma.payment.findMany({
      where: { kind: "RESERVATION", status: "SUCCEEDED", reservation: { eventId } },
    });
    const results: Array<{ paymentId: string; ok: boolean; skipped?: boolean }> = [];
    for (const payment of payments) {
      try {
        refundAllowed(payment.status);
        await this.admin.refund(actor, payment.id, payment.amountXaf);
        results.push({ paymentId: payment.id, ok: true });
      } catch {
        results.push({ paymentId: payment.id, ok: false, skipped: true });
      }
    }
    await this.audit(actor.id, "PAYMENT_REFUND", "event", eventId, { bulk: true, count: results.length });
    return { ok: true, results };
  }

  async featureFlags() {
    const row = await this.prisma.appConfig.findUnique({ where: { key: FEATURE_FLAGS_CONFIG_KEY } });
    return parseFeatureFlags(row?.value);
  }

  async updateFeatureFlags(actor: { id: string; role: string }, raw: unknown) {
    this.assertPerm(actor.role, "flags.write");
    const next = parseFeatureFlags(raw);
    await this.prisma.appConfig.upsert({
      where: { key: FEATURE_FLAGS_CONFIG_KEY },
      create: { key: FEATURE_FLAGS_CONFIG_KEY, value: next as object },
      update: { value: next as object },
    });
    await this.audit(actor.id, "FEATURE_FLAG", "AppConfig", FEATURE_FLAGS_CONFIG_KEY, next as object);
    return next;
  }

  async settings() {
    const row = await this.prisma.appConfig.findUnique({ where: { key: ADMIN_SETTINGS_CONFIG_KEY } });
    return parseAdminSettings(row?.value);
  }

  async updateSettings(actor: { id: string; role: string }, raw: unknown) {
    this.assertPerm(actor.role, "settings.write");
    const previous = await this.settings();
    const next = parseAdminSettings({ ...previous, ...(raw as object) });
    await this.prisma.appConfig.upsert({
      where: { key: ADMIN_SETTINGS_CONFIG_KEY },
      create: { key: ADMIN_SETTINGS_CONFIG_KEY, value: next as object },
      update: { value: next as object },
    });
    await this.audit(actor.id, "SETTINGS_UPDATE", "AppConfig", ADMIN_SETTINGS_CONFIG_KEY, { previous, next });
    return next;
  }

  async phoneAuth() {
    const env = loadEnv();
    const row = await this.prisma.appConfig.findUnique({ where: { key: PHONE_AUTH_CONFIG_KEY } });
    const settings = parsePhoneAuthSettings(row?.value ?? defaultPhoneAuthSettings());
    const dayAgo = new Date(Date.now() - 86400_000);
    const weekAgo = new Date(Date.now() - 7 * 86400_000);
    const [day, week, failed] = await Promise.all([
      this.prisma.otpChallenge.count({ where: { createdAt: { gte: dayAgo } } }),
      this.prisma.otpChallenge.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.otpChallenge.count({ where: { createdAt: { gte: dayAgo }, attempts: { gte: env.OTP_MAX_ATTEMPTS } } }),
    ]);
    return {
      settings,
      mockEnabled: env.OTP_ALLOW_MOCK,
      neverShowsCodes: true,
      last24h: { challenges: day, locked: failed, estimatedSmsCostXaf: env.OTP_ALLOW_MOCK ? 0 : day * 25 },
      last7d: { challenges: week },
      note: "Les codes OTP ne sont jamais renvoyés à l’admin. Hash uniquement en base.",
    };
  }

  async updatePhoneAuth(actor: { id: string; role: string }, raw: unknown) {
    this.assertPerm(actor.role, "settings.write");
    const next = parsePhoneAuthSettings(raw);
    await this.prisma.appConfig.upsert({
      where: { key: PHONE_AUTH_CONFIG_KEY },
      create: { key: PHONE_AUTH_CONFIG_KEY, value: next as object },
      update: { value: next as object },
    });
    await this.audit(actor.id, "SETTINGS_UPDATE", "AppConfig", PHONE_AUTH_CONFIG_KEY, next as object);
    return next;
  }

  async mapsSettings() {
    const row = await this.prisma.appConfig.findUnique({ where: { key: MAPS_SETTINGS_CONFIG_KEY } });
    const raw = row?.value && typeof row.value === "object" ? (row.value as Record<string, unknown>) : {};
    const events = await this.prisma.event.findMany({
      where: { latitude: { not: null }, longitude: { not: null } },
      take: 80,
      select: {
        id: true,
        title: true,
        city: true,
        address: true,
        latitude: true,
        longitude: true,
        status: true,
        startsAt: true,
      },
    });
    return {
      provider: "nominatim",
      googleConfigured: Boolean(process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY),
      countries: Array.isArray(raw.countries) ? raw.countries : ["CM", "CA"],
      enabledFeatures: raw.features ?? ["geocode", "zones"],
      events: events.map((e) => ({ ...e, startsAt: e.startsAt.toISOString() })),
      privacy: "Les coordonnées privées des utilisateurs ne sont pas exposées ici.",
    };
  }

  async aiControl() {
    const row = await this.prisma.appConfig.findUnique({ where: { key: AI_LIMITS_CONFIG_KEY } });
    const limits = parseAiLimits(row?.value ?? defaultAiLimits());
    const dayAgo = new Date(Date.now() - 86400_000);
    const weekAgo = new Date(Date.now() - 7 * 86400_000);
    const [recsDay, plansDay, matchesDay, agentDay, recsWeek, consents] = await Promise.all([
      this.prisma.experienceRecommendation.count({ where: { createdAt: { gte: dayAgo } } }),
      this.prisma.experienceRequest.count({ where: { createdAt: { gte: dayAgo } } }),
      this.prisma.socialActivityMatch.count({ where: { createdAt: { gte: dayAgo } } }),
      this.prisma.agentSuggestion.count({ where: { createdAt: { gte: dayAgo } } }),
      this.prisma.experienceRecommendation.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.aiConsent.groupBy({
        by: ["agentEnabled", "socialMatch", "personalizedRecs"],
        _count: { _all: true },
      }),
    ]);
    const env = loadEnv();
    const callsDay = recsDay + plansDay + matchesDay + agentDay;
    return {
      limits,
      provider: env.OPENAI_API_KEY ? "openai" : "rules_fallback",
      model: env.OPENAI_MODEL,
      configured: Boolean(env.OPENAI_API_KEY),
      maskedKey: maskSecret(env.OPENAI_API_KEY),
      usage: {
        day: { recommendations: recsDay, plans: plansDay, matches: matchesDay, agent: agentDay, calls: callsDay },
        week: { recommendations: recsWeek },
        estimatedCostUsd: env.OPENAI_API_KEY ? Number((callsDay * 0.002).toFixed(3)) : 0,
      },
      consents,
      overBudget: callsDay > limits.dailyCallBudget,
    };
  }

  async updateAiLimits(actor: { id: string; role: string }, raw: unknown) {
    this.assertPerm(actor.role, "ai.write");
    const next = parseAiLimits(raw);
    await this.prisma.appConfig.upsert({
      where: { key: AI_LIMITS_CONFIG_KEY },
      create: { key: AI_LIMITS_CONFIG_KEY, value: next as object },
      update: { value: next as object },
    });
    await this.audit(actor.id, "AI_SETTINGS", "AppConfig", AI_LIMITS_CONFIG_KEY, next as object);
    return next;
  }

  async refundRules() {
    const row = await this.prisma.appConfig.findUnique({ where: { key: REFUND_RULES_CONFIG_KEY } });
    return parseRefundRules(row?.value ?? defaultRefundRules());
  }

  async updateRefundRules(actor: { id: string; role: string }, raw: unknown) {
    this.assertPerm(actor.role, "finance.settings");
    const next = parseRefundRules(raw);
    await this.prisma.appConfig.upsert({
      where: { key: REFUND_RULES_CONFIG_KEY },
      create: { key: REFUND_RULES_CONFIG_KEY, value: next as object },
      update: { value: next as object },
    });
    await this.audit(actor.id, "SETTINGS_UPDATE", "AppConfig", REFUND_RULES_CONFIG_KEY, next as object);
    return next;
  }

  async analytics() {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 86400_000);
    const weekAgo = new Date(now.getTime() - 7 * 86400_000);
    const monthAgo = new Date(now.getTime() - 30 * 86400_000);
    const [
      signups,
      dau,
      wau,
      mau,
      eventViews,
      reservations,
      paymentsOk,
      attended,
      plans,
      recs,
    ] = await Promise.all([
      this.prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
      this.prisma.device.count({ where: { lastSeenAt: { gte: dayAgo } } }),
      this.prisma.device.count({ where: { lastSeenAt: { gte: weekAgo } } }),
      this.prisma.device.count({ where: { lastSeenAt: { gte: monthAgo } } }),
      this.prisma.eventHeart.count({ where: { createdAt: { gte: monthAgo } } }),
      this.prisma.reservation.count({ where: { createdAt: { gte: monthAgo } } }),
      this.prisma.payment.count({ where: { status: "SUCCEEDED", kind: "RESERVATION", createdAt: { gte: monthAgo } } }),
      this.prisma.ticket.count({ where: { status: "CONSUMED", createdAt: { gte: monthAgo } } }),
      this.prisma.experiencePlan.count({ where: { createdAt: { gte: monthAgo } } }),
      this.prisma.experienceRecommendation.count({ where: { createdAt: { gte: monthAgo } } }),
    ]);
    const conversion = reservations > 0 ? Number((paymentsOk / reservations).toFixed(3)) : 0;
    const recToReal = recs > 0 ? Number((attended / recs).toFixed(3)) : 0;
    return {
      acquisition: { signups30d: signups },
      engagement: { dau, wau, mau, savedEvents30d: eventViews },
      conversion: { reservations30d: reservations, payments30d: paymentsOk, reservationToPay: conversion },
      realWorld: {
        attended30d: attended,
        aiPlans30d: plans,
        recommendations30d: recs,
        recommendationToExperience: recToReal,
      },
    };
  }

  async auditLogs(q = "") {
    const where: Prisma.AdminAuditWhereInput = q.trim()
      ? {
          OR: [
            { entityId: { contains: q.trim() } },
            { actor: { username: { contains: q.trim(), mode: "insensitive" } } },
            { action: { equals: q.trim() as AdminAction } },
          ],
        }
      : {};
    const items = await this.prisma.adminAudit.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 80,
      include: { actor: { select: person } },
    });
    return {
      items: items.map((a) => ({
        id: a.id,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        meta: a.meta,
        createdAt: a.createdAt.toISOString(),
        actor: a.actor,
      })),
      immutable: true,
    };
  }

  async supportLookup(q: string) {
    const query = q.trim();
    if (query.length < 2) return { user: null, timeline: [] };
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: { contains: query, mode: "insensitive" } },
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { phoneE164: { contains: query } },
          { id: { equals: query } },
        ],
      },
    });
    if (!user) return { user: null, timeline: [] };
    const [reservations, payments, tickets, notifs] = await Promise.all([
      this.prisma.reservation.findMany({
        where: { bookerId: user.id },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { event: { select: { id: true, title: true, status: true } }, payment: true },
      }),
      this.prisma.payment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 8 }),
      this.prisma.ticket.findMany({
        where: { holderId: user.id },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { event: { select: { title: true, status: true } } },
      }),
      this.prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 8 }),
    ]);
    const timeline = [
      ...reservations.map((r) => ({
        at: r.createdAt.toISOString(),
        kind: "reservation",
        label: `Réservation ${r.id} · ${r.event.title} · ${r.status}`,
        payment: r.payment?.status ?? null,
      })),
      ...payments.map((p) => ({
        at: p.createdAt.toISOString(),
        kind: "payment",
        label: `Paiement ${p.status} ${p.amountXaf} ${p.currency}`,
      })),
      ...tickets.map((t) => ({
        at: t.createdAt.toISOString(),
        kind: "ticket",
        label: `Billet ${t.status} · ${t.event.title}`,
      })),
      ...notifs.map((n) => ({
        at: n.createdAt.toISOString(),
        kind: "notification",
        label: `Notif ${n.type} ${n.entityType ?? ""}`,
      })),
    ].sort((a, b) => (a.at < b.at ? 1 : -1));
    return {
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        role: user.role,
        phoneMasked: maskPhoneE164(user.phoneE164),
      },
      timeline,
    };
  }

  async moderationQueue() {
    const items = await this.prisma.report.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "asc" },
      take: 80,
      include: {
        reporter: { select: person },
        targetUser: { select: person },
        post: { select: { id: true, body: true } },
        event: { select: { id: true, title: true } },
        mood: { select: { id: true, body: true } },
      },
    });
    return {
      items: items.map((r) => ({
        id: r.id,
        kind: r.kind,
        reason: r.reason,
        body: r.body,
        createdAt: r.createdAt.toISOString(),
        reporter: r.reporter,
        targetUser: r.targetUser,
        post: r.post,
        event: r.event,
        mood: r.mood,
        priority: r.reason === "ABUSE" ? "HIGH" : "NORMAL",
        messagePreview: r.kind === "MESSAGE" ? null : undefined,
        privateMessageHidden: r.kind === "MESSAGE",
      })),
    };
  }

  async messagingSafety() {
    const [blocks, messageReports, groups] = await Promise.all([
      this.prisma.userBlock.count(),
      this.prisma.report.count({ where: { kind: "MESSAGE", status: "OPEN" } }),
      this.prisma.report.count({ where: { kind: "EVENT", status: "OPEN" } }),
    ]);
    return {
      blockedPairs: blocks,
      openMessageReports: messageReports,
      openEventReports: groups,
      policy: "Aucun accès généralisé au chat privé. Les signalements MESSAGE n’exposent pas le corps du message.",
    };
  }

  async campaigns() {
    const items = await this.prisma.adminCampaign.findMany({ orderBy: { createdAt: "desc" }, take: 40 });
    return {
      items: items.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        scheduledAt: c.scheduledAt?.toISOString() ?? null,
        sentAt: c.sentAt?.toISOString() ?? null,
      })),
    };
  }

  async sendCampaign(
    actor: { id: string; role: string },
    input: {
      title: string;
      body: string;
      audience: "all" | "organizers" | "active" | "inactive";
      confirmBroadcast?: boolean;
      testUserId?: string;
    },
  ) {
    this.assertPerm(actor.role, "notifications.write");
    this.assertSensitive(actor.id);
    if (input.audience === "all" && !input.confirmBroadcast && !input.testUserId) {
      throw new BadRequestException({ code: "BROADCAST_CONFIRM_REQUIRED" });
    }
    const title = input.title.trim().slice(0, 80);
    const body = input.body.trim().slice(0, 400);
    if (!title || !body) throw new BadRequestException({ code: "CAMPAIGN_INVALID" });
    let userIds: string[] = [];
    if (input.testUserId) {
      userIds = [input.testUserId];
    } else if (input.audience === "organizers") {
      const hosts = await this.prisma.user.findMany({
        where: { hostedEvents: { some: {} } },
        select: { id: true },
      });
      userIds = hosts.map((h) => h.id);
    } else if (input.audience === "active") {
      const day = new Date(Date.now() - 7 * 86400_000);
      const devices = await this.prisma.device.findMany({
        where: { lastSeenAt: { gte: day } },
        select: { userId: true },
      });
      userIds = [...new Set(devices.map((d) => d.userId))];
    } else if (input.audience === "inactive") {
      const day = new Date(Date.now() - 30 * 86400_000);
      const recent = await this.prisma.device.findMany({
        where: { lastSeenAt: { gte: day } },
        select: { userId: true },
      });
      const skip = new Set(recent.map((d) => d.userId));
      const all = await this.prisma.user.findMany({ where: { status: "ACTIVE" }, select: { id: true } });
      userIds = all.map((u) => u.id).filter((id) => !skip.has(id));
    } else {
      const all = await this.prisma.user.findMany({ where: { status: "ACTIVE" }, select: { id: true } });
      userIds = all.map((u) => u.id);
    }
    const campaign = await this.prisma.adminCampaign.create({
      data: {
        title,
        body,
        status: "SENT",
        audience: { kind: input.audience, test: Boolean(input.testUserId) },
        sentAt: new Date(),
        sentCount: userIds.length,
        createdById: actor.id,
      },
    });
    await Promise.all(
      userIds.slice(0, 2000).map((userId) =>
        this.notifications.create({
          userId,
          actorId: actor.id,
          type: "EVENT_UPDATE",
          entityType: "admin_announcement",
          entityId: campaign.id,
        }),
      ),
    );
    await this.audit(actor.id, "NOTIFICATION_SEND", "AdminCampaign", campaign.id, {
      audience: input.audience,
      count: userIds.length,
    });
    return { ok: true, id: campaign.id, sentCount: userIds.length, channel: "in_app" };
  }

  async worldMissions() {
    const items = await this.prisma.worldMission.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
    return {
      items: items.map((m) => ({
        ...m,
        startsAt: m.startsAt?.toISOString() ?? null,
        endsAt: m.endsAt?.toISOString() ?? null,
      })),
    };
  }

  async upsertWorldMission(actor: { id: string; role: string }, input: Partial<{ id: string }> & Record<string, unknown>) {
    this.assertPerm(actor.role, "world.write");
    const draft = normalizeWorldMission(input as never);
    const data = {
      title: draft.title,
      description: draft.description,
      category: draft.category,
      durationHours: draft.durationHours,
      conditions: draft.conditions,
      reward: draft.reward,
      startsAt: draft.startsAt ? new Date(draft.startsAt) : null,
      endsAt: draft.endsAt ? new Date(draft.endsAt) : null,
      status: draft.status,
    };
    const row = input.id
      ? await this.prisma.worldMission.update({ where: { id: String(input.id) }, data })
      : await this.prisma.worldMission.create({ data });
    await this.audit(actor.id, "WORLD_MISSION", "WorldMission", row.id, draft as object);
    return row;
  }

  async webhooks() {
    const items = await this.prisma.webhookReceipt.findMany({ orderBy: { createdAt: "desc" }, take: 40 });
    const env = loadEnv();
    return {
      endpoints: [
        {
          id: "tiptop_payments",
          path: "/api/payments/webhook",
          configured: Boolean(env.PAYMENT_WEBHOOK_SECRET),
          provider: "tiptop_mock",
        },
        { id: "stripe", path: "n/a", configured: false, provider: "stripe", message: "Stripe webhooks non implémentés." },
      ],
      items: items.map((w) => ({
        ...w,
        createdAt: w.createdAt.toISOString(),
        updatedAt: w.updatedAt.toISOString(),
      })),
    };
  }

  async envChecklist() {
    const env = loadEnv();
    return {
      items: [
        { key: "DATABASE_URL", required: true, present: Boolean(process.env.DATABASE_URL), masked: maskSecret(process.env.DATABASE_URL, 6) },
        { key: "SESSION_SECRET", required: true, present: Boolean(env.SESSION_SECRET), masked: maskSecret(env.SESSION_SECRET) },
        { key: "PAYMENT_WEBHOOK_SECRET", required: env.NODE_ENV === "production", present: Boolean(env.PAYMENT_WEBHOOK_SECRET), masked: maskSecret(env.PAYMENT_WEBHOOK_SECRET) },
        { key: "OPENAI_API_KEY", required: false, present: Boolean(env.OPENAI_API_KEY), masked: maskSecret(env.OPENAI_API_KEY) },
        { key: "OPENAI_MODEL", required: false, present: Boolean(env.OPENAI_MODEL), masked: env.OPENAI_MODEL },
        { key: "OTP_ALLOW_MOCK", required: false, present: true, masked: String(env.OTP_ALLOW_MOCK) },
        { key: "STRIPE_SECRET_KEY", required: false, present: Boolean(process.env.STRIPE_SECRET_KEY), masked: maskSecret(process.env.STRIPE_SECRET_KEY), note: "Non utilisé" },
        { key: "GOOGLE_MAPS_API_KEY", required: false, present: Boolean(process.env.GOOGLE_MAPS_API_KEY), masked: maskSecret(process.env.GOOGLE_MAPS_API_KEY), note: "Non utilisé" },
        { key: "FIREBASE_PROJECT_ID", required: false, present: Boolean(process.env.FIREBASE_PROJECT_ID), masked: process.env.FIREBASE_PROJECT_ID ?? "", note: "Non utilisé" },
      ],
    };
  }

  private audit(actorId: string, action: AdminAction, entityType: string, entityId: string, meta?: Prisma.InputJsonValue) {
    return this.prisma.adminAudit.create({
      data: { actorId, action, entityType, entityId, meta: meta ?? undefined },
    });
  }
}

function trustScore(certified: boolean, status: string, salesBlocked: boolean): number {
  let n = 50;
  if (certified) n += 20;
  if (status === "VERIFIED") n += 20;
  if (status === "RESTRICTED") n -= 20;
  if (status === "SUSPENDED" || status === "REJECTED" || salesBlocked) n -= 40;
  return Math.max(0, Math.min(100, n));
}

function labelFirebase(id: string) {
  const map: Record<string, string> = {
    firebase_auth: "Firebase Authentication",
    firestore: "Cloud Firestore",
    firebase_storage: "Firebase Storage",
    fcm: "Firebase Cloud Messaging",
    app_check: "Firebase App Check",
  };
  return map[id] ?? id;
}

function labelStripe(id: string) {
  const map: Record<string, string> = {
    stripe_connect: "Stripe Connect",
    stripe_webhooks: "Stripe Webhooks",
    stripe_refunds: "Stripe Refunds",
    stripe_payouts: "Stripe Payouts",
  };
  return map[id] ?? id;
}

function labelGoogle(id: string) {
  const map: Record<string, string> = {
    google_maps: "Google Maps",
    google_places: "Google Places",
    google_geocoding: "Google Geocoding",
    google_routes: "Google Routes",
  };
  return map[id] ?? id;
}

async function probeNominatim(): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("https://nominatim.openstreetmap.org/status", {
      headers: { "User-Agent": "TipTopAdmin/1.0 (ops@tiptop.local)" },
      signal: AbortSignal.timeout(4000),
    });
    return { ok: res.ok, error: res.ok ? undefined : `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function probeOpenAi(key: string): Promise<{
  status: ServiceProbe["status"];
  tested: boolean;
  message: string;
}> {
  if (!key) {
    return {
      status: "needs_config",
      tested: true,
      message: "OPENAI_API_KEY absent. Intelligence = parseur de règles, sans LLM.",
    };
  }
  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) return { status: "ok", tested: true, message: "OpenAI a répondu (GET /v1/models)." };
    if (res.status === 401) return { status: "error", tested: true, message: "Clé OpenAI rejetée (401)." };
    return { status: "error", tested: true, message: `OpenAI HTTP ${res.status}` };
  } catch (err) {
    return { status: "error", tested: true, message: err instanceof Error ? err.message : String(err) };
  }
}

export const FEATURE_FLAG_KEYS_RUNTIME: FeatureFlagKey[] = [
  "aiRecommendations",
  "aiAgent",
  "experiencePlanner",
  "matching",
  "monMonde",
  "moods",
  "collectiveVideo",
  "payments",
  "reservations",
  "newSocialUi",
];
