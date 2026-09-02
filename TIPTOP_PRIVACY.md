# TipTop — confidentialité, sécurité, modération

## Localisation (#32, #42, #57)

Quatre niveaux inchangés (`LocationPrecision`) : `EXACT`, `ZONE`, `CITY`, `HIDDEN`. Jamais de coordonnées exactes exposées côté client au-delà du niveau choisi. Distance toujours approximative (`formatApproxDistance` : paliers de 100 m sous 1 km, puis km entiers).

## Accès aux données (#55)

Vérifié pour chaque nouvelle ressource ajoutée dans cette phase :

| Ressource | Règle |
|---|---|
| `SocialInvite` | Visible uniquement par `inviterId` ou `inviteeId` (filtré côté service par l'utilisateur de session, jamais par ID dans l'URL seul) |
| Mood `activity/city/zone` | Suit la même règle de visibilité que le mood lui-même (`ZONE`/`FOLLOWERS`/`EVENT`) |
| `WishOffer` (mes propositions) | `received` filtré par `wish.ownerId = moi`, `sent` filtré par `fromUserId = moi` |
| Report `MESSAGE`/`MOOD` | Le signalant doit fournir l'ID cible ; aucune énumération possible sans le connaître déjà (l'ID est obtenu depuis un contexte où l'utilisateur a déjà accès à la ressource) |

## Anti-abus (#56)

| Risque | Protection |
|---|---|
| Spam d'invitations sociales | 20 envois/24 h max, pas de doublon en attente vers la même personne (`canSendSocialInvite`) |
| Spam de messages | Blocage utilisateur existant (`UserBlock`), inchangé |
| Faux profils / harcèlement | Signalement (`Report`) désormais possible sur profil, publication, événement, **message**, **mood** |
| Scraping de localisation | Distance toujours arrondie, jamais de coordonnées exactes en dehors du niveau `EXACT` explicitement choisi par la personne |

## Modération (#58)

`ReportKind` : `USER`, `POST`, `EVENT`, `MESSAGE` *(nouveau)*, `MOOD` *(nouveau)*. Un seul composant `ReportModal` (front) et un seul point d'entrée `POST /reports` (back), pour éviter la divergence entre les différents formulaires de signalement.

Le back-office (`/admin/reports`) affiche déjà tous les signalements ouverts indépendamment du `kind` — aucune modification nécessaire côté back-office pour supporter les deux nouveaux types.
