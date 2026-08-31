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

  const existing = await prisma.post.count({ where: { authorId: cesar.id } });
  if (existing === 0) {
    await prisma.post.create({
      data: {
        authorId: cesar.id,
        body: "Un tour au Black&White : on se retrouve ce soir, on sort vraiment. 🥳💎",
        city: "Yaoundé",
        zone: "Carrefour Damas",
        imageUrl: "/seed/black-white.svg",
      },
    });
    await prisma.post.create({
      data: {
        authorId: erica.id,
        body: "Mood du jour à Yaoundé — qui est dispo pour une vraie sortie ?",
        city: "Yaoundé",
        zone: "Bastos",
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
