# TipTop — Décisions produit

Ce fichier distingue :

1. **Règles explicites** — maquettes ou master prompt.
2. **Décisions d’équipe** — hypothèses nécessaires pour construire un produit fermé.  
   Elles ne sont **pas** des règles énoncées par le fondateur. Elles peuvent être infirmées.

Format : `Dxx` — contexte — décision — raison — impact — statut.

---

## D01 — Sources de vérité UI

**Contexte :** le prompt cite `TipTop.pdf` ; le dépôt a reçu un ensemble de PDF + logos.  
**Décision :** traiter l’ensemble `docs/mockups/` + `docs/brand/` comme la charte et les écrans de référence.  
**Raison :** aucun fichier unique `TipTop.pdf` n’était présent.  
**Statut :** retenu.

## D02 — Marché initial

**Contexte :** `+237`, FCFA, Yaoundé, Orange Money, MTN.  
**Décision :** v1 localisée Cameroun ; i18n FR par défaut, EN préparé ; devise `XAF`.  
**Statut :** retenu, extensible.

## D03 — Web + mobile

**Contexte :** deux plateformes demandées.  
**Décision :** un backend unique ; web Next.js responsive (mobile-first, fidèle aux maquettes iOS) ; app native Expo partageant `packages/domain` et le SDK. La v1 web doit déjà permettre le parcours §77.  
**Statut :** retenu.

## D04 — Auth : OTP d’abord, OAuth secondaire

**Contexte :** maquette login = téléphone + OTP **et** Google/Facebook/Apple. Le prompt insiste sur OTP.  
**Décision :** parcours principal = téléphone + OTP mock. OAuth en adaptateurs, activables par flag, non bloquants pour la v1. Compte créé par OAuth : demander un téléphone ensuite si un paiement/ticket est nécessaire.  
**Statut :** ouvert si le fondateur veut OAuth dès le jour 1.

## D05 — Mot de passe

**Contexte :** Paramètres « Changer le mot de passe » vs login sans mot de passe.  
**Décision :** pas de mot de passe obligatoire en v1. L’entrée Paramètres ouvre « Sécurité » : appareils, OTP, éventuellement code PIN de l’app. Si un compte OAuth existe, le changement de mot de passe s’applique au fournisseur, pas à TipTop.  
**Statut :** ouvert.

## D06 — Inscription vs connexion

**Contexte :** un seul écran « Se connecter ».  
**Décision :** même écran. Premier OTP réussi → onboarding profil si `profileCompleted = false`, sinon Home.  
**Statut :** retenu.

## D07 — Username

**Contexte :** le menu montre `@cesar_memoli`, le formulaire compte ne le propose pas.  
**Décision :** username unique généré puis éditable dans Mon compte / onboarding.  
**Statut :** retenu.

## D08 — Multi-compte

**Contexte :** chevron sur la carte profil du Menu.  
**Décision :** architecture `Account` / `Membership` prête ; UI v1 = profil + déconnexion seulement, pas de switcher multi-compte.  
**Statut :** retenu (volontairement limité).

## D09 — Follow vs Contact vs Ami vs Disponible vs Participant vs Invité

**Contexte :** le prompt exige de ne pas mélanger. Les maquettes montrent Contacts, Amies disponibles, Inviter, participants.  
**Décision :**

| Concept | Sens v1 |
| --- | --- |
| Follow | relation asymétrique de fil social |
| Contact | personne explicitement enregistrée (carnet TipTop), souvent issue d’une interaction réelle |
| Ami | **non utilisé comme graphe distinct en v1** — « Amies » dans la nav = **personnes disponibles**, pas un friend graph Facebook |
| Disponible | statut d’availability, indépendant du follow |
| Participant | lien EventParticipant (intéressé / réservé / validé / présent) |
| Invité | Invitation vers un event, avec son propre cycle de vie |

Un contact peut être créé automatiquement après invitation acceptée ou ticket partagé.  
**Statut :** ouvert sur le mot « Ami ».

## D10 — Disponibilité

**Contexte :** carousel « Amies disponibles » mais pas de toggle maquetté.  
**Décision :** statut `available | busy | hidden`. Toggle dans le header Home et sur le profil propriétaire. TTL configurable (défaut 4 h) pour éviter une disponibilité oubliée. La disponibilité n’est jamais déduite du simple scroll.  
**Statut :** retenu, TTL ouvert.

## D11 — Précision de localisation

