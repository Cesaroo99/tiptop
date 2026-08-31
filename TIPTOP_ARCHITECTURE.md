# Architecture TipTop — Phase 1

## Vue d’ensemble

```
apps/web     Next.js 15 (App Router) — UI mobile-first + desktop
apps/api     NestJS — REST /api, Prisma, sessions
packages/domain   Règles pures (téléphone, OTP, likes)
packages/i18n     FR / EN
```

Le client web appelle `/api/*` (rewrite Next → Nest) **et** envoie `Authorization: Bearer` pour rester robuste en cross-origin.

## Découpage

| Couche | Emplacement | Interdit |
| --- | --- | --- |
| UI | `apps/web/app`, `components` | logique métier likes/tickets |
| Session / i18n / thème | `apps/web/lib` | secrets |
| HTTP | `apps/api/src/*` | JSX |
| Règles testables | `packages/domain` | I/O |
| Persistance | Prisma `apps/api/prisma` | |

## Monde réel (Phase 3)

- `PATCH /api/users/me` — disponibilité + TTL, zone, précision
- `GET /api/discovery/people` — carousel personnes disponibles
- `GET /api/geo/zones` — catalogue Yaoundé
- `POST|GET /api/events` — création + fil Tous / Mes
- `POST /api/events/:id/interested` + coup de cœur transférable
- `POST|GET /api/moods` — TTL max 24 h
- `POST /api/invitations` + accept/refuse (gratuit réel ; payant = honnête Phase 4)
- `GET /api/favorites`, `GET /api/contacts`

## Social (Phase 2)

- `POST /api/posts` — publication texte + lieu + image `/seed/*`
- `GET|POST /api/posts/:id/comments`
- `POST|DELETE /api/users/:id/follow`
- `POST|DELETE /api/users/:id/like` — unités transférables, `confirmTransfer` si besoin
- `GET /api/search?q=&type=`
- `GET /api/notifications` + lecture
- `GET /api/profiles/:username`

## Auth

1. `POST /api/auth/otp/request` — crée un challenge, SMS mock (log + code `1234` hors prod).
2. `POST /api/auth/otp/verify` — cookie httpOnly + token JSON.
3. `GET /api/auth/me` — SessionGuard (cookie ou Bearer).
4. `POST /api/auth/logout` — révoque la session.

## Thème

Variables CSS `--bg`, `--surface`, `--accent`, etc. `data-theme="dark"|"light"` sur `<html>`. Aucune couleur métier hardcodée dans la logique.

## Mobile natif

Non scaffoldé en Phase 1 (pas de simulateur fiable ici). Le web est le client mobile-first fidèle aux maquettes. Expo viendra en phase communication / après fondations stables.

## Services mock

| Port | Implémentation Phase 1 |
| --- | --- |
| SMS / OTP | `OTP_MOCK_CODE` |
| Paiement | non branché (écrans « phase suivante ») |
| Push | non branché |
| Stockage | fichiers `public/` |
