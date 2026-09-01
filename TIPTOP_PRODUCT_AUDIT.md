# TipTop — Audit produit

**Statut :** Phase 0 — analyse des maquettes, sans implémentation applicative.  
**Sources :** maquettes PDF dans `docs/mockups/`, logos dans `docs/brand/`, master prompt de conception.  
**Périmètre géographique visible :** Cameroun (indicatif `+237`, FCFA, Orange Money, MTN Mobile Money, Yaoundé).  
**Langue des maquettes :** français.

Cet audit décrit ce qui existe dans les maquettes, ce qui est déduit, ce qui manque, et l’architecture proposée. Les choix non explicitement définis par le fondateur sont listés dans `TIPTOP_PRODUCT_DECISIONS.md` et ne doivent pas être présentés comme des règles fondatrices.

---

## A. Écrans trouvés dans les maquettes

Les maquettes sont fournies en PDF séparés (pas un unique `TipTop.pdf`). L’ensemble a été traité comme la référence UI/UX obligatoire. Index détaillé : `docs/mockups/INDEX.md`.

### A.1 Identité & authentification

| ID | Écran | Source | Observation |
| --- | --- | --- | --- |
| S01 | Splash | `tt0` p.1 | Fond clair, cercles décoratifs pâles, logo orbital dégradé + wordmark cyan. |
| S02 | Connexion | `tt0` p.2 | Téléphone + drapeau Cameroun, « Se souvenir de moi », CTA cyan, OAuth Google / Facebook / Apple. |
| S03 | OTP | `tt0` p.3 | 4 cases, numéro masqué, timer de renvoi (jaune), clavier numérique, switcher thème (soleil / lune). |

### A.2 Navigation principale

Barre inférieure (5 onglets) présente sur Home, Mood, Amies, Events :

| Onglet | Libellé maquette | Rôle visible |
| --- | --- | --- |
| Home | Home | Fil d’accueil |
| Mood | Mood | Contenus immersifs d’activité réelle |
| Add post | Add post | Création publication / événement |
| Amies | Amies | Personnes disponibles à proximité |
| Events | Events | Découverte et gestion d’événements |

Header récurrent (Home / Events / Amies / Search) :

- logo TipTop à gauche (sauf écrans internes) ;
- cloche notifications (badge jaune) ;
- messages ;
- hamburger → Menu.

Sélecteur de zone : `Yaoundé - Carrefour Damas` + bouton recherche.

### A.3 Accueil, Mood, création

| ID | Écran | Source | Composants clés |
| --- | --- | --- | --- |
| S04 | Accueil | `tt0` p.4 | Moods horizontaux, carte post/événement, mini-carte, stats (commentaires, partages, réservations, intéressés), cœur, commentaire, calendrier, signal, countdown « Événement dans : 13min », badge `-18`. |
| S05 | Mood viewer | `tt0` p.8 | Plein écran, Créer, likes temporels `/H` `/J` `/M`, commentaires, partage, input commentaire, audio original, tags. |
| S06 | Caméra | `TipTop2_18` | Capture sombre, modes PHOTO / PORTRAIT / VIDEO, flash, HDR, filtres. |
| S07 | Nouvelle publication | `TipTop2_21` | Texte, image, localisation, dropdown type, Publier. |
| S08 | Nouvel événement | `TipTop2_22` | Titre, description, date/heure, prix FCFA optionnel, âge limite, image, localisation, inviter des amis. |

### A.4 Découverte de personnes & profils

| ID | Écran | Source | Composants clés |
| --- | --- | --- | --- |
| S09 | Amies disponibles | `TipTop2_12` | Carousel de cartes : photo, nom, âge, métier, distance, CTA Inviter. |
| S10 | Profil public | `TipTop2_13` | Cover, avatar + online, badge certifié, Message, Inviter, plus, bio courte, ville, lien, onglets Publications / Events / Moods, événements intéressants + liés. |
| S11 | Mes contacts | `TipTop2_29` | Liste contacts + métier, localisation en header. |
| S12 | Menu | `TipTop2_28` | Carte profil + chevron (transition de compte), « Mes likes » `/heure` `/Jour` `/Mois`, Tickets, Favoris, Contacts, Paiement, Paramètres, Aide. |
| S13 | Mon compte | `TipTop2_31` | Photo éditable, prénom, nom, profession, téléphone. |
| S14 | Paramètres | `TipTop2_32` | Mode sombre, langue, mot de passe, CGU, déconnexion. |

