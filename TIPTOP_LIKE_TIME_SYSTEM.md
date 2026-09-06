# TipTop — système de like temporel

Le like TipTop **n’est pas un compteur**. C’est une **durée**.

```
LIKE + DURÉE = TEMPS DE LIKE
```

## Source de vérité

Table `LikePeriod` :

| Champ | Rôle |
|---|---|
| `actorId` | Donneur |
| `targetType` / `targetId` | Cible polymorphe (`USER`, `POST`, `COMMENT`, `MOOD`, `WISH`) |
| `beneficiaryUserId` | Propriétaire de la cible (agrégation profil) |
| `startedAt` | Début |
| `endedAt` | Fin (`null` = encore actif) |
| `weight` | Poids (v1 = 1) |
| `unitId` | Unité d’attribution consommée |

La durée **n’est jamais incrémentée en base chaque seconde**.

```
durée = (endedAt ?? now) - startedAt
```

Le frontend peut afficher la progression live à partir de `startedAt` / `totalSeconds` + `activeCount`.

## Transfert

Une unité n’a **qu’une période active** (index unique partiel `like_period_one_active`).

Transférer César → Alice vers César → Sarah :

1. clôturer la période Alice (`endedAt`) ;
2. conserver les 40 minutes dans l’historique ;
3. ouvrir une période Sarah.

## Agrégation (anti double comptage)

Une période compte **une seule fois**, via `beneficiaryUserId`.

- Publication de César likée 50 min → César +50 min (pas +50 min publication **et** +50 min profil).
- Commentaire, mood, envie : même règle (bénéficiaire = auteur / propriétaire).
- Like posé **sur la personne** (`USER`) : bénéficiaire = cette personne.

Le profil est la **somme des périodes distinctes** reçues, pas une somme des totaux d’écrans.

## Unités d’attribution

- 1 like personnel (`LikeUnit` `FREE`) par compte.
- Packs mock (`PURCHASED`) = **unités d’attribution supplémentaires**.
- L’achat **ne crée pas** de temps reçu. Le temps naît seulement tant que l’unité reste posée.

## Certifiés (D15 / à valider)

`CERTIFIED_LIKE_WEIGHT = 1`. Un compte certifié n’ajoute **pas** de double temps en v1. Décision produit encore ouverte si le fondateur veut un poids ×2.

## Coups de cœur événements

Restent un système **distinct** (`EventHeart`). L’architecture temporelle n’est **pas** imposée aux coups de cœur tant que le produit ne le tranche pas.

## Formatage

`formatLikeDuration(seconds)` — secondes internes, affichage court :

- &lt; 60 s → secondes
- &lt; 60 min → `N min`
- &lt; 24 h → `H h M min`
- &lt; 30 j → `J jours H h`
- &lt; 365 j → `M mois J jours`
- ≥ 1 an → `A ans M mois`

Convention d’affichage (pas un calendrier civil) :

- 1 mois affiché = 30 × 86400 s
- 1 an affiché = 365 × 86400 s

Exemple : 3723 s → `1 h 2 min` (la base garde `3723`).

## Cache

`UserLikeStats.closedSeconds` est un cache des périodes **closes**. Le total affiché se recalcule depuis l’historique + périodes actives. L’intégrité prime sur le cache.

## API

- `POST /likes` `{ targetType, targetId, confirmTransfer }`
- `DELETE /likes` même corps
- `GET /likes/target/:type/:id`
- `GET /users/:id/like-time`
- `GET /users/:id/like-history`
- `GET /likes/leaderboard?city&window=all|week|month`
- Routes historiques `POST/DELETE /users/:id/like` conservées (cible `USER`).
