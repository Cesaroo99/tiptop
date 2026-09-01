# Audit QA TipTop — Phase 8

État au moment de la Phase 8. Les parcours P1–P12 sont ceux de `TIPTOP_USER_FLOWS.md`.  
Rien n’est inventé : si un parcours n’est pas en E2E navigateur, la colonne le dit.

Démo : `+237 695 21 47 85` / OTP `1234` (César, `ADMIN`). Erica `+237 690 00 00 01`.

## Commandes

```bash
pnpm --filter @tiptop/domain test
pnpm --filter @tiptop/api test
pnpm test:e2e
```

E2E : Chromium Playwright, `apps/e2e`, un worker (compte César partagé). Réutilise l’API `:3001` et le web `:3000` s’ils tournent déjà.

```bash
pnpm --filter @tiptop/e2e install:browsers   # une fois
```

## Matrice P1–P12

| Parcours | Unitaire (domain) | Intégration (API/DB) | E2E Playwright | Gap honnête |
| --- | --- | --- | --- | --- |
| **P1** Compte / OTP / accueil | `evaluateOtp` (valid, expired, locked), `parsePhone`, masquage | curl documenté ; cookie + Bearer | Login UI, téléphone invalide, OTP `0000`, OTP `1234` → feed | Splash natif / restauration session longue non E2E. OAuth = modal « bientôt ». Expo reporté. |
| **P2** Publication / feed / like / commentaire | transfert like, unicité | `likes.transfer.test.ts` | Compose texte unique → visible à l’accueil | Like + commentaire : pas de clic cœur E2E (race déjà en DB). |
| **P3** Dispo / découverte / invitation | TTL dispo, `evaluateInvite`, pas d’auto-invitation | `invitations.realworld.test.ts` | Smoke `/people` (liste ou vide réel) | Pas d’E2E accept/refus (destructif + places). |
| **P4** Résa / paiement mock / ticket | `reservationAmountXaf`, `mockCharge`, `applyWebhook` | `booking.realworld.test.ts` (double résa) | Smoke `/events` + `/tickets` | Pas de nouvelle résa payante en E2E (seed Afterwork). |
| **P5** QR / conso | HMAC ticket, fenêtre d’entrée, `canConsumeTicket` | double conso atomique en DB | Smoke écran tickets | Pas de scan caméra. Deux onglets hôte/participant non simulés. |
| **P6** Chat 1:1 | `directKey`, blocage, `canSendMessage` | unicité DM | Inbox Erica + envoi texte | Presence/typing WS : un seul navigateur. Push = no-op. |
| **P7** Chat groupe event | domaine chat | seed groupe Soirée Black & White | Non dédié (inbox peut montrer le groupe) | Pas de 2e compte concurrent. |
| **P8** Mood TTL | `moodExpiresAt` | seed mood Erica | Smoke `/mood` | Pas de création mood E2E (TTL déjà unitaire). |
| **P9** Transfert like | `planTransfer`, unicité allocation | `likes.transfer.test.ts` | Non | Race 2 profils : contrainte DB, pas Playwright multi-clic. |
| **P10** Coup de cœur | `planHeartTransfer` | index unique actif | Non | Idem P9. |
| **P11** Achat likes mock | packs, `likeCreditAllowed`, pas de crédit si fail | `likes.wallet.test.ts` | Portefeuille → échec mock → pack +1 crédité | Aucun vrai débit. |
| **P12** Notifications | — | créées au fil des services | Smoke `/notifications` | Push FCM/APNs **no-op**. Deep link item obsolète : pas d’E2E. |
| **Admin** | `canAccessAdmin`, `refundAllowed`, anomalies | `admin.realworld.test.ts` | César `/admin` ; Erica UI + API `403 ADMIN_ONLY` | Pas d’annulation Afterwork ni refund en E2E (destructif). |

## Courses (§60)

Couvert en **DB / domain**, pas en double navigateur :

- like / transfert unique
- double réservation
- webhook paiement déjà terminal
- double conso ticket
- invitation accept/refus (règles domain + DB)

## Hors scope volontaire (inchangé)

| Sujet | Pourquoi |
| --- | --- |
| Expo / iOS / Android | Pas de simulateur fiable ici ; web = client mobile-first |
| FCM / APNs | Provider no-op, log seulement |
| Argent réel | Ledger mock Card / OM / MoMo |
| Vocale réelle | Message `AUDIO` mock |
| OAuth Google/Facebook/Apple | Modal i18n, pas de provider |
| Playwright Firefox/WebKit / 2 contextes WS | Un Chromium, un compte à la fois |
| Slack / e-mail transactionnel | Non branchés |

## Verdict

Les règles métier critiques ont des tests unitaires + DB.  
Les parcours **visibles** P1, P2, P6, P11 et le smoke admin passent par l’UI réelle (sélecteurs i18n FR, pas de faux boutons).  
Les parcours booking / QR / likes transfer restent volontairement hors E2E destructif : ils sont déjà couverts plus bas dans la pile.

Phase 8 = cette matrice + `apps/e2e`, pas une promesse de couverture 100 % des 12 parcours en navigateur.
