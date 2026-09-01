# Architecture TipTop

## Vue d’ensemble

```
apps/web     Next.js 15 (App Router) — UI mobile-first + desktop
apps/api     NestJS — REST /api, Prisma, sessions
apps/e2e     Playwright Chromium (P1, P2, P6, P11, admin, smokes)
packages/domain   Règles pures (téléphone, OTP, likes, tickets, admin…)
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
- `POST /api/invitations` + accept/refuse (gratuit + payant mock)
- `GET /api/favorites`, `GET /api/contacts`

## Booking (Phase 4)

- `POST|GET /api/reservations` — soi ± invités ; gratuit confirmé, payant `AWAITING_PAYMENT`
- `POST /api/payments` — mock Card / Orange Money / MTN MoMo, header `Idempotency-Key`
- `POST /api/payments/webhook` — public, ignore un statut déjà terminal
- `GET|POST /api/payments/methods` — moyens mock (aucun vrai débit)
- `GET /api/tickets` + `GET /api/tickets/:id` — QR `tt1.{id}.{exp}.{hmac16}` dans la fenêtre d’entrée
- `POST /api/tickets/scan` + `POST /api/tickets/:id/consume` — `UPDATE … WHERE status = CONFIRMED AND consumed_at IS NULL`
- `GET /api/events/:id/manage` — intéressés / réservés / validés (hôte)

Invitations payantes : hôte paie à l’envoi ; invité paie à l’acceptation.

## Communication (Phase 5)

- `GET|POST /api/conversations` — inbox, DM (`/direct`), groupe event (`/event`)
- `GET|POST /api/conversations/:id/messages` — texte, image `/seed/*`, vocale mock
- `POST /api/conversations/:id/read` + `POST /api/users/:id/block`
- WebSocket `/realtime` (Socket.IO) : `message`, `typing`, `presence`
- `POST /api/devices` + `GET|PATCH /api/push/preferences` — provider **no-op** (log, jamais d’envoi réel)

## Social (Phase 2)

- `POST /api/posts` — publication texte + lieu + image `/seed/*`
- `GET|POST /api/posts/:id/comments`
- `POST|DELETE /api/users/:id/follow`
- `POST|DELETE /api/users/:id/like` — unités transférables, `confirmTransfer` si besoin
- `GET /api/search?q=&type=`
- `GET /api/notifications` + lecture
- `GET /api/profiles/:username`

## Monétisation likes (Phase 6)

- `GET /api/likes/wallet` — solde disponible / total, allocations, historique `LikeTransaction`
- `GET /api/likes/packs` — +1 / +5 / +20 (D17)
- `POST /api/likes/purchase` — paiement mock Card / OM / MoMo ; ledger XAF (`Payment.kind = LIKE_PACK`) **séparé** du ledger likes
- Échec (`fail: true`) : paiement `FAILED`, **aucun** `LikeUnit` créé
- `POST /api/payments/webhook` — si pack likes, crédit idempotent (index unique un `PURCHASE` par achat)
- UI `/likes`, `/likes/buy` (G25), `/likes/success` ; like sans unité → achat ; transfert G23 propose aussi l’achat

## Admin (Phase 7)

- Rôles `ADMIN` / `MODERATOR` (`canAccessAdmin`) ; César seed = admin
- `GET /api/admin/overview|users|posts|events|payments|likes/anomalies|reports`
- `PATCH /api/admin/users/:id` — certifier, bloquer (révoque les sessions)
- `POST /api/admin/posts/:id/hide` — `Post.hiddenAt` (hors feed / recherche)
- `POST /api/admin/events/:id/cancel`
- `POST /api/admin/payments/:id/refund` — mock ledger XAF (`REFUNDED`) ; likes déjà crédités restent
- `POST /api/reports` — signalement user/post/event ; revue staff
- UI `/admin/*` ; 403 pour un compte non staff

## Avis (Phase 9)

- `GET /api/events/:id/reviews` + `GET /api/events/:id/reviews/gate` + `POST /api/events/:id/reviews`
- `GET /api/reviews/pending` — sorties vécues dont la fenêtre 24 h est ouverte
- Règles : `packages/domain/src/reviews.ts` (hôte exclu, ticket `CONSUMED` ou `PRESENT`)
- Amies → Message ouvre `POST /api/conversations/direct` (plus de modal « plus tard »)

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
| Paiement | mock isolé Card / OM / MoMo — `fail: true` pour G15 |
| Push | no-op : jeton stocké, log `[push:noop]`, aucun envoi |
| Stockage | fichiers `public/` |

## QA (Phase 8)

- Unitaires : `packages/domain`, HMAC `apps/api`
- DB : likes, booking, chat, invitations, admin (`*.realworld.test.ts`)
- E2E : `apps/e2e` (Playwright Chromium, viewport Pixel 7)
- Audit : `TIPTOP_QA_AUDIT.md` — mapping P1–P12 + gaps (Expo, push no-op, pas d’argent réel)
