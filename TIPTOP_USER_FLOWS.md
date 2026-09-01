# TipTop — Parcours utilisateur

Chaque parcours est décrit **de bout en bout**.  
Les IDs d’écrans renvoient à `TIPTOP_SCREEN_MATRIX.md`.  
Les mocks (OTP, paiement, push) sont des services isolés, pas des faux boutons.

Philosophie : à la fin d’un parcours réussi, l’utilisateur a progressé vers une **expérience réelle** (ou y est préparé).

---

## Parcours 1 — Compte → profil → accueil

1. S01 Splash : restauration de session si « Se souvenir de moi ».
2. S02 : saisie `+237…`, envoi OTP mock.
3. S03 : code sandbox (`1234` en dev). Renvoi après timer. Thème applicable.
4. Si profil incomplet → G01 (prénom, nom, username, photo optionnelle, ville/zone).
5. G02 permissions (localisation au moins) : refus → G03 + G48 zone manuelle.
6. S04 Accueil filtré sur la zone.

**Échecs :** numéro invalide, OTP faux/expiré, réseau, session expirée (G37).

**Tests :** E2E P1 ; unit OTP expiry ; pas de token en clair dans les logs.

---

## Parcours 2 — Publication → feed → like personne → commentaire

1. Tab Add → S07 Publication.
2. Texte obligatoire **ou** image ; localisation optionnelle (niveaux D11).
3. G46 aperçu → Publier.
4. S04 : la carte apparaît (skeleton puis contenu).
5. Commentaire → G06.
6. Si le post est **personnel** (pas un event) : cœur = Like personne (D14) → G23 si transfert.
7. Notification à l’auteur (S30).

**Échecs :** upload trop lourd, type mime, offline.

**Tests :** E2E P2 ; like unitaire (unicité).

---

## Parcours 3 — Disponibilité → découverte → invitation → acceptation

1. Owner active G05 (disponible, TTL).
2. Autre utilisateur, même zone : S09 carousel (nom, âge, métier, distance arrondie).
3. Profil S10 : Message et Inviter.
4. Inviter → G11 liste d’événements pertinents (zone, âge, places, date future).
5. G12 payeur.
6. Envoi → G13 ; notif destinataire (S30 carte invitation).
7. Destinataire : S25 Accepter / Refuser.
   - Gratuit ou déjà payé par l’invitant → ticket confirmé.
   - Payé par l’invité → S22 puis S23.
8. Option : G07 chat 1:1 pour se rejoindre.

**Échecs :** plus de places (G20), event annulé (G21), invitation expirée, destinataire devenu indisponible.

**Tests :** E2E P3 ; race accept/refus ; pas d’invitation vers soi.

---

## Parcours 4 — Découverte event → réservation → paiement mock → ticket

1. S15 (ou S04 carte sortie) → S17.
2. Gratuit sans réservation : CTA « Intéressé » / favori / partage — pas de faux « Réserver ».
3. Avec réservation : S21 (soi ± invités).
4. Si montant > 0 → S22 moyen mock → pending G17 ou S23.
5. Tickets créés (un par participant) → S24 / S27.

**Échecs :** G15, capacité, âge, moyen invalide, double submit (idempotence).

**Tests :** E2E P4 ; double réservation ; webhook dupliqué ignoré.

---

## Parcours 5 — Ticket → QR → validation → consommé

1. Participant ouvre S27, QR visible si `confirmed` et event dans la fenêtre d’entrée.
2. Organisateur S18 → G18 scan.
3. G19 :
   - OK → ticket `consumed` (S26 côté user).
   - déjà consommé / expiré / annulé / inconnu / HMAC invalide.
4. Compteur « Validés » S18 incrémenté.

**Concurrence :** deux scans du même ticket → une seule conso.

**Tests :** E2E P5 ; race double scan.

---

## Parcours 6 — Chat individuel

1. S10 Message **ou** S31 conversation existante → G07.
2. Texte, image, timestamps, lu/non lu, présence, typing.
3. Push / in-app si l’autre est background (provider mock).

**Échecs :** utilisateur bloqué (G28), réseau.

**Tests :** E2E P6 ; WS.

---

