# TipTop — analytics produit

Architecture de mesure, **pas** un dashboard ni une IA.

## Catalogue

`packages/domain/src/analytics.ts` → `ANALYTICS_EVENTS`.

Événements demandés au lancement :

| Événement | Branché |
| --- | --- |
| inscription | `auth.signup` |
| connexion | `auth.login` |
| publication | `post.create` (catalogue, à brancher si besoin) |
| vue | `post.view` / `mood.view` / `profile.view` |
| Mood | `mood.create`, `mood.view` |
| interaction / vie | `like.place` |
| profil | `profile.view` |
| suivi | `follow.create` |
| ami | `friend.accept` (catalogue) |
| message | `message.send` (catalogue) |
| événement | `event.create` (catalogue) |
| réservation | `reservation.create` |
| paiement | `payment.succeed` |
| invitation | `invite.send` |
| disponibilité | `availability.set` (catalogue) |
| check-in | `ticket.checkin` |

Les noms du catalogue existent même s’ils ne sont pas encore émis : on ne « invente » pas un produit analytics.

## Sink actuel

`AnalyticsService` écrit un JSON structuré dans les logs Nest (`Logger("analytics")`).

Remplacer le sink plus tard (fichier, Segment, warehouse) **sans changer** les appels `track()`.

## Ce que ce n’est pas

- Pas de tracking public navigateur.
- Pas de reco IA.
- Pas de pixels tiers.
