# TipTop — audit sécurité (lancement)

## Corrigé cette phase

| Risque | Mesure |
| --- | --- |
| Webhook paiement ouvert (IDOR) | Secret `x-tiptop-webhook-secret` obligatoire en production |
| Uploads vidéo / chat anonymes | Session obligatoire |
| Mood signalé non masqué | `Mood.hiddenAt` + ACTIONED hide + admin Moods |
| Remboursement sans invalidation billet | Refund total RESERVATION → tickets `REFUNDED` (non consommés) |

## Conservé volontairement (décisions produit)

| Sujet | Pourquoi |
| --- | --- |
| OTP mock `1234` | D31 / démo téléphone (`OTP_ALLOW_MOCK`) |
| Paiements mock | D25 |
| `repair-schema` | Staff only, filet prod |

## Reste avant argent réel

- `SESSION_SECRET` unique en prod (pas le défaut `dev-only-secret`)
- `PAYMENT_WEBHOOK_SECRET` posé
- CORS restreint à `WEB_ORIGIN`
- SMS OTP
- Suppression de compte
- Hide message à l’ACTIONED (pas de `hiddenAt` Message)

## Contrôles déjà en place

- Session + rôles admin
- Tickets : QR HMAC, consume atomique, `NOT_HOST` / `TICKET_FORBIDDEN`
- Booking : seul le booker paie
- Blocage / signalement
- Localisation : précision choisie, pas de GPS temps réel forcé
