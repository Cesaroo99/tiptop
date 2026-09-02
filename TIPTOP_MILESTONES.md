# TipTop — paliers de likes

Les paliers se déclenchent sur le **temps total reçu** (`beneficiaryUserId`), pas sur un compteur d’unités.

## Configuration

Clé `AppConfig.likeMilestones` (JSON). Défaut domaine `DEFAULT_LIKE_MILESTONES` :

| id | Secondes |
|---|---|
| `1m` | 60 |
| `1h` | 3600 |
| `1d` | 86400 |
| `1w` | 604800 |
| `1mo` | 2592000 (30 j d’affichage) |
| `1y` | 31536000 (365 j d’affichage) |
| `5y` | 5 ans |
| `10y` | 10 ans |

Ne pas hardcoder les seuils dans les composants UI.

## Détection

`crossedMilestones(fromSeconds, toSeconds)` : paliers tels que `from < seuil ≤ to`.

Table `UserMilestone` : `user_id`, `milestone_id`, `achieved_at`, `notified_at`. Unique `(userId, milestoneId)`.

Un palier n’est célébré **qu’une fois**. Un refresh ne le rejoue pas.

## UI

`GET /likes/milestones` → files d’attente non notifiées.  
`POST /likes/milestones/:id/ack` pose `notifiedAt`.

Composant `LikeMilestoneCelebration` : animation légère, titre, durée, message, fermer.

Le seed marque les paliers déjà atteints comme notifiés, pour ne pas spammer César au premier chargement.