**Contexte :** prompt = exact / zone / ville / masqué.  
**Décision :** 4 niveaux. Carte grisée + label « Zone approximative » si pas exact. Découverte personnes : distance arrondie (ex. 14 km) jamais au mètre près en v1.  
**Statut :** retenu.

## D12 — Sélecteur `Yaoundé - Carrefour Damas`

**Décision :** `Country → City → Zone`. La zone peut être un quartier. Changer la zone filtre découverte, events et, optionnellement, le feed. Position GPS sert à proposer la zone, pas à la forcer.  
**Statut :** retenu.

## D13 — Double nature du feed

**Contexte :** Home mélange déjà posts d’événements.  
**Décision :**

- **Home** = feed social. Un post peut *référencer* un événement (carte « sortie ») mais le CTA principal est social (commenter, inviter la personne, follow).
- **Events** = découverte de sorties. CTA principal = réserver / intéressé / coup de cœur / inviter.
- Un même événement peut apparaître dans les deux, avec **chrome visuel distinct** (badge « Sortie » vs carte événement).

Ne pas dupliquer deux algorithmes opaques en v1 : proximité + suivis + fraîcheur.  
**Statut :** retenu.

## D14 — Cœur des maquettes vs Like / Coup de cœur

**Contexte :** conflit majeur.  
**Décision :**

- Sur une **personne** (profil, mood, post personnel sans event) : le cœur = **Like** (unité transférable).
- Sur un **événement** : le cœur = **Coup de cœur** (transférable, 1 actif par utilisateur).
- Confirmation explicite si transfert (« Ton like quitte Alice pour Sarah »).
- Les stats `/H` `/J` `/M` du Mood = likes **reçus** agrégés, pas un compteur Instagram.

**Statut :** critique, à valider par le fondateur.

## D15 — Unité de like et certifiés

**Décision (fondateur, 2026-09) :**

- Chaque compte a **exactement 1 like personnel** (`LikeUnit` `FREE`), certifié ou non. Le badge certifié n’ajoute pas de jeton.
- Ce like ne peut être posé que chez **une** personne à la fois. Liker quelqu’un d’autre = transfert avec confirmation.
- Les packs mock (`PURCHASED`) restent un ledger séparé : ils **n’ajoutent pas** un second like à poser.
- « Ce que chacun produit » = likes **reçus maintenant** (stock) + rythme `/heure` `/jour` `/mois` (flux). Public : qui a posé son like ici, et où est le like de cette personne.

**Statut :** tranché — 1 like, pas double unité.

## D16 — Ratio likes et seuil influenceur

**Décision :** table `AppConfig` :

- `influencerThresholdLikesPerHour` (défaut documenté, ex. 50 — **valeur arbitraire d’équipe**).
- Au-delà : affichage `/seconde` (et conservation `/H` `/J` `/M` en détail).
- Formule documentée et testée : likes **reçus** sur fenêtre glissante (création d’allocation), plus le stock actif.

**Statut :** seuil ouvert.

## D17 — Achat de likes

**Décision :** packs mock conservés pour le ledger paiement, **hors du jeton personnel**. L’écran principal est « Mon like » (posé / reçus / rythme), pas un portefeuille d’unités.

**Statut :** monétisation du like personnel retirée du parcours utilisateur.

## D18 — Mood

**Décision :** durée max 24 h (configurable). Peut lier un `eventId`. Visibilité : public zone / followers / participants event. Objectif : montrer ce qui se passe **maintenant** pour donner envie de rejoindre. Pas de streak, pas de replay infini.  
**Statut :** durée ouverte.

## D19 — Création : dropdown Publication / Événement

**Décision :** un flux « composer » avec sélecteur de type (maquette). Un 3e type « Mood » via onglet Mood → Créer / caméra.  
**Statut :** retenu.

## D20 — Réservation obligatoire

**Contexte :** prix optionnel à la création ; pas de toggle « réservation obligatoire » maquetté.  
**Décision :**

- Prix vide ou 0 = gratuit.
- `requiresReservation` : true si payant ; si gratuit, le créateur peut exiger une réservation (capacité) ou laisser « intéressé » seulement.
- Capacité optionnelle ; si atteinte → état « complet ».

**Statut :** ouvert.

## D21 — Âge `-18`

**Décision :** interprété comme **âge minimum 18 ans**, pas « interdit aux plus de 18 ». Contrôle déclaratif en v1 (date de naissance au profil), pas de KYC.  
**Statut :** ouvert (sémantique du badge).

## D22 — Invitation + paiement

**Décision :** flux

