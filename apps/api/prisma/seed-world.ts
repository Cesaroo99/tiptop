import { MOOD_INTERESTS, statusExpiresAt, WORLD_CITIES, cityCoords } from "@tiptop/domain";
import { PrismaClient } from "@prisma/client";

const WORLD_PHONE = "+19990";
const WORLD_USER_TARGET = 500;
const EVENT_TARGET = 480;
const POST_TARGET = 5200;
const COMMENT_TARGET = 900;
const MOOD_TARGET = 60;
const STATUS_TARGET = 60;
const CESAR_PHONE = "+237695214785";
const EVENT_PREFIX = "W · ";
const POST_PREFIX = "W · ";

const FIRST = [
  "Amara", "Yuki", "Diego", "Noor", "Léa", "Kai", "Sofia", "Omar", "Maya", "Luca",
  "Aisha", "Chen", "Inès", "Ravi", "Elena", "Jamal", "Nora", "Theo", "Priya", "Hugo",
  "Zara", "Kenji", "Fatima", "Noah", "Lina", "Mateo", "Aya", "Ibrahim", "Chloe", "Sami",
];
const LAST = [
  "Okoye", "Nakamura", "Santos", "Hassan", "Moreau", "Kim", "Rossi", "Diallo", "Silva", "Berg",
  "Patel", "Nguyen", "Costa", "Ali", "Dubois", "Khan", "López", "Mensah", "Ivanov", "Tanaka",
];
const JOBS = [
  "Graphiste", "DJ", "Photographe", "Chef", "Étudiant", "Architecte", "Musicien", "Journaliste",
  "Danseur", "Producteur", "Barista", "Designer",
];
const BIOS = [
  "Toujours un plan ce soir.",
  "Food, friends, late nights.",
  "Je sors. Point.",
  "Concerts and rooftops.",
  "Local tips, no tourist traps.",
  "City lights, good people.",
  "Ici pour les vraies soirées.",
  "Weekend energy only.",
];
const POST_BODIES = [
  "Ce soir ça va être long.",
  "Table for two, then the night.",
  "Who is outside right now?",
  "The set just started.",
  "Need people. Not a plan.",
  "Sunset then we move.",
  "Last call is a suggestion.",
  "Come through if you are close.",
  "This city never sleeps.",
  "On y va. Maintenant.",
];
const EVENT_TITLES = [
  "Late Set",
  "Rooftop Hours",
  "Kitchen After Dark",
  "Live Session",
  "Night Market",
  "After Hours",
  "Open Deck",
  "Golden Hour",
  "Midnight Table",
  "Street Session",
];
const EVENT_IMAGES = [
  "/seed/events/black-white.jpg",
  "/seed/events/afterwork.jpg",
  "/seed/events/brunch.jpg",
  "/seed/events/piscine.jpg",
  "/seed/events/live.jpg",
  "/seed/events/expo.jpg",
  "/seed/events/rooftop.jpg",
];
const POST_IMAGES = [
  "/seed/posts/drinks.jpg",
  "/seed/posts/food.jpg",
  "/seed/posts/friends.jpg",
  "/seed/posts/lights.jpg",
  "/seed/posts/rooftop.jpg",
];
const MOOD_VIDEOS = [
  "/seed/moods/video-concert.mp4",
  "/seed/moods/video-piscine.mp4",
  "/seed/moods/video-rooftop.mp4",
  "/seed/moods/video-food.mp4",
];
const MOOD_PHOTOS = [
  "/seed/moods/concert.jpg",
  "/seed/moods/piscine.jpg",
  "/seed/moods/rooftop.jpg",
  "/seed/moods/food.jpg",
  "/seed/moods/bastos.jpg",
  "/seed/moods/street.jpg",
];
const AVATARS = [
  "/seed/avatars/cesar.jpg",
  "/seed/avatars/erica.jpg",
  "/seed/avatars/alex.jpg",
  "/seed/avatars/amina.jpg",
  "/seed/avatars/fouda.jpg",
  "/seed/avatars/koffi.jpg",
  "/seed/avatars/mireille.jpg",
  "/seed/avatars/nadege.jpg",
  "/seed/avatars/onguene.jpg",
  "/seed/avatars/rachel.jpg",
  "/seed/avatars/sarah.jpg",
  "/seed/avatars/william.jpg",
];