### A.5 Événements

| ID | Écran | Source | Composants clés |
| --- | --- | --- | --- |
| S15 | Events — Tous | `TipTop2_14` | Même structure de carte que le Home, onglets Tous / Mes événements. |
| S16 | Events — Mes événements | `TipTop2_15` | Cartes visuelles : participants, prix, hôte, date. |
| S17 | Détail événement (participant) | `TipTop2_16` | Galerie, prix, carte, stats, personnes liées. |
| S18 | Détail événement (créateur) | `TipTop2_17` | CTA « VALIDER TICKET », onglets Tout / Intéressés / Réservés / Validés, badge Payé / Non payé. |
| S19 | Actions créateur | `TipTop2_19` | Épingler, partager, modifier, annuler, supprimer. |
| S20 | Favoris | `TipTop2_23` | Liste de cartes événement « likées » / sauvegardées. |

### A.6 Réservation, paiement, tickets

| ID | Écran | Source | Composants clés |
| --- | --- | --- | --- |
| S21 | Réserver | `tt0` p.5 | Prix, date, « Pour moi-même », inviter des amis, Passer au paiement. |
| S22 | Paiement | `tt0` p.6 | Montant, nombre de personnes, sélecteur Orange Money, Valider. |
| S23 | Paiement réussi | `tt0` p.7 | Confirmation + Fermer. |
| S24 | Mes tickets | `TipTop2_24` | Cartes ticket (encoche), Moi / Invité par, Payé, prix, date. |
| S25 | Mes invitations | `TipTop2_25` | Payé, Gratuit, En attente, Non payé, Refusé, Accepter / Refuser. |
| S26 | Ticket QR consommé | `TipTop2_26` | Invité, #CR500551, Payé, Consommé, QR. |
| S27 | Ticket QR non consommé | `TipTop2_27` | Participation « Non consommé ». |
| S28 | Moyens de paiement | `TipTop2_30` | Carte, Orange Money, Mobile Money, ajouter. |

### A.7 Recherche, notifications, messagerie

| ID | Écran | Source | Composants clés |
| --- | --- | --- | --- |
| S29 | Recherche | `TipTop2_20` | Zone + texte, filtres Tout / Personnes / Publications / Événements, bouton Appliquer. |
| S30 | Notifications | `TipTop2_9` | Nouveau / Plus tôt, types like/comment/share/invitation, Accepter/Refuser. |
| S31 | Inbox | `TipTop2_10` | Conversations, online, non-lus jaunes, FAB nouveau message. |
| S32 | Chat groupe | `TipTop2_11` | Présence, admin, médias, typing, canal # General, vocale. |

**Total écrans maquettés distincts : 32** (plus overlays splash/home déjà comptés).  
Les variantes light/dark, desktop, empty/error/loading ne sont pas maquettées.

---

## B. Fonctionnalités déduites

### B.1 Identité

- Splash / branding.
- Auth téléphone + OTP 4 chiffres + expiration / renvoi.
- « Se souvenir de moi » (session persistante).
- OAuth Google, Facebook, Apple (présent visuellement).
- Thème clair / sombre (toggle OTP + paramètre dédié).
- i18n (écran Langue, sans liste).
- Menu compte + chevron de transition de compte.

### B.2 Social

- Feed mixte (post + événement dans une même carte).
- Publications texte / image / localisation.
- Commentaires, partages.
- Moods (stories d’activité réelle, plein écran, création caméra).
- Profil public : publications, events, moods.
- Badge certifié.
- Stats de likes temporels (`/H` `/J` `/M` et `/heure` `/jour` `/mois`).
- Cœur sur posts et events (à réconcilier avec Like vs Coup de cœur).
- Abonnement implicite (non maquetté comme liste).
- Recherche globale à 4 filtres.
- Notifications sociales + invitations.
- Messagerie 1:n (groupe) ; inbox suggère aussi le 1:1.
- Contacts.

### B.3 Monde réel

- Localisation hiérarchique ville → zone (`Yaoundé - Carrefour Damas`).
- Mini-carte sur les posts/events ; carte grisée prévue par le prompt si précision refusée (non visible dans les PDF).
- Disponibilité des personnes (carousel « Amies disponibles », distance, métier, âge).
- Invitation d’une personne vers un événement.
- Événements gratuits / payants, âge minimum, countdown, intéressés, réservations.
- Création d’événement avec prix optionnel.
- Gestion créateur : intéressés / réservés / validés, payé/non payé, valider ticket.
- Favoris événements.

