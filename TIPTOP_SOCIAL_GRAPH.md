# TipTop — graphe social

TipTop n'a pas de graphe « amis » symétrique classique. Il combine plusieurs relations, chacune avec un rôle précis (voir aussi `TIPTOP_PRODUCT_DECISIONS.md` D09).

## Relations existantes

| Relation | Modèle | Symétrique ? | Rôle |
|---|---|---|---|
| Suivre | `Follow` | Non | Fil social, feed |
| Contact | `Contact` | Créé en double sens à l'acceptation d'une invitation | Carnet « personnes rencontrées » |
| Blocage | `UserBlock` | Non | Sécurité |
| Like (temps) | `LikePeriod` | Non | Reconnaissance mesurable (voir `TIPTOP_LIKE_TIME_SYSTEM.md`) |

## Relations ajoutées dans cette phase

| Relation | Modèle | Rôle |
|---|---|---|
| Invitation sociale | `SocialInvite` | Pont éphémère découverte → rencontre réelle (restaurant, café, activité, rejoindre, envie) |
| Proposition d'envie | `WishOffer` | Pont don/gentillesse → expérience réelle |

## Pourquoi ne pas fusionner `Invitation` (événement) et `SocialInvite`

- `Invitation` porte une sémantique de **billetterie** : capacité, âge minimum, paiement, ticket.
- `SocialInvite` porte une sémantique de **rencontre spontanée** : pas de paiement obligatoire, pas de capacité, TTL plus long (72 h), acceptation = ouverture directe d'une conversation.

Les fusionner aurait forcé chaque invitation à transiter par un événement — contraire à l'exemple central du brief (« Je suis au restaurant, j'invite Alice à me rejoindre »).

## Formation du graphe de contacts

Un `Contact` est créé dans les deux sens lorsque :

- une invitation événement est acceptée (comportement existant, inchangé) ;
- *(à considérer plus tard)* une invitation sociale est acceptée — non fait en v1 pour ne pas gonfler artificiellement le carnet de contacts avec des sorties jamais concrétisées. Le contact se noue naturellement via la conversation ouverte.
