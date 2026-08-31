import { PrismaClient, LikeUnitSource } from "@prisma/client";
import { invitationExpiresAt } from "@tiptop/domain";

const prisma = new PrismaClient();

async function main() {
  const availableUntil = new Date(Date.now() + 7 * 24 * 3600_000);
  const cesar = await prisma.user.upsert({
    where: { phoneE164: "+237695214785" },
    update: {},
    create: {
      phoneE164: "+237695214785",
      phoneCountry: "CM",
      username: "cesar_memoli",
      firstName: "César",
      lastName: "Memoli",
      certified: true,
      profileCompleted: true,
      locale: "fr",
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
        create: [{ source: LikeUnitSource.FREE }, { source: LikeUnitSource.CERTIFIED_BONUS }],
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
      likeUnits: { create: [{ source: LikeUnitSource.FREE }, { source: LikeUnitSource.CERTIFIED_BONUS }] },
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
        imageUrl: "/seed/black-white.svg",
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
    },
  });

  const blackNight = new Date("2026-09-05T20:00:00+01:00");
  const afterwork = new Date("2026-09-08T18:30:00+01:00");
  const brunch = new Date("2026-09-06T11:00:00+01:00");

  let black = await prisma.event.findFirst({ where: { hostId: cesar.id, title: "Soirée Black & White" } });
  if (!black) {
    black = await prisma.event.create({
      data: {
        hostId: cesar.id,
        title: "Soirée Black & White",
        description: "On sort vraiment — tenues noires et blanches, Carrefour Damas.",
        imageUrl: "/seed/black-white.svg",
        city: "Yaoundé",
        zone: "Carrefour Damas",
        venue: "Black&White",
        startsAt: blackNight,
        endsAt: new Date(blackNight.getTime() + 4 * 3600_000),
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
        imageUrl: "/seed/black-white.svg",
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
        description: "Afterwork photo + rooftop. Entrée 2 500 FCFA — paiement en Phase 4.",
        city: "Yaoundé",
        zone: "Bastos",
        venue: "Rooftop Bastos",
        startsAt: afterwork,
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
        city: "Yaoundé",
        zone: "Odza",
        venue: "Jardin Odza",
        startsAt: brunch,
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
        imageUrl: "/seed/black-white.svg",
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

  await prisma.appConfig.upsert({
    where: { key: "influencerThresholdLikesPerHour" },
    update: { value: 50 },
    create: { key: "influencerThresholdLikesPerHour", value: 50 },
  });

  console.log("Seed OK — OTP mock 1234, démo César +237 695 21 47 85 — events + moods + invitation");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect().then(() => process.exit(1));
  });
