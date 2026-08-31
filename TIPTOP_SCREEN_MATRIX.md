# TipTop — Matrice des écrans

Légende **Source** :

- `PDF` = présent dans `docs/mockups/`
- `GAP` = absent des maquettes, nécessaire au produit
- `SYS` = état système (loading, erreur, etc.) transversal

Navigation : IDs d’écrans alignés sur `TIPTOP_PRODUCT_AUDIT.md` (S01…). Les gaps sont `Gxx`.

---

## 1. Écrans issus des maquettes

| Écran | Source | Fonction | Navigation entrante | Navigation sortante | États | Backend nécessaire | Tests |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S01 Splash | PDF `tt0` p.1 | Branding, bootstrap session | Cold start | S02 ou S04 | loading session | Session | E2E cold start |
| S02 Connexion téléphone | PDF `tt0` p.2 | Auth | S01, logout, deep link protégé | S03, OAuth | validation, erreur réseau, rate limit | Auth, SMS mock | E2E P1, unit phone |
| S03 OTP | PDF `tt0` p.3 | Vérif 4 chiffres | S02 | Onboarding ou S04 | invalide, expiré, renvoi, thème | Auth OTP Redis | E2E P1, unit expiry |
| S04 Accueil | PDF `tt0` p.4 | Feed social + sorties liées | Tabs, login | Mood, post, event, profil, search, notif, chat, menu, réserve | skeleton, empty, error, offline | Feed, location, moods | E2E P1–P2 |
| S05 Mood viewer | PDF `tt0` p.8 | Voir l’activité réelle | Tab Mood, stories Home | Composer, commentaires, profil, like | empty, expired, loading média | Mood, likes, comments | E2E P8 |
| S06 Caméra | PDF `TipTop2_18` | Capture photo/vidéo | Mood Créer, composer | Preview, composer | permission denied | Storage | permission tests |
| S07 Composer publication | PDF `TipTop2_21` | Créer un post | Tab Add, dropdown | S04 | validation, upload progress | Post, media, geo | E2E P2 |
| S08 Composer événement | PDF `TipTop2_22` | Créer une sortie | Dropdown type | S15/S16, aperçu | validation date/prix/âge | Event | E2E create event |
| S09 Amies disponibles | PDF `TipTop2_12` | Découverte personnes | Tab Amies | Profil, invitation (G11), suivant | empty zone, geo denied | Discovery, availability | E2E P3 |
| S10 Profil public | PDF `TipTop2_13` | Voir quelqu’un | Feed, search, discovery | Chat, invite, events, moods, posts, report | blocked, loading | Profile, follow, block | E2E P3 |
| S11 Contacts | PDF `TipTop2_29` | Carnet | Menu | Profil, search contacts | empty | Contacts | list tests |
| S12 Menu | PDF `TipTop2_28` | Hub compte | Hamburger | Profil, tickets, favoris, contacts, paiement, settings, aide | — | Profile, like stats | nav tests |
| S13 Mon compte | PDF `TipTop2_31` | Éditer identité | Menu, profil owner | S12 | validation, save error | User update | E2E P1 |
| S14 Paramètres | PDF `TipTop2_32` | Préférences | Menu | Langue, sécurité, CGU, logout | confirm logout | Settings | theme/i18n |
| S15 Events Tous | PDF `TipTop2_14` | Découverte sorties | Tab Events | Détail, search, notif | empty, skeleton | Event feed | E2E P4 |
| S16 Mes événements | PDF `TipTop2_15` | Sorties créées / liées | Onglet | Détail créateur S18 | empty | Event owned | owner tests |
| S17 Détail event (vue) | PDF `TipTop2_16` | Infos + personnes | Feed, search | Réserve, profils, carte, comments | complet, annulé, passé | Event, participants | E2E P4 |
| S18 Détail event (créateur) | PDF `TipTop2_17` | Gestion + valider ticket | S16, S19 | Scanner G18, listes filtres | tabs vides | Event admin, tickets | E2E P5 |
| S19 Actions créateur | PDF `TipTop2_19` | Modifier / annuler / supprimer / épingler | S18 ⋮ | Edit, confirm | confirm destructive | Event mutations | permission tests |
| S20 Favoris | PDF `TipTop2_23` | Sorties coup de cœur / saved | Menu | Détail | empty | Favorites, hearts | toggle tests |
| S21 Sheet réserver | PDF `tt0` p.5 | Choisir soi + invités | S04/S17 | S22 | places, âge | Reservation draft | E2E P4 |
| S22 Sheet paiement | PDF `tt0` p.6 | Choisir moyen, payer | S21 | S23 ou échec G15 | pending, fail | Payment mock | E2E P4, idempotence |
| S23 Paiement OK | PDF `tt0` p.7 | Confirmation | S22 | Ticket S24/S27 | — | Payment, ticket | E2E P4 |
| S24 Mes tickets | PDF `TipTop2_24` | Liste titres | Menu | S26/S27, search | empty | Tickets | E2E P5 |
| S25 Invitations reçues | PDF `TipTop2_25` | Accepter / refuser | Menu, notif | Paiement si besoin, ticket | pending, paid, refused | Invitations | E2E P3, race |
| S26 Ticket consommé | PDF `TipTop2_26` | Preuve + QR inactif | S24 | Event, share | consumed | Ticket | E2E P5 |
| S27 Ticket actif | PDF `TipTop2_27` | QR d’entrée | S24 | — | expired, cancelled | Ticket | E2E P5 |
| S28 Moyens de paiement | PDF `TipTop2_30` | Wallets | Menu | Add G16, edit | empty | Payment methods | CRUD tests |
| S29 Recherche | PDF `TipTop2_20` | Tout / gens / posts / events | Header loupe | Profils, events, posts | empty, history | Search | E2E search |
| S30 Notifications | PDF `TipTop2_9` | Centre notifs | Cloche | Deep links P12 | empty, unread | Notifications | E2E P12 |
| S31 Inbox | PDF `TipTop2_10` | Conversations | Header chat | S32, chat 1:1 G07, new G08 | empty | Messaging | E2E P6–P7 |
| S32 Chat groupe | PDF `TipTop2_11` | Temps réel groupe | S31 | Médias, profils | typing, offline | WS, messages | E2E P7 |

