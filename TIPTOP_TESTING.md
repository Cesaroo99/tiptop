# Tests TipTop

## Lancer

```bash
pnpm --filter @tiptop/domain test
pnpm --filter @tiptop/api test
```

## Couverture actuelle (Phase 5)

| Zone | Type | Fichier |
| --- | --- | --- |
| Téléphone / OTP / likes / dispo / invitations / tickets / paiement / chat | unitaire | `packages/domain/src/index.test.ts` |
| HMAC session | unitaire | `apps/api/src/crypto.test.ts` |
| Transfert like + unicité | DB | `apps/api/src/likes/likes.transfer.test.ts` |
| Disponibilité + invitations | DB | `apps/api/src/invitations/invitations.realworld.test.ts` |
| Double résa + double conso ticket | DB | `apps/api/src/booking/booking.realworld.test.ts` |
| Unicité DM | DB | `apps/api/src/chat/chat.realworld.test.ts` |

## Intégration auth (curl)

```bash
curl -s -X POST http://localhost:3001/api/auth/otp/request \
  -H 'content-type: application/json' \
  -d '{"phone":"+237695214785","country":"CM"}'

curl -s -X POST http://localhost:3001/api/auth/otp/verify \
  -H 'content-type: application/json' \
  -d '{"phone":"+237695214785","code":"1234","rememberMe":true,"country":"CM"}'
```

Les parcours E2E 2–12 du master prompt arriveront avec les phases correspondantes.
