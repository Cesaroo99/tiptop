import { PrismaClient, LikeUnitSource, UserRole, ReportKind, ReportReason } from "@prisma/client";
import { invitationExpiresAt, directKey, crossedMilestones, DEFAULT_LIKE_MILESTONES, sumLikeSeconds } from "@tiptop/domain";

const prisma = new PrismaClient();

async function main() {
  const availableUntil = new Date(Date.now() + 7 * 24 * 3600_000);
  const cesar = await prisma.user.upsert({
    where: { phoneE164: "+237695214785" },
    update: { role: UserRole.ADMIN, theme: "light" },
    create: {
      phoneE164: "+237695214785",
      phoneCountry: "CM",
      username: "cesar_memoli",
      firstName: "César",
      lastName: "Memoli",
      certified: true,
      role: UserRole.ADMIN,
      profileCompleted: true,
      locale: "fr",
      theme: "light",
      profile: {
        create: {
          profession: "Fondateur TipTop",
          city: "Yaoundé",
          zone: "Carrefour Damas",
          country: "CM",
          availability: "AVAILABLE",
          availabilityUntil: availableUntil,
          locationPrecision: "ZONE",
          birthDate: new Date("1994-03-12"),
          latitude: 3.848,
          longitude: 11.5021,
        },
      },
      likeUnits: {
        create: [{ source: LikeUnitSource.FREE }],
      },
    },
  });

  const erica = await prisma.user.upsert({
    where: { phoneE164: "+237690000001" },
    update: {},
    create: {
      phoneE164: "+237690000001",
      username: "erica.sinclair",
      firstName: "Erica",
      lastName: "Sinclair",
      certified: true,
      profileCompleted: true,
      profile: {
        create: {
          profession: "Photographer | videographer",
          city: "Yaoundé",
          zone: "Bastos",
          availability: "AVAILABLE",
          availabilityUntil: availableUntil,
          locationPrecision: "ZONE",
          birthDate: new Date("1996-07-22"),
          latitude: 3.89,
          longitude: 11.512,
        },
      },
      likeUnits: { create: [{ source: LikeUnitSource.FREE }] },
    },
  });

  const mbelle = await prisma.user.upsert({
    where: { phoneE164: "+237690000002" },
    update: {},
    create: {
      phoneE164: "+237690000002",
      username: "mbelle.junior",
      firstName: "Mbelle",
      lastName: "Junior",
      profileCompleted: true,
      profile: {
        create: {
          profession: "Organisateur",
          city: "Yaoundé",
          zone: "Odza",
          availability: "AVAILABLE",
          availabilityUntil: availableUntil,
          locationPrecision: "ZONE",
          birthDate: new Date("1992-11-05"),
          latitude: 3.8,
          longitude: 11.54,
        },
      },
      likeUnits: { create: [{ source: LikeUnitSource.FREE }] },
    },
  });

  const existing = await prisma.post.count({ where: { authorId: cesar.id } });
  let cesarPostId: string | undefined;
  if (existing === 0) {
    const p1 = await prisma.post.create({
      data: {
        authorId: cesar.id,
        body: "Un tour au Black&White : on se retrouve ce soir, on sort vraiment. 🥳💎",
        city: "Yaoundé",
        zone: "Carrefour Damas",
        imageUrl: "/seed/events/black-white.jpg",
      },
    });
    cesarPostId = p1.id;
    await prisma.post.create({
      data: {
        authorId: erica.id,
        body: "Mood du jour à Yaoundé — qui est dispo pour une vraie sortie ?",
        city: "Yaoundé",
        zone: "Bastos",
      },
    });
  } else {
    const first = await prisma.post.findFirst({ where: { authorId: cesar.id } });
    cesarPostId = first?.id;
  }

  if (cesarPostId) {
    const commentCount = await prisma.comment.count({ where: { postId: cesarPostId } });
    if (commentCount === 0) {
      await prisma.comment.create({
        data: {
          postId: cesarPostId,
          authorId: erica.id,
          body: "J’y serai — on se retrouve à l’entrée.",
        },
      });
    }
  }

  await prisma.follow.upsert({
    where: { followerId_followeeId: { followerId: cesar.id, followeeId: erica.id } },
    update: {},
    create: { followerId: cesar.id, followeeId: erica.id },
  });
  await prisma.follow.upsert({
    where: { followerId_followeeId: { followerId: mbelle.id, followeeId: cesar.id } },
    update: {},
    create: { followerId: mbelle.id, followeeId: cesar.id },
  });

  const notifCount = await prisma.notification.count({ where: { userId: cesar.id } });
  if (notifCount === 0) {
    await prisma.notification.create({
      data: {
        userId: cesar.id,
        actorId: erica.id,
        type: "COMMENT",
        entityType: "post",
        entityId: cesarPostId,
      },
    });
    await prisma.notification.create({
      data: {
        userId: cesar.id,
        actorId: mbelle.id,
        type: "FOLLOW",
        entityType: "user",
        entityId: cesar.id,
      },
    });
  }

  await prisma.profile.update({
    where: { userId: cesar.id },
    data: {
      availability: "AVAILABLE",
      availabilityUntil: availableUntil,
      locationPrecision: "ZONE",
      birthDate: new Date("1994-03-12"),
      city: "Yaoundé",
      zone: "Carrefour Damas",
      latitude: 3.848,
      longitude: 11.5021,
      bio: "On sort vraiment. Fondateur TipTop, Yaoundé.",
      avatarUrl: "/seed/avatars/cesar.jpg",
      coverUrl: "/seed/covers/night.jpg",
      website: "tiptop.cm",
    },
  });
  await prisma.profile.update({
    where: { userId: erica.id },
    data: {
      availability: "AVAILABLE",
      availabilityUntil: availableUntil,
      locationPrecision: "ZONE",
      birthDate: new Date("1996-07-22"),
      city: "Yaoundé",
      zone: "Bastos",
      latitude: 3.89,
      longitude: 11.512,
      bio: "Lumière, rumba, rooftops. Photographe à Bastos.",
      avatarUrl: "/seed/avatars/erica.jpg",
      coverUrl: "/seed/covers/crowd.jpg",
      website: "behance.net/ericasinclair",
      profession: "Photographer | videographer",
    },
  });
  await prisma.profile.update({
    where: { userId: mbelle.id },
    data: {
      availability: "AVAILABLE",
      availabilityUntil: availableUntil,
      locationPrecision: "ZONE",
      birthDate: new Date("1992-11-05"),
      city: "Yaoundé",
      zone: "Odza",
      latitude: 3.8,
      longitude: 11.54,
      bio: "J’organise des sorties pour qu’on se voie IRL.",
      avatarUrl: "/seed/avatars/mbelle.jpg",
      coverUrl: "/seed/covers/rooftop.jpg",
      profession: "Organisateur",
    },
  });

  const afterworkAt = new Date(Date.now() + 90 * 60_000);
  const brunchAt = new Date(Date.now() + 26 * 3600_000);
  const blackAt = new Date(Date.now() + 4 * 3600_000);

  let black = await prisma.event.findFirst({ where: { hostId: cesar.id, title: "Soirée Black & White" } });
  if (!black) {
    black = await prisma.event.create({
      data: {
        hostId: cesar.id,
        title: "Soirée Black & White",
        description: "On sort vraiment — tenues noires et blanches, Carrefour Damas.",
        imageUrl: "/seed/events/black-white.jpg",
        city: "Yaoundé",
        zone: "Carrefour Damas",
        venue: "Black&White",
        startsAt: blackAt,
        endsAt: new Date(blackAt.getTime() + 4 * 3600_000),
        priceXaf: 0,
        capacity: 40,
        minAge: 18,
        requiresReservation: false,
        participants: { create: { userId: cesar.id, status: "HOST" } },
      },
    });
    await prisma.post.create({
      data: {
        authorId: cesar.id,
        body: "Soirée Black & White — on se retrouve à Damas.",
        city: "Yaoundé",
        zone: "Carrefour Damas",
        imageUrl: "/seed/events/black-white.jpg",
        eventId: black.id,
      },
    });
  }

  let paid = await prisma.event.findFirst({ where: { hostId: erica.id, title: "Afterwork Bastos" } });
  if (!paid) {
    paid = await prisma.event.create({
      data: {
        hostId: erica.id,
        title: "Afterwork Bastos",
        description: "Afterwork photo + rooftop. Entrée 2 500 FCFA — paiement mock.",
        imageUrl: "/seed/events/afterwork.jpg",
        city: "Yaoundé",
        zone: "Bastos",
        venue: "Rooftop Bastos",
        startsAt: afterworkAt,
        endsAt: new Date(afterworkAt.getTime() + 4 * 3600_000),
        priceXaf: 2500,
        capacity: 25,
        minAge: 18,
        requiresReservation: true,
        participants: { create: { userId: erica.id, status: "HOST" } },
      },
    });
  }

  let picnic = await prisma.event.findFirst({ where: { hostId: mbelle.id, title: "Brunch Odza" } });
  if (!picnic) {
    picnic = await prisma.event.create({
      data: {
        hostId: mbelle.id,
        title: "Brunch Odza",
        description: "Brunch gratuit, places limitées. On se voit IRL.",
        imageUrl: "/seed/events/brunch.jpg",
        city: "Yaoundé",
        zone: "Odza",
        venue: "Jardin Odza",
        startsAt: brunchAt,
        priceXaf: 0,
        capacity: 12,
        requiresReservation: true,
        participants: { create: { userId: mbelle.id, status: "HOST" } },
      },
    });
  }

  const moodCount = await prisma.mood.count({ where: { authorId: erica.id } });
  if (moodCount === 0) {
    await prisma.mood.create({
      data: {
        authorId: erica.id,
        body: "Lumière de Bastos — qui sort ce soir ?",
        imageUrl: "/seed/moods/bastos.jpg",
        visibility: "ZONE",
        expiresAt: new Date(Date.now() + 20 * 3600_000),
      },
    });
  }

  const inviteCount = await prisma.invitation.count({ where: { inviteeId: cesar.id } });
  if (inviteCount === 0 && picnic) {
    const invitation = await prisma.invitation.create({
      data: {
        eventId: picnic.id,
        inviterId: mbelle.id,
        inviteeId: cesar.id,
        payer: "FREE",
        expiresAt: invitationExpiresAt(new Date()),
      },
    });
    await prisma.notification.create({
      data: {
        userId: cesar.id,
        actorId: mbelle.id,
        type: "INVITE",
        entityType: "invitation",
        entityId: invitation.id,
      },
    });
  }

  if (black) {
    await prisma.event.update({
      where: { id: black.id },
      data: { startsAt: blackAt, endsAt: new Date(blackAt.getTime() + 4 * 3600_000), imageUrl: "/seed/events/black-white.jpg" },
    });
  }
  if (paid) {
    await prisma.event.update({
      where: { id: paid.id },
      data: {
        startsAt: afterworkAt,
        endsAt: new Date(afterworkAt.getTime() + 4 * 3600_000),
        description: "Afterwork photo + rooftop. Entrée 2 500 FCFA — paiement mock.",
        imageUrl: "/seed/events/afterwork.jpg",
      },
    });
  }
  if (picnic) {
    await prisma.event.update({
      where: { id: picnic.id },
      data: { startsAt: brunchAt, imageUrl: "/seed/events/brunch.jpg" },
    });
  }

  const methodCount = await prisma.paymentMethod.count({ where: { userId: cesar.id } });
  if (methodCount === 0) {
    await prisma.paymentMethod.createMany({
      data: [
        { userId: cesar.id, provider: "CARD", label: "Visa •• 4242" },
        { userId: cesar.id, provider: "ORANGE_MONEY", label: "Orange Money •• 4785" },
        { userId: cesar.id, provider: "MTN_MOMO", label: "MTN MoMo •• 4785" },
      ],
    });
  }

  await prisma.contact.upsert({
    where: { ownerId_personId: { ownerId: cesar.id, personId: erica.id } },
    update: {},
    create: { ownerId: cesar.id, personId: erica.id },
  });
  await prisma.contact.upsert({
    where: { ownerId_personId: { ownerId: erica.id, personId: cesar.id } },
    update: {},
    create: { ownerId: erica.id, personId: cesar.id },
  });

  const dmKey = directKey(cesar.id, erica.id);
  let dm = await prisma.conversation.findUnique({ where: { directKey: dmKey } });
  if (!dm) {
    dm = await prisma.conversation.create({
      data: {
        kind: "DIRECT",
        directKey: dmKey,
        members: { create: [{ userId: cesar.id }, { userId: erica.id }] },
        messages: {
          create: [
            { senderId: erica.id, kind: "TEXT", body: "On se retrouve à Bastos ?" },
            { senderId: cesar.id, kind: "TEXT", body: "Oui — on sort vraiment, pas derrière l’écran." },
          ],
        },
      },
    });
  }

  if (black) {
    const group = await prisma.conversation.findUnique({ where: { eventId: black.id } });
    if (!group) {
      await prisma.conversation.create({
        data: {
          kind: "EVENT",
          eventId: black.id,
          title: black.title,
          members: { create: [{ userId: cesar.id }] },
          messages: {
            create: [{ senderId: cesar.id, kind: "TEXT", body: "Canal # Général — on se voit à Damas." }],
          },
        },
      });
    }
  }

  await prisma.pushPreference.upsert({
    where: { userId: cesar.id },
    update: {},
    create: { userId: cesar.id },
  });

  await prisma.appConfig.upsert({
    where: { key: "influencerThresholdLikesPerHour" },
    update: { value: 50 },
    create: { key: "influencerThresholdLikesPerHour", value: 50 },
  });

  const cesarPost = await prisma.post.findFirst({ where: { authorId: cesar.id } });
  if (cesarPost) {
    const existingReport = await prisma.report.findFirst({
      where: { reporterId: erica.id, postId: cesarPost.id },
    });
    if (!existingReport) {
      await prisma.report.create({
        data: {
          reporterId: erica.id,
          kind: ReportKind.POST,
          reason: ReportReason.SPAM,
          body: "Signalement de démo — contenu à vérifier.",
          postId: cesarPost.id,
          targetUserId: cesar.id,
        },
      });
    }
  }

  let past = await prisma.event.findFirst({ where: { title: "Rooftop Damas (passée)" } });
  if (!past) {
    const starts = new Date(Date.now() - 30 * 3600_000);
    const ends = new Date(Date.now() - 26 * 3600_000);
    past = await prisma.event.create({
      data: {
        hostId: mbelle.id,
        title: "Rooftop Damas (passée)",
        description: "Sortie déjà vécue — ticket validé, avis 24 h après la fin.",
        imageUrl: "/seed/events/rooftop.jpg",
        city: "Yaoundé",
        zone: "Carrefour Damas",
        venue: "Rooftop Damas",
        startsAt: starts,
        endsAt: ends,
        priceXaf: 0,
        status: "ENDED",
        requiresReservation: true,
        participants: {
          create: [
            { userId: mbelle.id, status: "HOST" },
            { userId: cesar.id, status: "PRESENT" },
            { userId: erica.id, status: "PRESENT" },
          ],
        },
      },
    });
    await prisma.reservation.create({
      data: {
        eventId: past.id,
        bookerId: cesar.id,
        status: "CONFIRMED",
        seats: 1,
        tickets: {
          create: { eventId: past.id, holderId: cesar.id, status: "CONSUMED", consumedAt: ends },
        },
      },
    });
    await prisma.reservation.create({
      data: {
        eventId: past.id,
        bookerId: erica.id,
        status: "CONFIRMED",
        seats: 1,
        tickets: {
          create: { eventId: past.id, holderId: erica.id, status: "CONSUMED", consumedAt: ends },
        },
      },
    });
    await prisma.eventReview.create({
      data: {
        eventId: past.id,
        authorId: erica.id,
        body: "Belle lumière, on a vraiment sorti. Merci Mbelle.",
        rating: 5,
      },
    });
    await prisma.notification.create({
      data: {
        userId: cesar.id,
        actorId: mbelle.id,
        type: "REVIEW",
        entityType: "event",
        entityId: past.id,
      },
    });
  }

  await enrichLivingWorld(prisma, { cesar, erica, mbelle, availableUntil });

  console.log("Seed OK — OTP mock 1234, démo César admin +237 695 21 47 85");
}

