# Environnement TipTop

## Prérequis

- Node 20+
- pnpm
- PostgreSQL 16
- Redis (optionnel en Phase 1, prévu pour rate-limit / présence)

## Local

```bash
cp .env.example .env   # déjà adapté en dev
# Docker si disponible :
docker compose up -d postgres redis

pnpm install
cd apps/api && pnpm prisma generate && pnpm prisma migrate dev
pnpm db:seed
pnpm dev:api   # :3001
pnpm dev:web   # :3000
```

Playwright (Phase 8) : `pnpm --filter @tiptop/e2e install:browsers` puis `pnpm test:e2e`. Réutilise les deux serveurs s’ils tournent.

## Variables

Voir `.env.example`. Ne jamais committer de secrets de production.

## Comptes de démo

| Téléphone | OTP | Profil |
| --- | --- | --- |
| +237 695 21 47 85 | 1234 | César Memoli (seed) |
| tout autre +237 valide 9 chiffres | 1234 | onboarding |

## Production

- `NODE_ENV=production` désactive le code OTP mock (SMS provider à brancher)
- `SESSION_SECRET` long et unique
- HTTPS pour cookies `Secure`
- `DATABASE_URL` managée
