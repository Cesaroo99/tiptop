# Checklist de progression TipTop

Une phase n’est close que si UI, états, validation, tests et liaisons backend (ou mock isolé) sont réellement en place.

## Phase 0 — Audit

- [x] Analyse des maquettes
- [x] `TIPTOP_PRODUCT_AUDIT.md`
- [x] `TIPTOP_PRODUCT_DECISIONS.md`
- [x] `TIPTOP_SCREEN_MATRIX.md`
- [x] `TIPTOP_USER_FLOWS.md`

## Phase 1 — Foundation

- [x] Monorepo, design tokens, thèmes light/dark
- [x] Routing web responsive (mobile-first + nav desktop)
- [x] Base de données + API
- [x] Authentification téléphone + OTP (mock)
- [ ] Expo natif (reporté : web = client mobile-first)

## Phase 2 — Social core

- [x] Profils, feed, publications, commentaires
- [x] Abonnements, likes transférables, recherche, notifications in-app

## Phase 3 — Real world core

- [x] Disponibilité, localisation, découverte
- [x] Événements, moods, invitations

## Phase 4 — Booking

- [x] Réservations, paiements mock, tickets, QR HMAC, validation hôte

## Phase 5 — Communication

- [x] Chat 1:1, groupes événement, temps réel WS, push no-op

## Phase 6 — Monétisation

- [ ] Achat de likes, portefeuille, historique

## Phase 7 — Admin

- [ ] Back-office utilisateurs, contenus, événements, paiements

## Phase 8 — QA

- [ ] Tests unitaires, intégration, E2E, audit final