### B.4 Booking & argent

- Réservation pour soi et/ou des invités.
- Paiement multi-personnes (ex. 10.000 FCFA / 2 personnes).
- Providers : carte, Orange Money, MTN Mobile Money.
- Tickets avec QR et identifiant unique.
- Statuts ticket : payé, non payé, gratuit, en attente, refusé, consommé, non consommé.
- Invitation acceptée / refusée, éventuellement déjà payée par l’invitant.

### B.5 Non visibles mais imposés par le master prompt

- Like unique transférable, historique, achat de likes, double like certifié, ratio influenceur.
- Coup de cœur événement transférable.
- Booking en 3 niveaux (attente / confirmé / passé).
- Avis post-événement.
- Push notifications, devices.
- Admin / modération.
- Anti-abus et race conditions.
- Web + mobile responsive.

---

## C. Écrans manquants (à créer)

Les maquettes ne couvrent pas un produit fermé. Écrans / états indispensables :

### C.1 Auth & onboarding

- Choix inscription vs connexion.
- Complétion de profil (username, photo, ville, profession) après 1er OTP.
- OTP expiré, OTP invalide, renvoi disponible.
- Échec / annulation OAuth.
- Permissions : localisation, notifications, caméra, micro, galerie.
- Localisation refusée / GPS off.
- Récupération de compte.
- Gestion des sessions / appareils.
- Suppression de compte + confirmation.

### C.2 Social

- Liste commentaires d’un post.
- Partage (sheet native + in-app).
- Chat individuel (seule la vue groupe est maquettée).
- Nouvelle conversation / création de groupe.
- Messages : recherche, archivage, suppression, médias 1:1.
- Mood composer (texte + média + durée + visibilité + événement lié) — au-delà de la caméra.
- Liste abonnés / abonnements.
- Toggle disponibilité explicite (On/Off).
- Paramètres de précision de localisation.
- Bloquer / signaler utilisateur ou contenu.
- Contenu supprimé, utilisateur bloqué, compte supprimé.

### C.3 Événements & booking

- Page événement complète (description longue, avis, médias, CTA distincts gratuit vs payant).
- Invitation : choisir un événement pour une personne disponible (pont manquant entre S09 et S21).
- Invitation : l’invitant paie vs l’invité paie.
- Booking list (En attente / Confirmé / Passé) — le PDF a Tickets, pas cette vue 3 niveaux.
- Paiement échoué, annulé, pending.
- Ajout / édition / suppression d’un moyen de paiement.
- Scanner QR organisateur (le CTA existe, l’écran scanner non).
- QR invalide, déjà consommé, expiré, inconnu, ticket annulé.
- Événement complet, annulé, passé.
- Avis après événement.
- Aperçu avant publication (post et event).

### C.4 Likes & monétisation

- Attribution d’un like à une personne (confirmation de transfert).
- Historique des likes donnés / reçus.
- Achat de likes.
- Portefeuille likes ≠ solde financier.
- Coup de cœur (distinct du like personne).

### C.5 Plateforme

- Toutes les vues desktop / tablette.
- Toutes les vues dark mode.
- Empty / loading (skeleton) / error / offline pour chaque écran majeur.
- Centre d’aide (entrée Menu).
- Conditions, politique de confidentialité.
- Sélecteur de langue FR/EN.
- Changement de mot de passe (si mot de passe retenu — voir décisions).
- Back-office admin.
- 404 / 403.

---

## D. Parcours utilisateur

Détail opérationnel : `TIPTOP_USER_FLOWS.md`.

Parcours critiques à garantir de bout en bout :

1. Inscription / OTP → profil → accueil.
2. Publication → feed → interaction.
3. Disponibilité → découverte personne → invitation → acceptation.
4. Découverte événement → réservation → paiement mock → ticket.
5. Ticket → QR → validation → consommé.
6. Chat 1:1.
7. Chat groupe.
8. Mood → visibilité.
9. Like personne → transfert.
10. Coup de cœur événement → transfert.
11. Achat de likes mock → utilisation.
12. Notification → deep link.

Objectif ultime (prompt §77) : compte → profil → localisation → disponible → découvrir → inviter → discuter → réserver → payer mock → ticket → notification → QR validé → participer → Mood → avis → historique.

---

## E. États

Pour **chaque** écran important (matrice : `TIPTOP_SCREEN_MATRIX.md`) :

