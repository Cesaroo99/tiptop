# TipTop — réservations et billets

Système inchangé dans cette phase (Phase 4-5 déjà livrées). Ce document résume l'état actuel pour référence croisée avec les invitations et le mood.

## Trois états visibles (`/tickets`)

1. **En attente** : `Reservation.status = PENDING` ou paiement non confirmé.
2. **Confirmée** : `CONFIRMED`, ticket émis.
3. **Passée** : événement terminé (voir `eventLifecycle` dans `TIPTOP_EVENTS.md`).

## Après l'événement

- Avis (`EventReview`) — déjà en place.
- Idée de prolongement produit *(non implémentée, documentée pour éviter une fausse fonctionnalité)* : proposer de partager un Mood juste après un ticket consommé. Ce lien n'est pas automatisé en v1 ; l'utilisateur crée son Mood manuellement depuis le compose. Ne pas prétendre le contraire dans l'UI.

## Lien avec les invitations sociales

Une réservation reste strictement liée à un événement payant/à capacité. Un `SocialInvite` (restaurant, café, activité) ne crée **jamais** de réservation ou de ticket — seulement une conversation. Si l'activité proposée nécessite finalement un événement billetterie, l'utilisateur passe par le flux `Invitation` classique (`/invite/:userId`).
