# TipTop — Mood

Mood = équivalent TipTop des stories, orienté vie réelle (« ce que je vis maintenant »), pas un flux de contenu passif.

## Champs (Prisma `Mood`)

| Champ | Rôle |
|---|---|
| `body` | Texte libre |
| `imageUrl` | Photo (`/seed/` uniquement en démo) |
| `activity` *(nouveau)* | Emoji + activité courte (« 🍣 Restaurant japonais »), 80 caractères max |
| `city` / `zone` *(nouveau)* | Lieu, hérité du profil de l'auteur par défaut, éditable |
| `eventId` | Lien optionnel vers un événement |
| `visibility` | `ZONE` / `FOLLOWERS` / `EVENT` |
| `expiresAt` | Expiration automatique (1-24 h, `moodExpiresAt`) |

## Mood + découverte (#20, #28)

`DiscoveryService.people` inclut le mood actif le plus récent de chaque profil retourné (`activeMood`), à condition que sa visibilité le permette (mood `ZONE` visible seulement si la ville de recherche correspond). Un mood expiré n'apparaît plus (`expiresAt > now`).

Effet UI (`/people`) :

- CTA principal devient **« Rejoindre »** (au lieu de « Inviter à me rejoindre ») quand un mood actif existe, pré-rempli avec `activity`.
- Ouvre une `SocialInviteModal` (contexte `MEETUP`) — pas un flux de réservation.

## Expiration

Purement basée sur `expiresAt`. Aucun job n'est nécessaire : chaque lecture filtre `expiresAt > now`. Un mood expiré n'est pas supprimé (conservé pour historique/modération) mais n'apparaît plus « actif ».

## Modération

`ReportKind.MOOD` (nouveau) : bouton « Signaler » sur l'écran détail (`/mood/:id`), visible pour tout utilisateur autre que l'auteur. Le composant `ReportModal` est partagé avec les publications/profils/messages.
