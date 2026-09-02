# TipTop — architecture produit (expérience sociale)

Ce document complète `TIPTOP_ARCHITECTURE.md` (stack technique) et `TIPTOP_PRODUCT_AUDIT.md` (audit initial). Il décrit l'architecture **fonctionnelle** après la phase « expérience sociale, événements, invitations, envies, proximité ».

## Philosophie

TipTop n'optimise pas le temps d'écran. La boucle produit centrale (#62 du brief) :

```
Découverte → Profil → Intérêt → Invitation → Acceptation
→ Conversation → Réservation/activité → Expérience réelle → Mood/retour → Nouvelle découverte
```

Chaque fonctionnalité doit répondre à : « comment ceci favorise-t-il une interaction réelle ? ». Si la réponse est « ça fait juste défiler plus », on ne la construit pas.

## Grands espaces (déjà en place, réutilisés)

| Espace | Écran(s) | Statut |
|---|---|---|
| Accueil | `/` (feed) | Existant — publications + cartes événement |
| Événements | `/events`, `/events/[id]`, booking, tickets | Existant complet (Phases 3-5) |
| Découverte | `/people` | Étendu (mood actif, filtres, invitation sociale) |
| Mood | `/mood`, `/mood/[id]`, compose | Étendu (activité, lieu, signalement) |
| Envies | `/wishes`, profil onglet Envies | Étendu (« Je t'invite », propositions) |
| Invitations événement | `/tickets` (onglet invites) | Inchangé |
| **Invitations sociales (nouveau)** | `/invitations` | Nouveau — sorties hors billetterie |
| Messages | `/messages`, `/messages/[id]` | Existant + signalement message |
| Notifications | `/notifications` | Étendu (SOCIAL_INVITE) |
| Profil | `/u/[username]`, `/account` | Étendu (« Proposer une sortie », signalement réutilisable) |
| Recherche | `/search` | Étendu (Envies, Mood) |

## Ce qui a été ajouté dans cette phase

1. **Invitations sociales** (`SocialInvite`) : pont non-billetterie entre découverte et rencontre réelle. Voir `TIPTOP_INVITATIONS.md`.
2. **Mood enrichi** : `activity`, `city`, `zone` — surfacé dans la découverte pour justifier un « Rejoindre » contextuel. Voir `TIPTOP_MOOD.md`.
3. **Découverte étendue** : mood actif visible sur les cartes, filtres (distance, âge, profession, disponibilité, envie). Voir `TIPTOP_DISCOVERY.md` et `TIPTOP_NEARBY_DISCOVERY.md` (like-time).
4. **Propositions d'envies unifiées** (`GET /wishes/offers/mine`) : reçues / envoyées. Voir `TIPTOP_WISHES.md`.
5. **Modération étendue** : `ReportKind` inclut désormais `MESSAGE` et `MOOD`, composant `ReportModal` réutilisable. Voir `TIPTOP_PRIVACY.md`.
6. **Préférences push étendues** : `invitations`, `mood` en plus de `messages`/`social`/`events`.
7. **Cycle de vie événement** (`eventLifecycle`) : badges « En cours » / « Terminé » en plus du compte à rebours existant.
8. **Recherche globale** : ajout des types `wishes` et `moods`.

## Ce qui n'a pas été touché

Le système de **Like Time** (durée, paliers, capital, classement) reste celui livré dans la branche `cursor/tiptop-like-time-5897`. Aucune modification de sa logique fondamentale ici — uniquement des intégrations superficielles (ex. `activeMood` sur les cartes de découverte, qui coexiste avec `likeTime`).

## Sécurité / permissions

- Un `SocialInvite` n'est visible que par son `inviterId` ou `inviteeId` (filtré côté service, jamais par ID brut côté client).
- Les envies `PRIVATE`/`FOLLOWERS` restent filtrées par `WishesService.listPublic`.
- Les messages signalés (`ReportKind.MESSAGE`) ne changent pas la visibilité de la conversation — seule l'équipe TipTop voit le signalement.

## Documents associés

`TIPTOP_SOCIAL_GRAPH.md`, `TIPTOP_EVENTS.md`, `TIPTOP_BOOKING.md`, `TIPTOP_INVITATIONS.md`, `TIPTOP_MOOD.md`, `TIPTOP_DISCOVERY.md`, `TIPTOP_WISHES.md`, `TIPTOP_MESSAGING.md`, `TIPTOP_PRIVACY.md`, `TIPTOP_UX_PRINCIPLES.md`.
