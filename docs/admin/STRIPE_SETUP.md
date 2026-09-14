# Stripe

**État actuel : hors stack.** Les paiements sont un **ledger mock** (`CARD`, `ORANGE_MONEY`, `MTN_MOMO`) — voir `TIPTOP_PAYMENTS.md`.

Aucun argent réel. Aucun payout automatique vers un organisateur. TipTop reste au centre du flux : commission, refunds et tickets sont décidés dans l’API.

| Capacité | État |
| --- | --- |
| Payments | ⚪ Disabled (mock) |
| Connect | ⚪ Disabled |
| Webhooks Stripe | ⚪ Disabled |
| Refunds Stripe | ⚪ Disabled (refund mock ledger) |
| Payouts | ⚪ Disabled |

Webhook **TipTop** : `POST /api/payments/webhook` + `PAYMENT_WEBHOOK_SECRET` (obligatoire en production). Idempotent. Reçus dans `WebhookReceipt`.

Pour brancher Stripe plus tard (changement de provider, pas une réécriture booking) :

1. Compte Stripe + Connect si besoin.
2. Clés en variables d’environnement (jamais dans le frontend).
3. Webhooks signés, idempotence sur `event.id`.
4. Garder le contrôle TipTop des transferts (pas de transfert immédiat aveugle).
