# TipTop — système de commission

## Phase initiale (3 premiers mois)

| Acteur | Montant |
| --- | --- |
| Accès utilisateur | 0 |
| Publication organisateur | 0 |
| Abonnement organisateur | 0 |
| Frais de publication | 0 |
| Événement gratuit (utilisateur) | 0 |
| Événement payant (utilisateur) | prix du billet |
| **Commission TipTop** | **0 %** |

Les organisateurs peuvent publier gratuitement et continuellement.  
Les paiements utilisateurs des billets payants **restent actifs**.

## Configuration centrale

Ne pas hardcoder `0` dans les écrans ou les services.

```ts
// packages/domain/src/payments.ts
export const TIPTOP_PLATFORM_FEE_PERCENT = 0;
export const PLATFORM_FEE_CONFIG_KEY = "platformFeePercent";
```

Valeur effective :

1. `AppConfig.platformFeePercent` si présent (JSON number) ;
2. sinon `TIPTOP_PLATFORM_FEE_PERCENT`.

Helpers :

- `normalizePlatformFeePercent(value)` — borne 0–100, défaut = constante ;
- `platformFeeXaf(ticketAmount, percent)` — part organisateur ;
- `chargeBreakdown(...)` — prix billet / commission / frais PSP / total acheteur / net organisateur.

## Qui paie quoi

```
ticketAmountXaf        = prix × sièges          → utilisateur
providerFeeXaf         = 0 (v1)                 → prestataire futur, pas TipTop
platformFeeXaf         = ticket × percent / 100 → TipTop (0 aujourd’hui)
chargeTotalXaf         = ticket + buyerPSP      → ce que l’utilisateur paie
organizerNetXaf        = ticket - platformFee - providerFee
```

À 0 %, `chargeTotalXaf === ticketAmountXaf` et `organizerNetXaf === ticketAmountXaf`.

## Administration

- Lecture : tout staff (`ADMIN`, `MODERATOR`).
- Écriture : `ADMIN` uniquement (`canChangePlatformFee`).
- Toute modification : `AdminAudit` action `SETTINGS_UPDATE`, meta `{ previous, next }`.
- UI : **Admin → Paiements** (monétisation), pas un nouvel onglet qui diluerait le back-office existant.

Changer le pourcentage **n’interrompt pas** les paiements de billets.

## Évolution future

Quand la phase initiale se termine, un admin pose par exemple `5` dans AppConfig.  
Aucun redéploiement n’est requis pour le chiffre.  
Le passage à un vrai PSP reste un sujet **paiement**, distinct de cette commission.
