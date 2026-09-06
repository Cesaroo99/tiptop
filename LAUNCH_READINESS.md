# TipTop — readiness lancement

État après l’audit de lancement (branche `cursor/tiptop-audit-launch-5897`).

## Parcours cible

```
inscription → profil → découverte → feed → Moods → personnes
→ interactions → messagerie → événements → réservation
→ paiement si nécessaire → billet → vie réelle → retour TipTop
```

Ces écrans restent **distincts**. La richesse vient des liens, pas d’un écran unique.

| Étape | Statut | Commentaire |
| --- | --- | --- |
| Inscription / OTP | Prêt (démo) | Mock `1234` volontaire. SMS réel = reste. |
| Profil | Prêt | Architecture conservée. |
| Découverte / proximité | Prêt | Opt-in localisation, pas de GPS exact forcé. |
| Feed Home | Prêt | Mix validé — ne pas réinventer. |
| Moods | Prêt | Page immersive. CTA contextuels. |
| Personnes / follow / ami | Prêt | Compteurs follow profil encore partiels. |
| Messagerie | Prêt | Uploads désormais authentifiés. |
| Événements | Prêt | Création, édition, groupes, invitations. |
| Réservation | Prêt | Gratuit = 0. Payant = prix billet. |
| Paiement | Prêt **mock** | D25. Pas de vrai PSP. |
| Billet / QR / check-in | Prêt | HMAC + consume atomique. |
| Admin | Prêt | + monétisation 0 %. |
| Commission | Prêt | 0 %, configurable, auditée. |

## Go / no-go

**Go technique pour des utilisateurs et organisateurs réels en phase démo / 0 %**, à condition de communiquer clairement :

- les paiements de billets sont un **mock** (aucun encaissement bancaire) ;
- l’OTP `1234` est un mode démo (`OTP_ALLOW_MOCK`) ;
- les CGU `/terms` sont encore un brouillon juridique.

**No-go argent réel** tant que : PSP choisi, secret webhook en prod, `SESSION_SECRET` unique, OTP SMS, CGU validées, refund → invalidation ticket.

## Reste à développer (hors ce tour)

1. Provider de paiement réel (ports déjà prévus).
2. SMS OTP + retrait progressif du mock.
3. `SESSION_SECRET` / CORS / `PAYMENT_WEBHOOK_SECRET` en variables prod.
4. Refund / cancel → void tickets.
5. Hide Mood côté admin (colonne + filtres).
6. ACTIONED report → masquage mood / message.
7. Suppression de compte.
8. CGU / privacy UI juridiques.
9. Analytics produit (inscription, vue, mood, paiement, check-in…).
10. Compteurs follow sur le profil (sans changer l’architecture).
11. Push réel (D27).
12. IA reco / modération — **pas** un prérequis lancement.

## Vérifications automatisées

- `packages/domain` : breakdown commission, webhook auth, `canChangePlatformFee`.
- Uploads : présence d’auth avant écriture disque.
- Tests booking / admin existants conservés.
