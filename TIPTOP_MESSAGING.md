# TipTop — messagerie

Système existant (Phase 5-6), inchangé dans sa mécanique temps réel. Cette phase ajoute :

## Invitation sociale → conversation

`SocialInvitesService.accept` appelle `ChatService.openDirect(actorId, inviterId)` : la conversation directe est créée (ou réutilisée si elle existe déjà) automatiquement à l'acceptation. L'utilisateur est redirigé vers `/messages/:conversationId`. Aucune conversation n'est créée pour une invitation refusée ou expirée.

## Messagerie contextuelle (#42)

Déjà couvert pour les événements (`Conversation.kind = EVENT`, groupe automatique). Les invitations sociales n'ouvrent qu'une conversation `DIRECT` standard — pas de nouveau type de conversation, pour ne pas multiplier les concepts sans besoin réel.

## Modération d'un message (#58)

Nouveau : bouton « Signaler » sous chaque message reçu (pas les siens) dans `/messages/:id`. Utilise `ReportModal` (`kind="MESSAGE"`, `messageId`). Le blocage de la personne (`POST /users/:id/block`) reste le mécanisme principal de protection, inchangé.

## Groupes

Inchangé (création via conversation événement). Aucune fonctionnalité de groupe libre (hors événement) n'a été ajoutée dans cette phase — non demandé explicitement au-delà de ce qui existe, et éviter d'ajouter une fonctionnalité de groupe non testée de bout en bout.
