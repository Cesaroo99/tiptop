# Base de données TipTop

PostgreSQL 16. Schéma Prisma : `apps/api/prisma/schema.prisma`.

## Commandes

```bash
pnpm db:migrate    # à partir d’un schéma vide, utiliser prisma migrate
pnpm db:seed
pnpm db:reset      # destructif, local uniquement
```

## Tables Phase 1 réellement utilisées

- `User`, `Profile`, `Session`, `OtpChallenge`
- `LikeUnit` (créée à l’inscription : 1 unité, 2 si certifié en seed)
- `Post`, `Comment` (lecture feed)
- `AppConfig` (`influencerThresholdLikesPerHour`)

## Tables Phase 3

- `Event`, `EventParticipant`, `Invitation`, `EventHeart` (index unique actif par user)
- `Mood`, `MoodComment`, `Contact`
- `Post.eventId` optionnel (carte sortie dans le feed)
- `NotificationType.INVITE`

## Tables Phase 4

- `Reservation` (index unique partiel : une résa self active par `(eventId, bookerId)` si `invitationId IS NULL`)
- `Ticket` (conso atomique `CONFIRMED` + `consumed_at IS NULL`)
- `Payment` (`kind` RESERVATION | LIKE_PACK, `userId`, `reservationId` optionnel, `likePurchaseId` optionnel, `idempotencyKey` unique)
- `PaymentMethod` (Card / Orange Money / MTN MoMo — mock)
- `NotificationType.TICKET`, `NotificationType.PAYMENT`

## Tables Phase 5

- `Conversation` (`DIRECT` unique `directKey`, `EVENT` unique `eventId`, `GROUP`)
- `ConversationMember` (`lastReadAt`)
- `Message` (`TEXT` / `IMAGE` / `AUDIO`)
- `UserBlock`
- `PushPreference` + `Device` (unique `userId+platform`, `pushToken` optionnel)
- `NotificationType.MESSAGE`

## Tables Phase 6

- `LikePurchase` (pack, unités, montant XAF — pas le solde likes)
- `LikeTransaction` (PURCHASE / ALLOCATE / RELEASE) ; unique partiel un `PURCHASE` par `purchaseId`
- `LikeUnit.purchaseId` optionnel (`source = PURCHASED`)

## Tables / champs préparés

- `Device` (push)
- `LikeAllocation` (transferts)
- Enums disponibilité, précision de localisation, rôles

## Concurrence likes (Phase 2)

Une allocation active par `LikeUnit` sera garantie par index unique partiel SQL :

```sql
CREATE UNIQUE INDEX like_unit_one_active
  ON "LikeAllocation" ("unitId")
  WHERE "releasedAt" IS NULL;
```

Pas encore appliqué : pas d’API like en Phase 1.

## Seed

Compte démo : **César Memoli** `+237 695 21 47 85`, OTP **1234**.
Personnage fictif Erica Sinclair. Aucune donnée personnelle réelle.
