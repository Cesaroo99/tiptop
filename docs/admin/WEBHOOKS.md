# Webhooks

## TipTop mock (`/api/payments/webhook`)

- Header `x-tiptop-webhook-secret` = `PAYMENT_WEBHOOK_SECRET` (obligatoire si `NODE_ENV=production`).
- Corps : `{ idempotencyKey, status: "SUCCEEDED" | "FAILED" }`.
- Idempotent via `applyWebhook` + table `WebhookReceipt` (`provider` + `externalId` unique).
- Retry : renvoyer le même `idempotencyKey` incrémente `attempts`, ne rejoue pas un terminal.

## Stripe

Non implémenté. L’écran `/admin/webhooks` le dit.

## Firebase

Aucun webhook Firebase.
