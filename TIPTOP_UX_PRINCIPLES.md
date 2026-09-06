# TipTop — principes UX

## Règle absolue (#73)

Pour toute fonctionnalité : « Comment ceci favorise-t-il une interaction réelle ? » Si la réponse est « ça fait défiler plus », on ne la construit pas.

## Hiérarchie du profil (#71-72)

1. Identité (photo, nom, certification)
2. Disponibilité (`AvailabilityBadge` — 🟢/⚪, cohérent partout : profil, feed, découverte)
3. Contexte (mood actif si pertinent)
4. Intérêts / profession
5. Envies
6. Événements
7. Contenu (publications, moods passés)
8. Statistiques (temps de likes — voir like-time)

Le composant `LikeCapital` et l'onglet Envies sont positionnés tôt sur `/u/[username]` pour respecter cet ordre.

## Composants partagés (au lieu de dupliquer)

Introduits dans cette phase pour éviter la divergence UI :

- `AvailabilityBadge` — badge de disponibilité standard.
- `SocialInviteModal` — invitation contextuelle (restaurant/café/activité/rejoindre/envie).
- `ReportModal` — signalement (utilisateur/publication/événement/message/mood).

Avant, le signalement était dupliqué en ligne sur l'écran profil ; il est maintenant centralisé et réutilisé sur mood et messages.

## États vides (#51)

Chaque nouvel écran a un état vide explicite et actionnable, jamais un écran blanc :

- `/invitations` (reçues vide / envoyées vide) : deux messages distincts.
- Découverte sans résultat : message existant conservé (« Personne dans ta zone »).

## Micro-interactions (#67)

L'envoi d'une invitation sociale ne ferme pas immédiatement sa modale : elle affiche « Invitation envoyée. » avec un bouton « Fermer », pour confirmer clairement l'action sans être intrusif ni bloquant.

## Ce qui n'a pas été ajouté volontairement

- Pas de sélecteur pays/région/ville tant qu'une seule ville a des données réelles (voir `TIPTOP_DISCOVERY.md`).
- Pas de fonctionnalité de groupe libre hors événement (voir `TIPTOP_MESSAGING.md`).
- Pas de lien automatique « ticket consommé → proposer un Mood » (voir `TIPTOP_BOOKING.md`) : documenté comme piste future, pas simulé dans l'UI.
