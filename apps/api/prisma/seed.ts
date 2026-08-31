import { PrismaClient, LikeUnitSource } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
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

  await prisma.appConfig.upsert({
    where: { key: "influencerThresholdLikesPerHour" },
    update: { value: 50 },
    create: { key: "influencerThresholdLikesPerHour", value: 50 },
  });

  console.log("Seed OK — OTP mock 1234, démo César +237 695 21 47 85");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect().then(() => process.exit(1));
  });
