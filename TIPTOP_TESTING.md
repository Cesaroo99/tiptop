# Tests TipTop

## Lancer

```bash
pnpm --filter @tiptop/domain test
pnpm --filter @tiptop/api test
pnpm test:e2e
```

E2E (Playwright Chromium, `apps/e2e`) :

```bash
pnpm --filter @tiptop/e2e install:browsers   # une fois
pnpm test:e2e
```

Les serveurs `pnpm dev:api` (`:3001`) et `pnpm dev:web` (`:3000`) sont réutilisés s’ils tournent déjà (`reuseExistingServer`). Un seul worker : le compte César est partagé.

Audit final : `TIPTOP_QA_AUDIT.md`.

## Couverture (Phase 8)

| Zone | Type | Fichier |
| --- | --- | --- |
| Téléphone / OTP / likes / packs / admin / dispo / invitations / tickets / paiement / chat | unitaire | `packages/domain/src/index.test.ts` |
| HMAC session | unitaire | `apps/api/src/crypto.test.ts` |
| Transfert like + unicité | DB | `apps/api/src/likes/likes.transfer.test.ts` |
| Achat likes : pas de crédit si fail, unicité PURCHASE | DB | `apps/api/src/likes/likes.wallet.test.ts` |
| Masquage post + remboursement mock | DB | `apps/api/src/admin/admin.realworld.test.ts` |
| Disponibilité + invitations | DB | `apps/api/src/invitations/invitations.realworld.test.ts` |
| Double résa + double conso ticket | DB | `apps/api/src/booking/booking.realworld.test.ts` |
| Unicité DM | DB | `apps/api/src/chat/chat.realworld.test.ts` |
| P1 login / OTP | E2E | `apps/e2e/tests/p1-auth.spec.ts` |
| P2 publication | E2E | `apps/e2e/tests/p2-compose.spec.ts` |
| P6 chat | E2E | `apps/e2e/tests/p6-chat.spec.ts` |
| P11 portefeuille | E2E | `apps/e2e/tests/p11-wallet.spec.ts` |
| Admin César / Erica 403 | E2E | `apps/e2e/tests/admin.spec.ts` |
| Smokes P3–P5, P8, P12 | E2E | `apps/e2e/tests/smokes.spec.ts` |
| Santé API | E2E | `apps/e2e/tests/health.spec.ts` |

## Intégration auth (curl)

```bash
curl -s -X POST http://localhost:3001/api/auth/otp/request \
  -H 'content-type: application/json' \
  -d '{"phone":"+237695214785","country":"CM"}'

curl -s -X POST http://localhost:3001/api/auth/otp/verify \
  -H 'content-type: application/json' \
  -d '{"phone":"+237695214785","code":"1234","rememberMe":true,"country":"CM"}'
```

P9 / P10 / courses concurrentes : domain + DB, pas de double navigateur (voir l’audit QA).