| Famille | Exemples TipTop |
| --- | --- |
| Loading | Skeleton feed, spinner OTP, upload média. |
| Empty | Pas de tickets, pas de messages, personne disponible dans la zone, pas de favoris. |
| Error | OTP faux, paiement refusé, réseau, upload invalide. |
| Success | Paiement validé, invitation envoyée, ticket validé. |
| Offline | File d’attente locale limitée, bandeau, retry. |
| Permission denied | Localisation / notifs / caméra, CTA réglages OS. |
| Unauthorized | Redirection login, session expirée. |
| Métier | Événement complet, annulé, ticket consommé, invitation expirée, like déjà transféré. |

États déjà visibles dans les maquettes : Payé, Non payé, Gratuit, En attente, Refusé, Consommé, Non consommé, Intéressés / Réservés / Validés, countdown, online/offline, unread.

---

## F. Règles métier

### F.1 Explicites (maquettes + prompt)

- TipTop sert à **découvrir → rencontrer → sortir → vivre → partager**, pas à maximiser le temps d’écran.
- Auth téléphone + OTP ; session mémorisable.
- Localisation par zone ; marché initial Cameroun / FCFA / Mobile Money.
- Double nature : feed social vs feed events, à ne pas confondre.
- Mood = activité réelle, surtout pendant un événement, pas un clone Stories.
- Événements gratuits ou payants, avec ou sans réservation.
- Invitation d’une personne disponible vers un événement ; paiement possible par l’invitant ou l’invité.
- Tickets + QR ; validation à l’entrée ; consommation unique.
- Like = personnes ; Coup de cœur = événements.
- Un like (unité) ne peut pas être chez deux personnes à la fois : transfert.
- Certifiés : double like. Influenceurs : ratio `/seconde` si seuil config.
- Likes achetables via un vrai ledger, distinct de l’argent.
- Contacts ≠ amis ≠ abonnements ≠ disponibles ≠ participants ≠ invités.

### F.2 Implicites (maquettes)

- Badge `-18` / stepper « Age limite » = restriction d’âge à l’événement.
- Countdown « Événement dans : » crée de l’urgence de sortie, pas de l’addiction de scroll.
- Stats « Réservations » et « Intéressés » sont des signaux d’intention réelle.
- Mini-carte = preuve de lieu ; si l’utilisateur masque sa position, variante grisée (prompt).
- Organisateur scanne / valide les tickets (`VALIDER TICKET`).
- Invitations reçues peuvent déjà être payées par l’invitant.

### F.3 À figer (décisions)

Voir `TIPTOP_PRODUCT_DECISIONS.md` : OAuth, mot de passe vs OTP-only, sémantique Cœur maquette vs Like/CdC, ami vs contact vs follow, multi-compte, seuil influenceur, capacité, etc.

---

## G. Architecture proposée

Proposition d’équipe (non encore implémentée). Objectif : un domaine unique testable, deux clients, mocks isolés.

```
apps/web          Next.js (App Router) — web responsive, PWA
apps/mobile       Expo + Expo Router — iOS/Android, mêmes parcours
apps/admin        Back-office (peut démarrer comme route /admin du web)
apps/api          NestJS — REST + WebSocket, jobs
packages/domain   Règles pures : likes, tickets, invitations, ratios (TypeScript strict)
packages/ui       Design tokens + composants tête (web)
packages/i18n     FR / EN
packages/sdk      Client API typé
```

| Couche | Choix | Pourquoi |
| --- | --- | --- |
| Langage | TypeScript strict partout | Types, domaine partagé web/mobile/API |
| DB | PostgreSQL | Contraintes, transactions, audit likes/tickets |
| ORM | Prisma | Migrations, types |
| Cache / présence / OTP | Redis | TTL OTP, sockets, rate limit |
| Temps réel | Socket.io (gateway Nest) | Chat, typing, présence, notifs live |
| Auth | OTP téléphone (adapter SMS) + sessions | Fidèle aux maquettes ; OAuth optionnel |
| Fichiers | Adapter Storage (FS local / S3) | Upload mock en dev |
| Paiement | Port `PaymentProvider` | Card / OM / MoMo / mock |
| Push | Port `PushProvider` | Tokens devices, no-op en local |
| QR | Payload signé HMAC + id ticket | Validation hors-ligne limitée + conso atomique |
| i18n | next-intl / i18next | Aucun texte hardcodé dans les composants |
| Design | Tokens CSS (light/dark) + Tailwind | Couleurs jamais hardcodées dans la logique |
| Tests | Vitest (domain + API), Playwright E2E | Obligation §59–60 |

