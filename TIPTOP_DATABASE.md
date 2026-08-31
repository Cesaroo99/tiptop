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
