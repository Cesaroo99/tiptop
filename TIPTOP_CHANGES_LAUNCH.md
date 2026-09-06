# Documentation des changements — audit lancement

Branche : `cursor/tiptop-audit-launch-5897`  
Base : décisions D01–D38 + fil mixte `dc8988d`.

## Ce qui a été volontairement préservé

- Structure Home / Moods / Profil / Events / Amies.
- Mock paiement D25 (aucun PSP inventé).
- OTP démo `1234` (D31).
- Billetterie QR / consume atomique.
- Back-office existant (pas de simplification).
- Pas de Moods ajoutés « partout ».
- Pas de galerie Moods supplémentaire sur le profil.
- Commission organisateur restée à **0 %** (pas de prix inventé).

## Changements livrés

| Fichier / zone | Changement |
| --- | --- |
| `packages/domain/src/payments.ts` | `TIPTOP_PLATFORM_FEE_PERCENT`, breakdown, auth webhook |
| `packages/domain/src/admin.ts` | `canChangePlatformFee` |
| `AppConfig` + `GET/PATCH /admin/settings` | Commission lisible / éditable |
| `AdminAction.SETTINGS_UPDATE` | Audit log des changements de commission |
| Admin → Paiements | Carte Monétisation |
| `POST /payments/webhook` | Secret obligatoire en production |
| `/upload/video`, `/upload/chat` | Session obligatoire |
| `/terms` | « likes » → « vies » |
| Docs | `AUDIT_TIPTOP.md`, `LAUNCH_READINESS.md`, `TIPTOP_PAYMENTS.md`, `TIPTOP_COMMISSION.md` |

## Conflits tranchés

Voir la matrice dans `AUDIT_TIPTOP.md` § CONFLICT REVIEW.

Décision clé : « le paiement du billet doit fonctionner » = le **parcours mock existant** (0 $ si gratuit, prix sinon), pas un nouveau PSP.

## Reste

Liste dans `LAUNCH_READINESS.md`.
