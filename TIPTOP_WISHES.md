# TipTop — envies (compléments)

Référence principale : `TIPTOP_WISH_SYSTEM.md`. Ce document ajoute les fonctionnalités de cette phase.

## « Je t'invite » (#37-38)

Sur une envie de catégorie **expérience** (`EVENT`, `RESTAURANT`, `ACTIVITY`, `TRAVEL`, `EXPERIENCE`, `SPORT`, `LEISURE`, `PLACE`), un second CTA apparaît à côté de « Proposer de l'offrir » :

**Je t'invite** → ouvre une `SocialInviteModal` (contexte `WISH`, `wishId` renseigné, label = titre de l'envie).

Sur les catégories purement matérielles (`GIFT`, `PRODUCT`, `SERVICE`, `OTHER`), seul « Proposer de l'offrir » (`WishOffer`) reste pertinent.

## Mes propositions (#40)

`GET /wishes/offers/mine` retourne :

```json
{ "received": [...], "sent": [...] }
```

- `received` : offres faites sur mes envies (je suis `wish.ownerId`).
- `sent` : offres que j'ai faites sur les envies d'autrui (je suis `fromUserId`).

Chaque offre porte son `status` (`SENT`, `PENDING`, `ACCEPTED`, `REFUSED`, `AWAITING_PAYMENT`, `PAID`, `DELIVERED`, `DONE`, `CANCELLED` — déjà défini dans le schéma), permettant à l'UI de les regrouper par onglet sans recalcul serveur supplémentaire.

## Anti double-comptabilisation

Une `WishOffer` acceptée ne crée **pas** de temps de like — cf. règle D26 (like-time), non modifiée ici.