1. Choisir une personne disponible.
2. Choisir un événement pertinent (même zone, âge OK, places).
3. Choisir payeur : invitant / invité / gratuit.
4. Si invitant paie : checkout pour N places puis invitation `paid_by_host`.
5. Invité : Accepter / Refuser. Si `paid_by_guest` et payant : checkout après acceptation.
6. Expiration configurable (défaut 24 h).

**Statut :** retenu, timeout ouvert.

## D23 — Booking vs Tickets

**Contexte :** prompt = 3 listes Booking ; maquettes = Mes Tickets / Mes invitations.  
**Décision :** **une** zone « Sorties » dans le Menu :

- sous-onglets **Tickets** | **Invitations** | **Réservations**  
  Réservations = attente / confirmé / passé (vue Booking du prompt).  
  Tickets = titres de transport QR.  
  Invitations = à répondre.

Ne pas inventer une 4e nav tab.  
**Statut :** retenu.

## D24 — Consommation ticket

**Décision :** `UPDATE … WHERE id = $1 AND status = 'confirmed' AND consumed_at IS NULL` dans une transaction. QR = `ticketId + exp + hmac`. États : draft, awaiting_payment, confirmed, consumed, cancelled, refunded, expired, invalid.  
**Statut :** retenu.

## D25 — Paiements

**Décision :** aucun vrai paiement en dev. `MockProvider` + ports Orange Money / MoMo / Card. Webhooks idempotents (`Idempotency-Key`). Devises XAF.  
**Statut :** retenu.

## D26 — Chat

**Décision :** 1:1 et groupes, temps réel. Médias oui (image). Vocale : UI présente, v1 peut envoyer un audio file mock. Canaux type Slack (`# General`) = **groupes événements / communautés**, pas un produit Slack complet en v1.  
**Statut :** vocale ouverte.

## D27 — Notifications

**Décision :** in-app (maquette) + architecture push (permission, tokens, deep links) avec provider no-op. Préférences par catégorie. Pas de spam : regrouper, pas de notif pour chaque pixel de scroll.  
**Statut :** retenu.

## D28 — Anti-addiction

**Décision v1 :**

- Pas de autoplay infini des Moods sans action.
- Feed paginé ; infinite scroll **court** (découverte locale), pas un puits sans fin.
- Countdown event OK (aide à sortir).
- Pas de streaks, pas de reels algorithmiques hors zone.
- Likes limités par nature (anti FOMO de collection).

**Statut :** retenu.

## D29 — Avis post-événement

**Décision :** 24 h après `event.endAt`, participants **validés** (ticket consommé ou check-in) peuvent laisser un avis texte. Note sur 5 **non affichée** tant que le fondateur ne la valide pas ; le champ peut exister en interne.  
**Statut :** notation ouverte.

## D30 — Admin

**Décision :** rôle `admin` / `moderator`. V1 back-office : users, reports, events, payments, like anomalies. Pas de growth hacking.  
**Statut :** retenu.

## D31 — Données de démo

**Décision :** seed 100 % fictif (personas maquettes : César Memoli, Erica Sinclair, etc. = personnages de démo, pas de vraies PII). OTP sandbox : code `1234` documenté.  
**Statut :** retenu.

## D32 — Accessibilité

**Décision :** contrastes WCAG AA sur tokens, 44px touch, labels, focus visible. Dark mode ne casse pas le contraste du cyan.  
**Statut :** retenu.

## D33 — Libellé nav « Amies »

**Décision :** conserver le libellé maquette en FR v1 (`Amies`) ; clé i18n `nav.people`. EN : `People`.  
**Statut :** ouvert (Amis vs Amies vs Personnes).

## D34 — Aide

**Décision :** écran Aide v1 = FAQ courte + contact support mock.  
**Statut :** retenu.

## D35 — Contenu sponsorisé

**Décision :** champ `post.kind = organic | sponsored` dans le schéma ; **pas d’UI pub en v1**.  
**Statut :** retenu.

---

## Décisions encore bloquantes (besoin fondateur)

Si le développement démarre avant réponse, les valeurs **Décision** ci-dessus s’appliquent.

1. D14 — mapping Cœur / Like / Coup de cœur.
2. D15 — double like = 2 unités ou poids ×2.
3. D16 — seuil influenceur.
4. D21 — sémantique `-18`.
5. D05 — mot de passe oui/non.
6. D04 — OAuth jour 1 ou plus tard.
7. D09 — existe-t-il un vrai graphe d’amis ?