## Parcours 7 — Chat groupe

1. S31 → S32 (ex. groupe événement ou communauté).
2. Médias, indicateur « +N écrivent », membres online.
3. Création de groupe : G08 (v1 : à partir d’un event ou de contacts).

**Tests :** E2E P7.

---

## Parcours 8 — Mood → publication → visibilité

1. S05 Créer **ou** « Votre mood ! » → S06 / G09.
2. Lier optionnellement l’événement en cours.
3. Durée + audience (D18).
4. Visible dans le rail Home et l’onglet Mood, pas comme un reel sans fin.
5. Like personne + commentaires G06.

**Tests :** E2E P8 ; expiration TTL.

---

## Parcours 9 — Like → transfert

1. César a 1 unité (ou 2 si certifié) allouée à Alice.
2. César like Sarah → G23 confirmation.
3. Alice : allocation close, timestamp de retrait, durée calculée.
4. Sarah : allocation ouverte.
5. Stats `/heure` `/jour` `/mois` recalculées.
6. Deux clics parallèles sur deux profils → une seule allocation active (contrainte DB).

**Tests :** E2E P9 ; unit transfer ; race.

---

## Parcours 10 — Coup de cœur → transfert

1. Cœur sur event A → allocation heart.
2. Cœur sur event B → G26, A perd le CdC, B le reçoit.
3. Compteurs event + liste S20.

**Tests :** E2E P10 ; race.

---

## Parcours 11 — Achat de likes mock → usage

1. Solde d’unités disponibles = 0, tentative de like → G25.
2. Pack → paiement mock (ledger paiement **et** ledger likes séparés).
3. Unités `purchased` disponibles → Parcours 9.

**Tests :** E2E P11 ; pas de crédit likes si paiement fail.

---

## Parcours 12 — Notification → deep link

1. Événement (like, invitation, paiement, ticket, message).
2. S30 item → écran cible (profil, S25, S27, G07, S17).
3. Marquer lu ; tout marquer lu.
4. Push : même deep link si permission accordée.

**Tests :** E2E P12 ; item obsolète → G38.

---

## Parcours ultime (§77) — Une sortie réelle

Enchaînement unique de démo (seed) :

| Étape | Écran | Résultat réel visé |
| --- | --- | --- |
| Compte | P1 | Identité |
| Profil | G01, S13 | Reconnaissable IRL |
| Zone | G48 | Yaoundé — Carrefour Damas |
| Disponible | G05 | Visible dans S09 |
| Découvrir personnes | S09 | Rencontre possible |
| Découvrir events | S15 | Sortie possible |
| Inviter | P3 | Engagement à deux |
| Discuter | P6 | Coordination IRL |
| Réserver + payer mock | P4 | Place tenue |
| Ticket | S27 | Preuve |
| Notification | P12 | Rappel de sortie |
| QR validé | P5 | Entrée physique |
| Mood | P8 | Partage de l’instant |
| Avis | G22 | Confiance pour les suivants |

G22 (Phase 9) : ticket **consommé** + 24 h après `endsAt` ; texte public ; note 1–5 interne non affichée. Seed : « Rooftop Damas (passée) ».
| Historique | G14, S24 | Mémoire des sorties, pas du scroll |

Si une étape est un cul-de-sac, la phase correspondante n’est **pas** terminée.

---

## Parcours créateur d’événement

1. S08 + G46 → event publié.
2. S16 / S18 suivi intéressés, réservés, payés, validés.
3. S19 modifier, épingler, annuler (G21 + refund mock), supprimer selon règles (pas si tickets confirmés non remboursés).
4. G18 soir même.

---

## Parcours recherche locale

1. Header → S29.
2. Filtres Tout / Personnes / Publications / Événements.
3. G48 change la zone.
4. Appliquer → résultats mixtes comme la maquette.
5. Empty : CTA élargir zone, pas un feed mondial addictif.

---

## Parcours desktop (G39)

Même URLs. Shell :

- nav gauche (Home, Mood, Add, Personnes, Events) ;
- colonne centrale feed / détail ;
- droite : moods ou chat selon page.

Aucun parcours ci-dessus ne doit être mobile-only côté données.
