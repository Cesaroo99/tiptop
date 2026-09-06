# TipTop — architecture paiement

## Décision fondatrice (D25)

Aucun vrai argent en v1. Le système est un **mock à ports réels** :

- `CARD`
- `ORANGE_MONEY`
- `MTN_MOMO`

Le parcours utilisateur (réserver → payer le **prix du billet** → recevoir le ticket → QR) fonctionne de bout en bout.  
Un événement à 0 coûte **0**. Un événement à 50 unités coûte **50** à l’utilisateur.

Brancher Stripe / OM / MoMo live est un **changement de provider**, pas une réécriture du booking.

## Trois montants distincts

Voir aussi `TIPTOP_COMMISSION.md`.

| Montant | Qui le paie | Source | V1 |
| --- | --- | --- | --- |
| Prix du billet | Utilisateur | `Event.priceXaf × sièges` | Actif (`reservationAmountXaf`) |
| Frais prestataire de paiement | Prestataire (non TipTop) | Futur PSP | **0** — TipTop ne les invente pas |
| Commission TipTop | Organisateur (prélevée sur l’encaissement) | `TIPTOP_PLATFORM_FEE_PERCENT` / `AppConfig` | **0 %** |

L’utilisateur paie `chargeTotalXaf` = prix du billet + éventuels frais **acheteur** (aucun aujourd’hui).  
La commission TipTop n’est **pas** ajoutée au prix affiché à l’acheteur.

## Flux

```
POST /reservations
  → planEventBooking (invites / self / guests)
  → Reservation.amountXaf = prix billet
  → tickets CONFIRMED si 0, sinon AWAITING_PAYMENT

POST /payments   (session utilisateur)
  → mockCharge(provider)
  → Payment SUCCEEDED | FAILED
  → markPaid → tickets CONFIRMED
  → notification PAYMENT

POST /payments/webhook   (secret, prod)
  → applyWebhook idempotent
  → LIKE_PACK → fulfillPaidPurchase
  → RESERVATION → markPaid
```

## Sécurité

- `POST /payments` : `SessionGuard` + le payeur doit être le booker.
- `POST /payments/webhook` : enproduction, `x-tiptop-webhook-secret` obligatoire (`PAYMENT_WEBHOOK_SECRET`). En dev/test, ouvert si le secret n’est pas posé (pour les tests existants).
- QR ticket : `ticketId + exp + HMAC(SESSION_SECRET)`.
- Consommation : `UPDATE … WHERE status = CONFIRMED AND consumedAt IS NULL`.

## Admin

`/admin/payments` :

- liste des paiements mock ;
- remboursement mock (total / partiel) — **ne void pas** les tickets (reste documenté) ;
- carte **Monétisation** : commission actuelle, édition ADMIN, audit log.

## Ce qui n’est pas un paiement TipTop

- Packs « vie » (`LIKE_PACK`) : ledger d’unités d’attribution, pas de l’argent réel.
- Événement gratuit : aucun Payment n’est dû.