function pick<T>(list: readonly T[], i: number): T {
  return list[i % list.length]!;
}

function jitter(n: number, i: number, spread = 0.012) {
  return n + ((i % 17) - 8) * (spread / 8);
}

async function createInBatches<T>(
  rows: T[],
  size: number,
  write: (chunk: T[]) => Promise<unknown>,
) {
  for (let i = 0; i < rows.length; i += size) {
    await write(rows.slice(i, i + size));
  }
}

export async function enrichWorldCatalog(prisma: PrismaClient) {
  const cities = WORLD_CITIES;
  const availableUntil = new Date(Date.now() + 7 * 24 * 3600_000);
  const planned = Array.from({ length: WORLD_USER_TARGET }, (_, idx) => {
    const i = idx + 1;
    const city = pick(cities, i);
    const zone = city.zones[i % city.zones.length]!;
    return {
      i,
      phoneE164: `${WORLD_PHONE}${String(i).padStart(6, "0")}`,
      username: `w.u${i}`,
      firstName: pick(FIRST, i),
      lastName: pick(LAST, i + 3),
      city,
      zone,
    };
  });

  const existingUsers = await prisma.user.findMany({
    where: { phoneE164: { startsWith: WORLD_PHONE } },
    select: { id: true, phoneE164: true },
  });
  const havePhone = new Set(existingUsers.map((u) => u.phoneE164));
  const missingUsers = planned.filter((u) => !havePhone.has(u.phoneE164));
  if (missingUsers.length) {
    await createInBatches(missingUsers, 100, (chunk) =>
      prisma.user.createMany({
        data: chunk.map((u) => ({
          phoneE164: u.phoneE164,
          phoneCountry: u.city.countryCode,
          username: u.username,
          firstName: u.firstName,
          lastName: u.lastName,
          profileCompleted: true,
          locale: u.city.countryCode === "US" || u.city.countryCode === "GB" ? "en" : "fr",
          currency: u.city.currency,
        })),
        skipDuplicates: true,
      }),
    );
  }

  const created = await prisma.user.findMany({
    where: { phoneE164: { startsWith: WORLD_PHONE } },
    select: { id: true, phoneE164: true },
  });
  const byPhone = new Map(created.map((u) => [u.phoneE164, u]));
  const profiled = await prisma.profile.findMany({
    where: { userId: { in: created.map((u) => u.id) } },
    select: { userId: true },
  });
  const haveProfile = new Set(profiled.map((p) => p.userId));
  const missingProfiles = planned
    .map((u) => {
      const row = byPhone.get(u.phoneE164);
      if (!row || haveProfile.has(row.id)) return null;
      return {
        userId: row.id,
        bio: `${pick(BIOS, u.i)} · ${u.city.city}`,
        profession: pick(JOBS, u.i),
        avatarUrl: pick(AVATARS, u.i),
        coverUrl: "/seed/covers/city.jpg",
        city: u.city.city,
        zone: u.zone,
        country: u.city.countryCode,
        availability: "AVAILABLE" as const,
        availabilityUntil: availableUntil,
        locationPrecision: "ZONE" as const,
        latitude: jitter(u.city.lat, u.i),
        longitude: jitter(u.city.lng, u.i + 4),
        interests: [pick(MOOD_INTERESTS, u.i).id, pick(MOOD_INTERESTS, u.i + 2).id],
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));
  if (missingProfiles.length) {
    await createInBatches(missingProfiles, 100, (chunk) => prisma.profile.createMany({ data: chunk, skipDuplicates: true }));
  }

  const userIds = created.map((u) => u.id);
  if (!userIds.length) {
    await ensureDemoTicket(prisma);
    await backfillEventCoords(prisma);
    return;
  }

  const cesar = await prisma.user.findUnique({
    where: { phoneE164: CESAR_PHONE },
    select: { id: true },
  });
  if (cesar) {
    const sample = created.slice(0, 90);
    await prisma.follow.createMany({
      data: sample.flatMap((u) => [
        { followerId: cesar.id, followeeId: u.id },
        { followerId: u.id, followeeId: cesar.id },
      ]),
      skipDuplicates: true,
    });
    await prisma.contact.createMany({
      data: sample.map((u) => ({ ownerId: cesar.id, personId: u.id })),
      skipDuplicates: true,
    });
  }

  const now = Date.now();
  const eventCount = await prisma.event.count({ where: { title: { startsWith: EVENT_PREFIX } } });
  if (eventCount < EVENT_TARGET) {
    const start = eventCount;
    const eventRows = Array.from({ length: EVENT_TARGET - start }, (_, offset) => {
      const idx = start + offset;
      const city = pick(cities, idx);
      const zone = city.zones[idx % city.zones.length]!;
      const venue = city.venues[idx % city.venues.length]!;
      const hours = 3 + (idx % 280);
      const lat = jitter(city.lat, idx);
      const lng = jitter(city.lng, idx + 5);
      return {
        title: `${EVENT_PREFIX}${pick(EVENT_TITLES, idx)} — ${city.city} ${zone}`,
        description: `${venue} · ${zone}, ${city.city}. ${pick(POST_BODIES, idx)}`,
        imageUrl: pick(EVENT_IMAGES, idx),
        city: city.city,
        zone,
        venue,
        address: `${12 + (idx % 80)} ${zone}, ${city.city}`,
        latitude: lat,
        longitude: lng,
        startsAt: new Date(now + hours * 3600_000),
        endsAt: new Date(now + (hours + 5) * 3600_000),
        capacity: 80 + (idx % 420),
        hostId: userIds[idx % userIds.length]!,
        priceXaf: idx % 3 === 0 ? 0 : 2500 + (idx % 8) * 500,
        currency: city.currency,
        minAge: 18,
        requiresReservation: idx % 2 === 0,
      };
    });
    await createInBatches(eventRows, 80, (chunk) => prisma.event.createMany({ data: chunk }));
  }

  const worldEvents = await prisma.event.findMany({
    where: { title: { startsWith: EVENT_PREFIX } },
    select: { id: true, hostId: true, city: true, currency: true },
  });
  if (worldEvents.length) {
    await prisma.eventParticipant.createMany({
      data: worldEvents.map((event) => ({ eventId: event.id, userId: event.hostId, status: "HOST" as const })),
      skipDuplicates: true,
    });
  }

  const postCount = await prisma.post.count({ where: { body: { startsWith: POST_PREFIX } } });
  if (postCount < POST_TARGET) {
    const start = postCount;
    const postRows = Array.from({ length: POST_TARGET - start }, (_, offset) => {
      const idx = start + offset;
      const city = pick(cities, idx + 7);
      const zone = city.zones[idx % city.zones.length]!;
      return {
        authorId: userIds[idx % userIds.length]!,
        body: `${POST_PREFIX}${pick(POST_BODIES, idx)} ${city.city} #${idx + 1}`,
        city: city.city,
        zone,
        imageUrl: idx % 3 === 0 ? pick(POST_IMAGES, idx) : null,
      };
    });
    await createInBatches(postRows, 200, (chunk) => prisma.post.createMany({ data: chunk }));
  }

  const commentCount = await prisma.comment.count({ where: { body: { startsWith: "W · C" } } });
  if (commentCount < COMMENT_TARGET) {
    const posts = await prisma.post.findMany({
      where: { body: { startsWith: POST_PREFIX } },
      select: { id: true },
      take: 400,
      orderBy: { createdAt: "asc" },
    });
    const commentRows = Array.from({ length: COMMENT_TARGET - commentCount }, (_, offset) => {
      const idx = commentCount + offset;
      return {
        postId: posts[idx % posts.length]!.id,
        authorId: userIds[(idx + 11) % userIds.length]!,
        body: `W · C${idx + 1} ${pick(POST_BODIES, idx + 2)}`,
      };
    });
    if (posts.length) {
      await createInBatches(commentRows, 200, (chunk) => prisma.comment.createMany({ data: chunk }));
    }
  }

  const moodCount = await prisma.mood.count({ where: { body: { startsWith: "W · M" } } });
  if (moodCount < MOOD_TARGET) {
    const start = moodCount;
    const moodRows = Array.from({ length: MOOD_TARGET - start }, (_, offset) => {
      const idx = start + offset;
      const city = pick(cities, idx + 11);
      const interest = pick(MOOD_INTERESTS, idx);
      const zone = city.zones[idx % city.zones.length]!;
      return {
        authorId: userIds[idx % userIds.length]!,
        body: `W · M${idx + 1} ${interest.fr} · ${city.city}`,
        videoUrl: pick(MOOD_VIDEOS, idx),
        activity: interest.fr,
        interest: interest.id,
        city: city.city,
        zone,
        placeName: pick(city.venues, idx),
        address: `${zone}, ${city.city}`,
        latitude: jitter(city.lat, idx, 0.02),
        longitude: jitter(city.lng, idx + 2, 0.02),
        kind: "MOOD" as const,
        visibility: "PUBLIC" as const,
        expiresAt: null as Date | null,
      };
    });
    await prisma.mood.createMany({ data: moodRows });
  }

  const statusCount = await prisma.mood.count({ where: { body: { startsWith: "W · S" } } });
  if (statusCount < STATUS_TARGET) {
    const start = statusCount;
    const statusRows = Array.from({ length: STATUS_TARGET - start }, (_, offset) => {
      const idx = start + offset;
      const city = pick(cities, idx + 19);
      const zone = city.zones[idx % city.zones.length]!;
      return {
        authorId: userIds[(idx + 40) % userIds.length]!,
        body: `W · S${idx + 1} ${pick(POST_BODIES, idx)} ${city.city}`,
        imageUrl: pick(MOOD_PHOTOS, idx),
        activity: pick(MOOD_INTERESTS, idx + 4).fr,
        city: city.city,
        zone,
        latitude: jitter(city.lat, idx + 3, 0.02),
        longitude: jitter(city.lng, idx + 6, 0.02),
        kind: "STATUS" as const,
        visibility: "FOLLOWERS" as const,
        expiresAt: statusExpiresAt(new Date(now - (idx % 8) * 3600_000)),
      };
    });
    await prisma.mood.createMany({ data: statusRows });
  }

  const ticketCount = await prisma.ticket.count({
    where: { event: { title: { startsWith: EVENT_PREFIX } } },
  });
  if (ticketCount < 120 && worldEvents.length) {
    const slice = worldEvents.slice(0, 120);
    const reservations = slice.map((event, i) => ({
      eventId: event.id,
      bookerId: userIds[i % userIds.length]!,
      seats: 1,
      status: "CONFIRMED" as const,
      amountXaf: 0,
      currency: event.currency,
    }));
    await prisma.reservation.createMany({ data: reservations });
    const reserved = await prisma.reservation.findMany({
      where: { eventId: { in: slice.map((e) => e.id) }, bookerId: { in: userIds } },
      select: { id: true, eventId: true, bookerId: true },
    });
    await prisma.ticket.createMany({
      data: reserved.map((r) => ({
        reservationId: r.id,
        eventId: r.eventId,
        holderId: r.bookerId,
        status: "CONFIRMED" as const,
      })),
    });
    await prisma.eventParticipant.createMany({
      data: reserved
        .filter((r) => r.bookerId !== worldEvents.find((e) => e.id === r.eventId)?.hostId)
        .map((r) => ({ eventId: r.eventId, userId: r.bookerId, status: "RESERVED" as const })),
      skipDuplicates: true,
    });
  }

  await ensureDemoTicket(prisma);
  await ensureCesarWorldTickets(prisma, cesar?.id ?? null);
  await backfillEventCoords(prisma);

  const [users, events, posts, moods, statuses] = await Promise.all([
    prisma.user.count(),
    prisma.event.count(),
    prisma.post.count(),
    prisma.mood.count({ where: { kind: "MOOD" } }),
    prisma.mood.count({ where: { kind: "STATUS" } }),
  ]);
  console.log(
    `Seed world OK — ${users} users, ${events} events, ${posts} posts, ${moods} moods, ${statuses} statuts`,
  );
}

async function backfillEventCoords(prisma: PrismaClient) {
  const missing = await prisma.event.findMany({
    where: { latitude: null },
    select: { id: true, city: true, zone: true, venue: true, address: true },
  });
  for (const event of missing) {
    const c = cityCoords(event.city);
    if (!c) continue;
    await prisma.event.update({
      where: { id: event.id },
      data: {
        latitude: jitter(c.lat, event.id.length, 0.01),
        longitude: jitter(c.lng, event.id.length + 3, 0.01),
        address: event.address ?? [event.venue, event.zone, event.city].filter(Boolean).join(", "),
      },
    });
  }
}

async function ensureCesarWorldTickets(prisma: PrismaClient, cesarId: string | null) {
  if (!cesarId) return;
  const picks = await prisma.event.findMany({
    where: {
      title: { startsWith: EVENT_PREFIX },
      city: { in: ["Paris", "Lagos", "New York", "Tokyo"] },
    },
    orderBy: { startsAt: "asc" },
    take: 4,
    select: { id: true, currency: true, hostId: true },
  });
  for (const event of picks) {
    await upsertConfirmedTicket(prisma, event.id, cesarId, event.currency);
    if (event.hostId !== cesarId) {
      await prisma.eventParticipant.upsert({
        where: { eventId_userId: { eventId: event.id, userId: cesarId } },
        create: { eventId: event.id, userId: cesarId, status: "RESERVED" },
        update: {},
      });
    }
  }
}

async function upsertConfirmedTicket(
  prisma: PrismaClient,
  eventId: string,
  userId: string,
  currency: string,
) {
  let reservation = await prisma.reservation.findFirst({
    where: { eventId, bookerId: userId },
  });
  if (!reservation) {
    reservation = await prisma.reservation.create({
      data: { eventId, bookerId: userId, seats: 1, status: "CONFIRMED", amountXaf: 0, currency },
    });
  } else if (reservation.status !== "CONFIRMED") {
    reservation = await prisma.reservation.update({
      where: { id: reservation.id },
      data: { status: "CONFIRMED" },
    });
  }
  const existing = await prisma.ticket.findFirst({ where: { reservationId: reservation.id } });
  if (!existing) {
    await prisma.ticket.create({
      data: { reservationId: reservation.id, eventId, holderId: userId, status: "CONFIRMED" },
    });
  } else if (existing.status !== "CONFIRMED") {
    await prisma.ticket.update({ where: { id: existing.id }, data: { status: "CONFIRMED" } });
  }
}

async function ensureDemoTicket(prisma: PrismaClient) {
  const cesar = await prisma.user.findUnique({
    where: { phoneE164: CESAR_PHONE },
    select: { id: true },
  });
  if (!cesar) return;
  const yaounde = cityCoords("Yaoundé") ?? { lat: 3.868, lng: 11.5214 };
  const title = "Tonight Live — Bastos";
  const startsAt = new Date(Date.now() + 40 * 60_000);
  const endsAt = new Date(Date.now() + 5 * 3600_000);
  let event = await prisma.event.findFirst({ where: { title } });
  if (!event) {
    event = await prisma.event.create({
      data: {
        title,
        description: "Set live ce soir à Bastos. Ton billet TipTop est déjà confirmé.",
        imageUrl: "/seed/events/live.jpg",
        city: "Yaoundé",
        venue: "Bastos Live Hall",
        zone: "Bastos",
        address: "Rue 1.742, Bastos, Yaoundé",
        latitude: yaounde.lat,
        longitude: yaounde.lng,
        startsAt,
        endsAt,
        capacity: 240,
        hostId: cesar.id,
        priceXaf: 0,
        currency: "XAF",
        minAge: 18,
        requiresReservation: true,
      },
    });
  } else {
    event = await prisma.event.update({
      where: { id: event.id },
      data: {
        startsAt,
        endsAt,
        address: "Rue 1.742, Bastos, Yaoundé",
        latitude: yaounde.lat,
        longitude: yaounde.lng,
        venue: "Bastos Live Hall",
        zone: "Bastos",
        imageUrl: event.imageUrl ?? "/seed/events/live.jpg",
      },
    });
  }

  await prisma.eventParticipant.upsert({
    where: { eventId_userId: { eventId: event.id, userId: cesar.id } },
    create: { eventId: event.id, userId: cesar.id, status: "HOST" },
    update: { status: "HOST" },
  });
  await upsertConfirmedTicket(prisma, event.id, cesar.id, "XAF");
}
