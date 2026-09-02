# TipTop — Audit de profondeur (produit + UI/UX + logique + navigation + états)

Ce document répond à la demande d'audit approfondi « au-delà de l'existence visuelle des
écrans ». Il complète (sans les dupliquer) les documents déjà produits lors des itérations
précédentes : `UI_AUDIT.md` (cohérence visuelle/design system), `TIPTOP_LIKE_TIME_SYSTEM.md`,
`TIPTOP_WISH_SYSTEM.md`, `TIPTOP_NEARBY_DISCOVERY.md`, `TIPTOP_PRODUCT_AUDIT.md`,
`TIPTOP_QA_AUDIT.md`. Ici, l'angle est : *un écran peut exister visuellement et être
fonctionnellement incomplet ou mal connecté* — c'est précisément ce qu'on vérifie.

Légende : `EXISTE` / `CORRECT` / `PARTIEL` / `MANQUANT` / `MAL CONNECTÉ` / `MAL DESIGNÉ`.
« → Corrigé cette itération » indique un changement livré dans cette PR.

---

## 1. Moods — flux vertical immersif (#4-6)

| Élément | État avant | État après |
|---|---|---|
| Flux `/mood` | MAL DESIGNÉ — liste de cartes verticales façon fil d'actualité, aucune immersion | → **Corrigé** : flux plein écran, un mood par écran, scroll-snap vertical (tactile + molette + flèches clavier), actions superposées (like, commentaires, partage, signaler), header d'app masqué (`AppShell fullBleed`) |
| Commentaires depuis le flux | MANQUANT (pas de bottom sheet dans l'ancienne liste) | → **Ajouté** : feuille de commentaires en overlay (chargement à l'ouverture, envoi inline) |
| Mood → Événement | MAL CONNECTÉ — le backend acceptait déjà `eventId` à la création (`moods.service.ts`), mais **aucun écran ne permettait de le renseigner** | → **Corrigé** : sélecteur d'événement dans `/compose?type=mood` (limité aux événements de l'utilisateur), bouton « Voir l'événement » sur chaque mood lié |
| Événement → Moods | MANQUANT — aucune route ni UI ne remontait les moods liés à un événement | → **Ajouté** : `GET /events/:id/moods` + rail « Moods de cet événement » sur la page événement, y compris après la fin de l'événement (souvenirs, cf. #46) |
| Vidéo | Demandée dans le prompt (« TikTok/Reels ») | → **Ajouté** : nouveau champ `Mood.videoUrl` (distinct d'`imageUrl`), 4 clips courts en boucle générés (effet Ken Burns via ffmpeg) à partir de vraies photos seed déjà utilisées dans l'app (concert, piscine, rooftop, restaurant), lecture/pause automatique selon la visibilité dans le flux (`IntersectionObserver`, comme Reels/TikTok pour ne jamais faire tourner plusieurs vidéos en même temps), bouton muet/son, sélecteur dans `/compose?type=mood`. Deux clips sont liés à de vrais événements pour illustrer la boucle Mood→Événement en vidéo. Il n'existe toujours pas de vrai pipeline d'upload/transcodage vidéo utilisateur dans cette base — l'architecture reste, comme pour les images, un choix parmi un jeu de médias seed plutôt qu'un upload libre ; c'est cohérent avec le mécanisme déjà en place pour les photos et évite de simuler une infrastructure d'upload inexistante. |

## 2. Événements — cycle de vie et actions contextuelles (#7-10, #14-15)

| Élément | État avant | État après |
|---|---|---|
| Phases temporelles | PARTIEL — seulement `upcoming/ongoing/ended`, jamais `cancelled` malgré un enum `EventStatus.CANCELLED` déjà en base | → **Corrigé** : `eventLifecycle()` (package `@tiptop/domain`) accepte désormais le statut réel de l'événement et renvoie `upcoming / startingSoon (≤30 min) / ongoing / ended / cancelled`, avec tests unitaires dédiés |
| Annulation prise en compte côté carte événement | MAL CONNECTÉ — `EventCard` ignorait totalement `event.status`. Un événement annulé continuait d'afficher un compte à rebours et les CTA Réserver/Intéressé | → **Corrigé** : badge « Annulé », message explicite, CTA de réservation/intérêt masqués, cœur désactivé |
| Blocage serveur des interactions sur événement annulé/terminé | MANQUANT — `toggleInterested`, `heart`, `canBook` ne vérifiaient pas la phase | → **Corrigé** : `canInteractWithEvent(phase)` appliqué côté service (`events.service.ts`), testé via requêtes live (interested → 400 sur événement annulé) |
| Annulation par l'hôte | MANQUANT — seul un **admin global** pouvait annuler un événement (`AdminService.cancelEvent`). Un organisateur normal n'avait **aucun moyen** d'annuler son propre événement | → **Ajouté** : `POST /events/:id/cancel` (hôte uniquement), avec confirmation UI (modale danger) |
| Modification d'un événement | MANQUANT — aucune route `PATCH`, aucun écran d'édition | → **Ajouté** : `PATCH /events/:id` + écran `/events/:id/edit` (titre, description, date, lieu, capacité, âge minimum), bloqué si annulé/terminé |
| Duplication d'un événement | MANQUANT | → **Ajouté** : `POST /events/:id/duplicate` (nouvelle date obligatoire) + action dans l'écran de gestion |
| Notifications de changement/annulation | MANQUANT — ni l'annulation admin ni l'annulation hôte ne prévenaient qui que ce soit. Un utilisateur intéressé/réservé pouvait apprendre l'annulation uniquement en revisitant l'écran | → **Ajouté** : nouveau type `NotificationType.EVENT_UPDATE` avec `entityType` (`event_cancelled`, `event_time_changed`, `event_place_changed`), déclenché à l'annulation (hôte et admin) et à la modification d'heure/lieu |
| Écran de gestion organisateur (`/events/:id/manage`) | MAL DESIGNÉ / INCOMPLET — n'affichait même pas le titre ou la date de l'événement géré, aucune action de cycle de vie, style non aligné sur le design system | → **Corrigé** : en-tête avec titre/date/statut, actions Modifier/Dupliquer/Scanner/Annuler, composants `Chip`/`Modal`/`EmptyState` du design system |

## 3. Paiement / réservation / ticket — pas de raccourci « réservation = payé » (#24-25)

Vérification du modèle de données (`schema.prisma`) : **déjà correct avant cette itération**,
aucune correction requise sur ce point précis.

- `ReservationStatus` (DRAFT/AWAITING_PAYMENT/CONFIRMED/CANCELLED/PAST) est **distinct** de
  `PaymentStatus` (PENDING/SUCCEEDED/FAILED/CANCELLED/REFUNDED), lui-même **distinct** de
  `TicketStatus` (DRAFT/AWAITING_PAYMENT/CONFIRMED/CONSUMED/CANCELLED/REFUNDED/EXPIRED/INVALID)
  et de `ParticipantStatus` (HOST/INTERESTED/RESERVED/CONFIRMED/PRESENT/CANCELLED).
- Le manage-screen dérive `paid` d'un ticket via son **statut réel** (`CONFIRMED`/`CONSUMED`),
  jamais d'une simple présence de réservation.
- Restriction d'âge (`minAge`) vérifiée côté **réservation** (`booking.service.ts:99-103`) à
  partir de la date de naissance réelle, et côté **invitation** (`evaluateInvite` dans
  `@tiptop/domain`, raison `AGE_RESTRICTED`) — aucune route de contournement identifiée.
- **Remboursement sans notification** : MAL CONNECTÉ — `AdminService.refund()` marquait le
  paiement `REFUNDED` et journalisait l'action (`AdminAudit`), mais **ne prévenait jamais
  l'utilisateur concerné**. → **Corrigé** : notification `PAYMENT` avec `entityType: "refund"`,
  libellé dédié côté client, redirection vers `/tickets`.

## 4. Notifications — couverture des types (#13)

| Catégorie | État |
|---|---|
| Social (like, commentaire, follow, coup de cœur, avis) | CORRECT (déjà couvert avant cette itération) |
| Réservation / paiement / ticket | CORRECT pour les cas positifs ; **remboursement** → corrigé ci-dessus |
| Invitation (reçue/acceptée/refusée) | CORRECT (`SOCIAL_INVITE`, `INVITE`) |
| Événement : annulation, changement d'heure/lieu | MANQUANT → **corrigé** (`EVENT_UPDATE`) |
| Événement : « bientôt » / « a commencé » | **Différé, documenté** : nécessiterait un job planifié (cron) pour scanner les événements dont `startsAt` approche et pousser une notification proactive — actuellement TipTop calcule le compte à rebours **à l'affichage** (`eventLifecycle`), ce qui couvre l'essentiel du besoin produit (l'utilisateur voit « Commence bientôt » dès qu'il ouvre l'app) sans complexité d'infrastructure de tâches planifiées. Un vrai rappel push nécessite un scheduler qui n'existe pas encore dans ce backend ; l'ajouter arbitrairement sans vérifier l'infra de jobs existante aurait été une fausse fonctionnalité. Recommandation pour une itération dédiée : ajouter un worker planifié (`@nestjs/schedule` ou équivalent) plutôt que de le simuler.

## 5. Ce qui a été délibérément laissé hors périmètre (et pourquoi)

Conformément à la règle « ne pas créer de fonctionnalités arbitraires » (#77) et « ne pas
faire de fake UI » (#69), les points suivants du prompt ont été analysés mais **volontairement
non implémentés** dans cette itération, avec justification :

- **Multi-devises (CAD/USD/EUR/GBP)** : le produit est actuellement ancré sur un marché unique
  (Cameroun, XAF) dans toutes les données de seed, la logique de paiement (mobile money local)
  et les tests existants. Ajouter un vrai support multi-devises (taux de change, conversion
  d'affichage, `originalAmount`/`originalCurrency`) sans fournisseur de taux de change réel
  aurait produit une fonctionnalité de façade. Le schéma conserve déjà un champ `currency` par
  événement/paiement — l'extension reste possible sans migration structurelle majeure le jour
  où le produit s'internationalise réellement.
- **Nouveau type de relation « Saved person »** : le prompt (#37) liste `Contact`, `Follower`,
  `Following`, `Friend`, `Saved person` comme concepts à distinguer. `Contact` (issu d'une
  invitation acceptée) et `Follow` existent déjà avec des sémantiques distinctes et sont déjà
  exposés dans `/contacts`. Créer un cinquième concept (« sauvegardé ») sans cas d'usage
  produit clairement défini ailleurs dans le prompt aurait été une fonctionnalité inventée ;
  le rapprochement le plus proche déjà fonctionnel est le **cœur d'événement** (`EventHeart`,
  bouton « Coup de cœur ») pour les événements, et le **Follow** pour les personnes.
- **Dashboard financier organisateur détaillé** (revenus nets, frais, historique consolidé) :
  l'écran de gestion affiche déjà les compteurs réels (intéressés/réservés/validés) et le
  statut payé/non payé par billet, ce qui couvre le besoin minimal de pilotage. Un tableau de
  bord de revenus consolidés multi-événements demanderait d'agréger `Payment` sur tous les
  événements d'un hôte — recommandé comme chantier dédié plutôt qu'un ajout superficiel.
- **Deep link individuel `/invitation/:id`** : les invitations restent gérées via la liste
  `/invitations` (reçues/envoyées) avec actions inline d'acceptation/refus, ce qui couvre le
  parcours complet. Une page de détail dédiée par invitation n'apporterait pas de valeur
  fonctionnelle supplémentaire tant qu'aucun contenu additionnel (ex. fil de discussion propre
  à l'invitation) n'est prévu ailleurs dans la spécification.

## 6. Tests ajoutés cette itération

- `packages/domain/src/index.test.ts` : phases `startingSoon`/`cancelled`, `canInteractWithEvent`.
- `apps/api/src/events/events.manage.test.ts` : annulation → notification, duplication →
  nouvelle date obligatoire, moods liés consultables après la fin de l'événement.
- `apps/web/components/EventCard.test.tsx` : rendu « Annulé » (aucun CTA de réservation),
  rendu « Commence bientôt ».
- Vérifications manuelles bout en bout (navigateur) : flux Mood vertical (scroll, like,
  commentaires, lien vers événement), écran de gestion (titre/date/statut, modifier,
  dupliquer, annuler avec confirmation), boucle Mood ↔ Événement dans les deux sens.

## 7. Suivi recommandé (prochaines itérations, non bloquant)

1. Notifications proactives planifiées (bientôt / a commencé) via un scheduler dédié.
2. Restyle visuel de l'écran `/compose` (resté sur l'ancien style malgré la refonte design
   system des autres écrans lors de l'itération précédente) — fonctionnellement complété ici
   (sélecteur d'événement pour le Mood) mais pas entièrement restylé visuellement.
3. Dashboard financier consolidé pour les organisateurs multi-événements.
4. Rappel des restrictions d'âge dans l'UI de réservation elle-même (actuellement le blocage
   serveur est correct — code `AGE_RESTRICTED` — mais le formulaire de réservation pourrait
   afficher un message préventif avant soumission plutôt qu'après erreur serveur).
