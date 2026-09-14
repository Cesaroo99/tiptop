# TipTop Command Center — setup

L’admin n’est **pas** une application séparée : c’est le même Next.js (`apps/web`) sous `/admin`, protégé par session cookie + rôle staff + permissions serveur.

## Accès

1. Compte staff (`ADMIN`, `MODERATOR`, `FINANCE_ADMIN`, `SUPPORT_ADMIN`, `CONTENT_ADMIN`, `ANALYTICS_ADMIN`, `TECH_ADMIN`).
2. OTP téléphone (démo : `+237 695 21 47 85` / `cesar_memoli` / code `1234` si `OTP_ALLOW_MOCK=1`).
3. Ouvrir `/admin` ou l’hôte `admin.*` (rewrite middleware).

Un utilisateur `USER` reçoit `403 ADMIN_ONLY` sur `/api/admin/*`. Les boutons UI ne font pas foi : chaque action sensible est re-vérifiée dans Nest.

## Démarrage local

```bash
pnpm install
# poser DATABASE_URL dans apps/api/.env (voir ENVIRONMENT_VARIABLES.md)
pnpm --filter @tiptop/api prisma:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Puis http://localhost:3000/admin

## Compte démo protégé

`cesar_memoli` / `+237695214785` ne peut pas être bloqué ni rétrogradé depuis l’admin.
