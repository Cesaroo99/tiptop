# TipTop — personnes autour de moi

Outil de **découverte réelle**, pas un dating obligatoire.

## Cas d’usage

Restaurant → Personnes autour de moi → filtres → profil disponible → envies / intérêts → inviter à me rejoindre → notification → conversation → rencontre.

## Confidentialité

- Jamais de GPS exact sans consentement.
- `locationPrecision` : `EXACT` / `ZONE` / `CITY` / `HIDDEN`.
- `HIDDEN` : la personne **n’apparaît pas** dans nearby.
- Distance : libellé approximatif (`500 m`, `2 km`) via `formatApproxDistance`. Seaux de 100 m sous 1 km, puis km entiers.

## Disponibilité

🟢 Disponible / ⚪ Indisponible.  
Le CTA « Inviter à me rejoindre » n’est actif que si la personne est disponible.

## Filtres

Ville / zone, distance max, âge, profession, disponibles seulement, catégorie d’envie.

Les intérêts dédiés n’existent pas encore en schéma : v1 = profession + envies publiques.

## Swipe

Suivant / précédent / passer / voir profil / message / inviter. Découverte, pas un match.

## API

`GET /discovery/people?city&zone&maxKm&minAge&maxAge&available=1&profession&wishCategory`
