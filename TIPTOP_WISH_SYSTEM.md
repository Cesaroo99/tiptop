# TipTop — envies

Une envie dit : « voici quelque chose qui me ferait plaisir ». Ce n’est **pas** une marketplace.

## Objet

`Wish` : titre, catégorie, description, photo (`/seed/` uniquement), URL, prix estimé, lieu, date souhaitée, événement lié, priorité, visibilité (`PUBLIC` / `FOLLOWERS` / `PRIVATE`).

Catégories : événement, produit, restaurant, activité, voyage, expérience, cadeau, service, lieu, sport, loisir, autre.

## Proposition

`WishOffer` — états : Envoyée, En attente, Acceptée, Refusée, Paiement en attente, Payée, Remise, Terminée, Annulée.

Le paiement n’est qu’un moyen **éventuel**. V1 : proposition sociale + acceptation / refus + notification `WISH_OFFER`. Pas de checkout marketplace.

## Invitation

« Je t’invite » peut ouvrir le flux d’invitation existant (`/invite/:userId`) ou une conversation. Une envie restaurant n’invente pas une réservation magique.

## API

- `GET /wishes/me`
- `GET /users/:id/wishes` (filtre visibilité)
- `POST /wishes` `PATCH /wishes/:id` `DELETE /wishes/:id`
- `POST /wishes/:id/offer`
- `POST /wish-offers/:id/accept|refuse`