type SeedUser = { id: string };

async function ensureOnePersonalLike(db: PrismaClient, userId: string) {
  const units = await db.likeUnit.findMany({
    where: { ownerId: userId },
    include: { allocations: { where: { releasedAt: null } } },
    orderBy: { createdAt: "asc" },
  });
  const personal = units.filter((u) => u.source === "FREE" || u.source === "CERTIFIED_BONUS");
  if (personal.length === 0) {
    await db.likeUnit.create({ data: { ownerId: userId, source: LikeUnitSource.FREE } });
    return;
  }
  const keeper = personal.find((u) => u.source === "FREE") ?? personal[0];
  if (keeper.source !== "FREE") {
    await db.likeUnit.update({ where: { id: keeper.id }, data: { source: LikeUnitSource.FREE } });
  }
  for (const extra of personal.filter((u) => u.id !== keeper.id)) {
    await db.likeAllocation.updateMany({
      where: { unitId: extra.id, releasedAt: null },
      data: { releasedAt: new Date() },
    });
    await db.likeUnit.delete({ where: { id: extra.id } });
  }
}

async function placePersonalLike(db: PrismaClient, ownerId: string, toUserId: string, allocatedAt: Date) {
  await ensureOnePersonalLike(db, ownerId);
  const unit = await db.likeUnit.findFirst({
    where: { ownerId, source: LikeUnitSource.FREE },
    orderBy: { createdAt: "asc" },
  });
  if (!unit) return;
  const active = await db.likeAllocation.findFirst({
    where: { unitId: unit.id, releasedAt: null },
  });
  if (active?.toUserId === toUserId) {
    await db.likeAllocation.update({ where: { id: active.id }, data: { allocatedAt } });
    const open = await db.likePeriod.findFirst({ where: { unitId: unit.id, endedAt: null } });
    if (!open) {
      await db.likePeriod.create({
        data: {
          unitId: unit.id,
          actorId: ownerId,
          targetType: "USER",
          targetId: toUserId,
          beneficiaryUserId: toUserId,
          startedAt: allocatedAt,
          weight: 1,
        },
      });
    }
    return;
  }
  if (active) {
    await db.likeAllocation.update({
      where: { id: active.id },
      data: { releasedAt: allocatedAt },
    });
  }
  await db.likePeriod.updateMany({
    where: { unitId: unit.id, endedAt: null },
    data: { endedAt: allocatedAt },
  });
  await db.likeAllocation.create({
    data: { unitId: unit.id, toUserId, allocatedAt },
  });
  await db.likePeriod.create({
    data: {
      unitId: unit.id,
      actorId: ownerId,
      targetType: "USER",
      targetId: toUserId,
      beneficiaryUserId: toUserId,
      startedAt: allocatedAt,
      weight: 1,
    },
  });
}