**Sécurité de base :** validation serveur, rate limit OTP et likes, pas de secrets commités, uploads typés/size-limited, tickets consommés en transaction `SELECT … FOR UPDATE`, likes transférés par contrainte d’unicité sur l’unité active.

**Dev local :** tout fonctionne sans prestataire réel (OTP fixé en sandbox, paiement mock, push no-op, géoloc navigateur / mock).

Le détail tables / indexes / API sera dans `TIPTOP_ARCHITECTURE.md` et `TIPTOP_DATABASE.md` en Phase 1.

---

## H. Matrice des tests (vue d’ensemble)

Le détail opérationnel est dans `TIPTOP_TESTING.md` et l’audit Phase 8 dans `TIPTOP_QA_AUDIT.md`. Association fonctionnalité → tests :

| Fonctionnalité | Unitaire (domain) | Intégration (API/DB) | E2E |
| --- | --- | --- | --- |
| OTP / session | expiration, masquage | émission mock, cookie | Parcours 1 |
| Profil | validation champs | ownership | Parcours 1 |
| Publication | règles visibilité | create/list feed | Parcours 2 |
| Commentaire | | create/list | Parcours 2 |
| Like personne | transfert, unicité, certifié, ratio | concurrence 2 req | Parcours 2, 9 |
| Achat likes | ledger, solde | idempotence paiement | Parcours 11 |
| Coup de cœur | transfert | | Parcours 10 |
| Disponibilité / découverte | filtre distance/zone | geo query | Parcours 3 |
| Invitation | états, payeur | race accept/refus | Parcours 3 |
| Réservation | capacité, gratuit/payant | double booking | Parcours 4 |
| Paiement mock | machine d’états | webhook idempotent | Parcours 4 |
| Ticket / QR | payload, états | conso atomique | Parcours 5 |
| Chat | | WS message/presence | Parcours 6–7 |
| Mood | durée, visibilité | | Parcours 8 |
| Notifications | | création + lu | Parcours 12 |
| Localisation | niveaux de précision | | permissions |
| Admin / modo | permissions | | smoke |
| i18n / thème | tokens | | visuel |

Tests de course (§60) : double like, double transfert, double réservation, double paiement, double scan ticket, accept+refus simultanés.

---

## Identité visuelle extraite (ne pas remplacer)

| Token | Valeur approximative maquettes |
| --- | --- |
| Page | `#F5F7FA` |
| Surface | `#FFFFFF` |
| Texte | navy `#1E2A3A` |
| Secondaire | `#8A94A6` |
| Accent cyan | `#00BAF2` |
| Urgence / badge | jaune `#F5C518` |
| Succès | vert `#27AE60` |
| Logo | dégradé jaune-vert → cyan |
| Rayons cartes | 16–24px |
| CTA | pills cyan, texte blanc |
| Typo | sans géométrique, proche Inter |

Dark mode : surfaces inversées, cyan conservé, wordmark clair (variante logo 2). Ne pas utiliser la variante 3 (wordmark trop sombre) comme logo principal.

---

## Incohérences relevées dans les maquettes

1. **Cœur unique** sur posts sociaux et events, alors que le produit distingue Like (personne) et Coup de cœur (événement).
2. **Feed Home** déjà très « événement » (réservations, countdown) — risque de confusion avec l’onglet Events.
3. **OAuth** sur le login, non décrit dans le prompt d’auth OTP.
4. **Mot de passe** dans Paramètres alors que l’entrée est téléphone/OTP.
5. **Libellé ticket** « Statut » utilisé deux fois (prix vs paiement) — probable erreur de maquette.
6. **Caméra** (jaune / dark) vs reste de l’app (cyan / clair).
7. **Points avatar** tantôt verts (online) tantôt rouges.
8. **« Amies »** (féminin) dans la nav.
9. **Splash clair** vs lockups logo fournis sur fond noir.
10. **Pas de vue 1:1** alors que l’inbox est une liste de conversations individuelles + groupes.
11. **Pont invitation** : on invite depuis une fiche personne, mais le choix d’événement n’est pas maquetté.
12. **Booking 3 niveaux** du prompt vs **Tickets / Invitations** des maquettes.

Ces points sont tranchés (provisoirement) dans `TIPTOP_PRODUCT_DECISIONS.md`.