---

## 2. Écrans manquants à construire

| Écran | Source | Fonction | Navigation entrante | Navigation sortante | États | Backend nécessaire | Tests |
| --- | --- | --- | --- | --- | --- | --- | --- |
| G01 Onboarding profil | GAP | Nom, username, photo, ville, dispo | Premier OTP | S04 | validation | User | E2E P1 |
| G02 Permissions | GAP | Localisation, notifs, caméra | Onboarding, usage | OS settings | denied | Device flags | permission |
| G03 Localisation refusée | GAP | Expliquer + zone manuelle | Feed, discovery | S29 zone picker | denied | Location | E2E geo |
| G04 Précision localisation | GAP | Exact / zone / ville / masqué | Settings | — | saved | Privacy | unit levels |
| G05 Toggle disponibilité | GAP | Se déclarer dispo | Home, profil owner | S09 | TTL | Availability | E2E P3 |
| G06 Liste commentaires | GAP | Thread post/event/mood | Cartes | Profil | empty, error | Comments | E2E P2 |
| G07 Chat 1:1 | GAP | Conversation privée | Profil Message, inbox | — | blocked | WS | E2E P6 |
| G08 Nouvelle conversation | GAP | Chercher un contact | FAB inbox | G07 / S32 | empty | Messaging | E2E |
| G09 Composer Mood | GAP | Texte, média, durée, event, visibilité | Mood Créer | S05 | validation | Mood | E2E P8 |
| G10 Preview média Mood | GAP | Valider capture | S06 | G09 | — | Storage | upload |
| G11 Choisir un event pour inviter | GAP | Pont personne → sortie | S09 Inviter | S21 / envoi | empty events | Events + invite | E2E P3 |
| G12 Choix payeur invitation | GAP | Invitant vs invité | G11 | S22 ou envoi | — | Invitation | E2E P3 |
| G13 Invitation envoyée | GAP | Success | G12 | Chat / Home | — | Invitation | E2E P3 |
| G14 Booking 3 niveaux | GAP | Attente / confirmé / passé | Menu Sorties | Ticket, event | empty | Reservations | E2E P4 |
| G15 Paiement échoué | GAP | Retry / autre moyen | S22 | S22, S28 | fail, cancel | Payment | E2E fail |
| G16 Ajouter un moyen de paiement | GAP | Card / OM / MoMo mock | S28 | S28 | validation | Payment methods | CRUD |
| G17 Paiement pending | GAP | Attente provider | S22 | S23 / G15 | timeout | Payment | webhook |
| G18 Scanner QR organisateur | GAP | Valider entrée | S18 | Résultat G19 | caméra | Ticket consume | E2E P5, race |
| G19 Résultat scan | GAP | OK / déjà consommé / invalide / expiré | G18 | G18 | 5 variantes | Ticket | unit + E2E |
| G20 Event complet | GAP | Plus de places | S17 | Favori, notif | full | Event | capacity |
| G21 Event annulé | GAP | Message + refund mock | Deep link | Home | cancelled | Event, payment | refund |
| G22 Avis post-event | GAP | Feedback réel | Notif, ticket passé | Profil event | already reviewed | Review | E2E §77 |
| G23 Confirm transfert like | GAP | Alice → Sarah | Cœur personne | Profil | — | Like allocation | E2E P9 |
| G24 Historique likes | GAP | Audit user | Menu likes | Profils | empty | Like history | unit ratios |
| G25 Achat de likes | GAP | Packs mock | Menu, G23 si solde 0 | Paiement | — | Like wallet | E2E P11 |
| G26 Confirm coup de cœur | GAP | Transfert event | Cœur event | S17 | — | Heart | E2E P10 |
| G27 Followers / following | GAP | Listes | Profil | Profils | empty, private | Follow | follow tests |
| G28 Bloquer / signaler | GAP | Modération user | Profil ⋮ | Confirm | — | Block, Report | authz |
| G29 Signaler contenu | GAP | Post/event/mood | ⋮ | Confirm | — | Report | authz |
| G30 Langue | GAP | FR / EN | S14 | — | — | i18n pref | i18n |
| G31 Sécurité / sessions | GAP | Appareils, logout all | S14 | — | empty | Sessions | session |
| G32 CGU / confidentialité | GAP | Légal | S14, signup | — | — | CMS/static | smoke |
| G33 Suppression compte | GAP | Irréversible | S14 | Login | confirm | User delete | cascade |
| G34 Aide | GAP | FAQ | Menu | — | — | Static | smoke |
| G35 Abonnés notif settings | GAP | Catégories push | S14 | OS | denied | Push prefs | prefs |
| G36 Offline | SYS | Bandeau + retry | Global | — | offline | Queue limitée | offline |
| G37 Unauthorized | SYS | Session morte | Route protégée | S02 | — | Auth | E2E |
| G38 404 / contenu supprimé | SYS | Objet manquant | Deep link | Home | — | — | E2E |
| G39 Desktop shell | GAP | Nav latérale, 2 colonnes | Breakpoint | Mêmes routes | — | Idem | responsive |
| G40 Dark copies | GAP | Tous les écrans | Token theme | — | — | Tokens | visual |
| G41 Admin home | GAP | Back-office | Role admin | Users, events… | — | Admin API | authz |
| G42 Admin users | GAP | Certif, ban, search | G41 | Profil admin | — | Users | admin |
| G43 Admin events | GAP | Modération sorties | G41 | G41 | — | Events | admin |
| G44 Admin likes | GAP | Anomalies | G41 | Allocations | — | Likes audit | anti-abus |
| G45 Admin payments | GAP | Tx, refunds | G41 | — | — | Payments | admin |
| G46 Preview publication | GAP | Avant Publier | S07/S08 | Publish | — | Draft | validation |
| G47 Share sheet | GAP | Partage event/post | Cartes | Native / in-app | — | Share token | smoke |
| G48 Zone picker | GAP | Pays / ville / quartier | Header location | S04/S09/S15 | empty search | Geo catalog | E2E |
| G49 Profil owner | GAP | Vue soi (edit, tickets, dispo) | Menu, avatar | S13, G05 | — | Profile | E2E |
| G50 Mot de passe / PIN | GAP | Si D05 retenu | S14 | — | — | Auth | optional |

---

## 3. États transversaux (SYS) à brancher sur chaque écran majeur

| État | Comportement |
| --- | --- |
| Loading | Skeleton calqué sur la carte (feed, tickets, chat) |
| Empty | Texte utile + CTA (ex. « Personne dispo dans ta zone » → élargir zone / se déclarer dispo) |
| Error | Message + Réessayer |
| Success | Toast ou modal (paiement déjà maquetté) |
| Offline | Bandeau, actions de lecture OK, écriture en erreur claire |
| Permission | Explication « pourquoi TipTop en a besoin pour sortir » |
| Unauthorized | Redirect login, return URL |

Aucun bouton primaire (Publier, Réserver, Inviter, Payer, Valider, Accepter) ne doit mener à une impasse : chaque ligne ci-dessus a une sortie.