async function enrichLivingWorld(
  db: PrismaClient,
  ctx: { cesar: SeedUser; erica: SeedUser; mbelle: SeedUser; availableUntil: Date },
) {
  const { cesar, erica, mbelle, availableUntil } = ctx;
  await db.post.deleteMany({ where: { body: { startsWith: "E2E " } } });
  await db.message.deleteMany({ where: { body: { startsWith: "E2E " } } });
  await db.post.updateMany({ where: { imageUrl: "/seed/black-white.svg" }, data: { imageUrl: "/seed/events/black-white.jpg" } });
  await db.event.updateMany({ where: { imageUrl: "/seed/black-white.svg" }, data: { imageUrl: "/seed/events/black-white.jpg" } });
  await db.mood.updateMany({ where: { imageUrl: "/seed/black-white.svg" }, data: { imageUrl: "/seed/moods/bastos.jpg" } });

  const extras = [
    {
      phone: "+237690000003",
      username: "onguene.landry",
      firstName: "Onguene",
      lastName: "Landry",
      profession: "Designer UI",
      city: "Yaoundé",
      zone: "Nlongkak",
      birth: "2002-04-18",
      lat: 3.875,
      lng: 11.512,
      avatar: "/seed/avatars/onguene.jpg",
      cover: "/seed/covers/city.jpg",
      bio: "Je dessine des interfaces, je vis les sorties.",
    },
    {
      phone: "+237690000004",
      username: "amina.ngo",
      firstName: "Amina",
      lastName: "Ngo",
      profession: "Avocate",
      city: "Yaoundé",
      zone: "Bastos",
      birth: "1998-09-03",
      lat: 3.888,
      lng: 11.51,
      avatar: "/seed/avatars/amina.jpg",
      cover: "/seed/covers/night.jpg",
      bio: "Après le palais, un rooftop. Toujours.",
    },
    {
      phone: "+237690000005",
      username: "jp.fouda",
      firstName: "Jean-Pierre",
      lastName: "Fouda",
      profession: "Chef",
      city: "Yaoundé",
      zone: "Mvog-Mbi",
      birth: "1993-01-14",
      lat: 3.85,
      lng: 11.52,
      avatar: "/seed/avatars/fouda.jpg",
      cover: "/seed/covers/rooftop.jpg",
      bio: "Brunch, ndolé, et des tables trop petites pour rester assis.",
    },
    {
      phone: "+237690000006",
      username: "nadege.atangana",
      firstName: "Nadège",
      lastName: "Atangana",
      profession: "Étudiante",
      city: "Yaoundé",
      zone: "Ngoa-Ekellé",
      birth: "2003-06-21",
      lat: 3.863,
      lng: 11.5,
      avatar: "/seed/avatars/nadege.jpg",
      cover: "/seed/covers/crowd.jpg",
      bio: "Campus le jour, Damas le soir.",
    },
    {
      phone: "+237690000007",
      username: "koffi.mensah",
      firstName: "Koffi",
      lastName: "Mensah",
      profession: "DJ",
      city: "Yaoundé",
      zone: "Melen",
      birth: "1995-12-02",
      lat: 3.86,
      lng: 11.49,
      avatar: "/seed/avatars/koffi.jpg",
      cover: "/seed/covers/night.jpg",
      bio: "Sets live, pas de playlist infinie derrière un écran.",
    },
    {
      phone: "+237690000008",
      username: "sarah.nkodo",
      firstName: "Sarah",
      lastName: "Nkodo",
      profession: "Infirmière",
      city: "Yaoundé",
      zone: "Mimboman",
      birth: "1999-08-11",
      lat: 3.87,
      lng: 11.55,
      avatar: "/seed/avatars/sarah.jpg",
      cover: "/seed/covers/city.jpg",
      bio: "Garde de nuit, afterwork le jeudi.",
    },
    {
      phone: "+237690000009",
      username: "alex.moullion",
      firstName: "Alex",
      lastName: "Moullion",
      profession: "Entrepreneur",
      city: "Yaoundé",
      zone: "Odza",
      birth: "1994-02-28",
      lat: 3.805,
      lng: 11.538,
      avatar: "/seed/avatars/alex.jpg",
      cover: "/seed/covers/rooftop.jpg",
      bio: "Piscine party, networking, et on range le téléphone.",
    },
    {
      phone: "+237690000010",
      username: "rachel.essomba",
      firstName: "Rachel",
      lastName: "Essomba",
      profession: "Community manager",
      city: "Yaoundé",
      zone: "Essos",
      birth: "1997-05-09",
      lat: 3.88,
      lng: 11.54,
      avatar: "/seed/avatars/rachel.jpg",
      cover: "/seed/covers/crowd.jpg",
      bio: "Je raconte Yaoundé. En vrai, pas en stories sans fin.",
    },
    {
      phone: "+237690000011",
      username: "william.ekani",
      firstName: "William",
      lastName: "Ekani",
      profession: "Footballeur amateur",
      city: "Yaoundé",
      zone: "Omnisports",
      birth: "1996-11-19",
      lat: 3.87,
      lng: 11.52,
      avatar: "/seed/avatars/william.jpg",
      cover: "/seed/covers/night.jpg",
      bio: "Match le samedi, bières ensuite. Simple.",
    },
    {
      phone: "+237690000012",
      username: "mireille.owona",
      firstName: "Mireille",
      lastName: "Owona",
      profession: "Styliste",
      city: "Yaoundé",
      zone: "Bastos",
      birth: "1998-03-30",
      lat: 3.892,
      lng: 11.508,
      avatar: "/seed/avatars/mireille.jpg",
      cover: "/seed/covers/crowd.jpg",
      bio: "Tenues Black & White et ndolè le dimanche.",
    },
  ];

  const people: Record<string, SeedUser> = {};
  for (const u of extras) {
    const row = await db.user.upsert({
      where: { phoneE164: u.phone },
      update: {
        firstName: u.firstName,
        lastName: u.lastName,
        profileCompleted: true,
      },
      create: {
        phoneE164: u.phone,
        phoneCountry: "CM",
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        certified: u.username === "alex.moullion",
        profileCompleted: true,
        profile: {
          create: {
            profession: u.profession,
            bio: u.bio,
            city: u.city,
            zone: u.zone,
            country: "CM",
            availability: "AVAILABLE",
            availabilityUntil: availableUntil,
            locationPrecision: "ZONE",
            birthDate: new Date(u.birth),
            latitude: u.lat,
            longitude: u.lng,
            avatarUrl: u.avatar,
            coverUrl: u.cover,
          },
        },
        likeUnits: { create: [{ source: LikeUnitSource.FREE }] },
      },
    });
    people[u.username] = row;
    await db.profile.update({
      where: { userId: row.id },
      data: {
        profession: u.profession,
        bio: u.bio,
        city: u.city,
        zone: u.zone,
        availability: "AVAILABLE",
        availabilityUntil: availableUntil,
        birthDate: new Date(u.birth),
        latitude: u.lat,
        longitude: u.lng,
        avatarUrl: u.avatar,
        coverUrl: u.cover,
      },
    });
  }

  const onguene = people["onguene.landry"];
  const amina = people["amina.ngo"];
  const fouda = people["jp.fouda"];
  const nadege = people["nadege.atangana"];
  const koffi = people["koffi.mensah"];
  const sarah = people["sarah.nkodo"];
  const alex = people["alex.moullion"];
  const rachel = people["rachel.essomba"];
  const william = people["william.ekani"];
  const mireille = people["mireille.owona"];
  if (!onguene || !amina || !fouda || !nadege || !koffi || !sarah || !alex || !rachel || !william || !mireille) return;

  const follows: Array<[string, string]> = [
    [cesar.id, onguene.id],
    [cesar.id, amina.id],
    [cesar.id, alex.id],
    [cesar.id, koffi.id],
    [erica.id, mireille.id],
    [erica.id, rachel.id],
    [mbelle.id, alex.id],
    [onguene.id, cesar.id],
    [amina.id, erica.id],
    [koffi.id, cesar.id],
    [alex.id, mbelle.id],
    [nadege.id, erica.id],
    [william.id, cesar.id],
    [mireille.id, erica.id],
    [sarah.id, amina.id],
    [rachel.id, cesar.id],
  ];
  for (const [a, b] of follows) {
    await db.follow.upsert({
      where: { followerId_followeeId: { followerId: a, followeeId: b } },
      update: {},
      create: { followerId: a, followeeId: b },
    });
  }

  const postsWanted = [
    { authorId: onguene.id, body: "Mood Damas — qui est chaud pour un afterwork sans écran ?", imageUrl: "/seed/posts/lights.jpg", city: "Yaoundé", zone: "Nlongkak" },
    { authorId: amina.id, body: "Plaidoirie le matin, rooftop Bastos le soir. Qui sort ?", imageUrl: "/seed/posts/rooftop.jpg", city: "Yaoundé", zone: "Bastos" },
    { authorId: fouda.id, body: "J’ai mis le ndolé au feu. Table de 8, Odza, on se voit IRL.", imageUrl: "/seed/posts/food.jpg", city: "Yaoundé", zone: "Mvog-Mbi" },
    { authorId: koffi.id, body: "Set live à Melen ce week-end. Pas de replay, faut venir.", imageUrl: "/seed/events/live.jpg", city: "Yaoundé", zone: "Melen" },
    { authorId: nadege.id, body: "Fin des partiels. Qui prend un jus à Ngoa-Ekellé ?", imageUrl: "/seed/posts/drinks.jpg", city: "Yaoundé", zone: "Ngoa-Ekellé" },
    { authorId: mireille.id, body: "Look Black & White prêt. On se retrouve à l’entrée.", imageUrl: "/seed/posts/friends.jpg", city: "Yaoundé", zone: "Bastos" },
    { authorId: rachel.id, body: "Yaoundé la nuit, c’est mieux dehors que dans le fil.", imageUrl: "/seed/covers/night.jpg", city: "Yaoundé", zone: "Essos" },
    { authorId: william.id, body: "Match à Omnisports puis bières. Places limitées, on se parle.", imageUrl: "/seed/posts/friends.jpg", city: "Yaoundé", zone: "Omnisports" },
  ];
  for (const p of postsWanted) {
    const exists = await db.post.findFirst({ where: { authorId: p.authorId, body: p.body } });
    if (!exists) await db.post.create({ data: p });
  }

  async function ensureEvent(title: string, data: Parameters<typeof db.event.create>[0]["data"]) {
    let e = await db.event.findFirst({ where: { title } });
    if (!e) e = await db.event.create({ data });
    else await db.event.update({ where: { id: e.id }, data: { imageUrl: data.imageUrl, description: data.description } });
    return e;
  }

  const piscineAt = new Date(Date.now() + 3 * 24 * 3600_000);
  const liveAt = new Date(Date.now() + 8 * 3600_000);
  const expoAt = new Date(Date.now() + 5 * 24 * 3600_000);

  const piscine = await ensureEvent("Piscine party - Odza, Yaoundé", {
    hostId: alex.id,
    title: "Piscine party - Odza, Yaoundé",
    description: "Bassin, dj set, -18. On se voit vraiment — pas un live Instagram.",
    imageUrl: "/seed/events/piscine.jpg",
    city: "Yaoundé",
    zone: "Odza",
    venue: "Villa Odza",
    startsAt: piscineAt,
    endsAt: new Date(piscineAt.getTime() + 6 * 3600_000),
    priceXaf: 5000,
    capacity: 40,
    minAge: 18,
    requiresReservation: true,
    participants: { create: { userId: alex.id, status: "HOST" } },
  });
  const live = await ensureEvent("Live session Melen", {
    hostId: koffi.id,
    title: "Live session Melen",
    description: "Set afro-house, entrée 1 500 FCFA. Paiement mock.",
    imageUrl: "/seed/events/live.jpg",
    city: "Yaoundé",
    zone: "Melen",
    venue: "Club Melen",
    startsAt: liveAt,
    endsAt: new Date(liveAt.getTime() + 5 * 3600_000),
    priceXaf: 1500,
    capacity: 80,
    minAge: 18,
    requiresReservation: true,
    participants: { create: { userId: koffi.id, status: "HOST" } },
  });
  await ensureEvent("Expo photo Hilton", {
    hostId: erica.id,
    title: "Expo photo Hilton",
    description: "Tirages Yaoundé nuit. Gratuit, places limitées.",
    imageUrl: "/seed/events/expo.jpg",
    city: "Yaoundé",
    zone: "Bastos",
    venue: "Hilton",
    startsAt: expoAt,
    priceXaf: 0,
    capacity: 60,
    requiresReservation: true,
    participants: { create: { userId: erica.id, status: "HOST" } },
  });

  for (const [eventId, userId, status] of [
    [piscine.id, cesar.id, "INTERESTED"],
    [piscine.id, erica.id, "INTERESTED"],
    [piscine.id, mireille.id, "RESERVED"],
    [live.id, nadege.id, "INTERESTED"],
    [live.id, william.id, "INTERESTED"],
    [live.id, cesar.id, "INTERESTED"],
  ] as Array<[string, string, "INTERESTED" | "RESERVED"]>) {
    await db.eventParticipant.upsert({
      where: { eventId_userId: { eventId, userId } },
      update: { status },
      create: { eventId, userId, status },
    });
  }

  const moodsWanted = [
    { authorId: koffi.id, body: "Soundcheck Melen — venez maintenant.", imageUrl: "/seed/moods/concert.jpg" },
    { authorId: amina.id, body: "Golden hour Bastos. Table dehors.", imageUrl: "/seed/moods/bastos.jpg" },
    { authorId: onguene.id, body: "Je suis dispo 4 h autour de Nlongkak.", imageUrl: "/seed/moods/street.jpg" },
    { authorId: alex.id, body: "Test lumière piscine Odza.", imageUrl: "/seed/events/piscine.jpg" },
  ];
  for (const m of moodsWanted) {
    const exists = await db.mood.findFirst({ where: { authorId: m.authorId, body: m.body } });
    if (!exists) {
      await db.mood.create({
        data: {
          ...m,
          visibility: "ZONE",
          expiresAt: new Date(Date.now() + 18 * 3600_000),
        },
      });
    }
  }

  const blackPost = await db.post.findFirst({ where: { authorId: cesar.id, body: { contains: "Black" } } });
  if (blackPost) {
    const comments = [
      { authorId: erica.id, body: "J’y serai — on se retrouve à l’entrée." },
      { authorId: mireille.id, body: "Tenue blanche, je confirme." },
      { authorId: koffi.id, body: "Je passe un set si vous voulez." },
      { authorId: onguene.id, body: "Carrefour Damas 23h, c’est noté." },
    ];
    for (const c of comments) {
      const hit = await db.comment.findFirst({ where: { postId: blackPost.id, authorId: c.authorId, body: c.body } });
      if (!hit) await db.comment.create({ data: { postId: blackPost.id, ...c } });
    }
  }

  for (const personId of [erica.id, mbelle.id, onguene.id, amina.id, alex.id, koffi.id, mireille.id]) {
    await db.contact.upsert({
      where: { ownerId_personId: { ownerId: cesar.id, personId } },
      update: {},
      create: { ownerId: cesar.id, personId },
    });
  }

  const extraNotifs = await db.notification.count({ where: { userId: cesar.id, type: "FOLLOW" } });
  if (extraNotifs < 4) {
    await db.notification.createMany({
      data: [
        { userId: cesar.id, actorId: onguene.id, type: "FOLLOW", entityType: "user", entityId: cesar.id },
        { userId: cesar.id, actorId: koffi.id, type: "FOLLOW", entityType: "user", entityId: cesar.id },
        { userId: cesar.id, actorId: amina.id, type: "LIKE", entityType: "user", entityId: cesar.id },
      ],
    });
  }

  const dmAminaKey = directKey(cesar.id, amina.id);
  const existingAmina = await db.conversation.findUnique({ where: { directKey: dmAminaKey } });
  if (!existingAmina) {
    await db.conversation.create({
      data: {
        kind: "DIRECT",
        directKey: dmAminaKey,
        members: { create: [{ userId: cesar.id }, { userId: amina.id }] },
        messages: {
          create: [
            { senderId: amina.id, kind: "TEXT", body: "Le rooftop Bastos, 19h, tu confirmes ?" },
            { senderId: cesar.id, kind: "TEXT", body: "Confirmé. On sort vraiment." },
          ],
        },
      },
    });
  }

  const everyone = [cesar, erica, mbelle, onguene, amina, fouda, nadege, koffi, sarah, alex, rachel, william, mireille];
  for (const person of everyone) {
    await ensureOnePersonalLike(db, person.id);
  }

  const now = Date.now();
  const placements: Array<[string, string, number]> = [
    [cesar.id, erica.id, 20 * 60_000],
    [erica.id, mireille.id, 2 * 3600_000],
    [mbelle.id, cesar.id, 45 * 60_000],
    [onguene.id, cesar.id, 10 * 60_000],
    [amina.id, erica.id, 8 * 60_000],
    [fouda.id, koffi.id, 26 * 3600_000],
    [nadege.id, erica.id, 3 * 3600_000],
    [koffi.id, cesar.id, 15 * 60_000],
    [sarah.id, amina.id, 6 * 3600_000],
    [alex.id, mbelle.id, 12 * 60_000],
    [rachel.id, cesar.id, 50 * 60_000],
    [william.id, cesar.id, 5 * 60_000],
    [mireille.id, erica.id, 90 * 60_000],
  ];
  for (const [fromId, toId, ago] of placements) {
    await placePersonalLike(db, fromId, toId, new Date(now - ago));
  }

  const cesarPost = await db.post.findFirst({ where: { authorId: cesar.id }, orderBy: { createdAt: "asc" } });
  const ericaUnit = await db.likeUnit.findFirst({ where: { ownerId: erica.id, source: "FREE" } });
  const mbelleUnit = await db.likeUnit.findFirst({ where: { ownerId: mbelle.id, source: "FREE" } });
  if (cesarPost && ericaUnit && mbelleUnit) {
    await db.likePeriod.deleteMany({ where: { targetType: "POST", targetId: cesarPost.id } });
    const t0 = new Date(now - 3 * 3600_000);
    await db.likePeriod.createMany({
      data: [
        {
          unitId: ericaUnit.id,
          actorId: erica.id,
          targetType: "POST",
          targetId: cesarPost.id,
          beneficiaryUserId: cesar.id,
          startedAt: t0,
          endedAt: new Date(t0.getTime() + 40 * 60_000),
          weight: 1,
        },
        {
          unitId: mbelleUnit.id,
          actorId: mbelle.id,
          targetType: "POST",
          targetId: cesarPost.id,
          beneficiaryUserId: cesar.id,
          startedAt: new Date(t0.getTime() + 30 * 60_000),
          endedAt: new Date(t0.getTime() + 40 * 60_000),
          weight: 1,
        },
      ],
    });
  }

  await db.wish.deleteMany({ where: { ownerId: { in: [erica.id, cesar.id, amina.id] } } });
  await db.wish.createMany({
    data: [
      { ownerId: erica.id, title: "Concert de musique", category: "EVENT", description: "Une soirée live à Yaoundé.", priority: "HIGH" },
      { ownerId: erica.id, title: "Restaurant japonais", category: "RESTAURANT", city: "Yaoundé", zone: "Bastos" },
      { ownerId: erica.id, title: "Casque audio", category: "GIFT", estimatedPriceXaf: 85000 },
      { ownerId: erica.id, title: "Week-end à Kribi", category: "TRAVEL", priority: "HIGH" },
      { ownerId: cesar.id, title: "Karting", category: "SPORT" },
      { ownerId: amina.id, title: "Café à Bastos", category: "PLACE", city: "Yaoundé", zone: "Bastos" },
    ],
  });

  const nowDate = new Date();
  for (const person of everyone) {
    const periods = await db.likePeriod.findMany({ where: { beneficiaryUserId: person.id } });
    const total = sumLikeSeconds(
      periods.map((p) => ({ startedAt: p.startedAt, endedAt: p.endedAt, weight: p.weight })),
      nowDate,
    ).totalSeconds;
    for (const m of crossedMilestones(0, total, DEFAULT_LIKE_MILESTONES)) {
      await db.userMilestone.upsert({
        where: { userId_milestoneId: { userId: person.id, milestoneId: m.id } },
        create: { userId: person.id, milestoneId: m.id, notifiedAt: nowDate },
        update: { notifiedAt: nowDate },
      });
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect().then(() => process.exit(1));
  });
