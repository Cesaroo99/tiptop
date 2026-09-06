import { PrismaService } from "../prisma.service";

/** Personnes à masquer des deux côtés d’un blocage. */
export async function viewerHiddenIds(prisma: PrismaService, viewerId: string): Promise<Set<string>> {
  const rows = await prisma.userBlock.findMany({
    where: { OR: [{ blockerId: viewerId }, { blockedId: viewerId }] },
    select: { blockerId: true, blockedId: true },
  });
  const hide = new Set<string>();
  for (const row of rows) {
    hide.add(row.blockerId === viewerId ? row.blockedId : row.blockerId);
  }
  return hide;
}

/** Contacts TipTop (amis) + comptes suivis. Pas les contacts téléphone. */
export async function viewerNetwork(prisma: PrismaService, viewerId: string) {
  const [follows, contacts] = await Promise.all([
    prisma.follow.findMany({ where: { followerId: viewerId }, select: { followeeId: true } }),
    prisma.contact.findMany({ where: { ownerId: viewerId }, select: { personId: true } }),
  ]);
  const followIds = new Set(follows.map((row) => row.followeeId));
  const friendIds = new Set(contacts.map((row) => row.personId));
  return {
    followIds,
    friendIds,
    networkIds: new Set([...followIds, ...friendIds]),
  };
}
