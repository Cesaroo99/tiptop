import { LikeUnitSource, PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const availableUntil = new Date(Date.now() + 7 * 24 * 3600_000);

  const cesar = await prisma.user.upsert({
    where: { phoneE164: "+237695214785" },
    update: { role: UserRole.ADMIN, theme: "light", currency: "CAD" },
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
      currency: "CAD",
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
      likeUnits: { create: [{ source: LikeUnitSource.FREE }] },
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

  await prisma.follow.upsert({
    where: { followerId_followeeId: { followerId: cesar.id, followeeId: erica.id } },
    update: {},
    create: { followerId: cesar.id, followeeId: erica.id },
  });

  const existing = await prisma.post.count({ where: { authorId: cesar.id } });
  if (existing === 0) {
    await prisma.post.create({
      data: {
        authorId: cesar.id,
        body: "Un tour au Black&White : on se retrouve ce soir, on sort vraiment. 🥳💎",
        city: "Yaoundé",
        zone: "Carrefour Damas",
        imageUrl: "/seed/events/black-white.jpg",
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

  console.log("[seed-demo] César + Erica prêts");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
