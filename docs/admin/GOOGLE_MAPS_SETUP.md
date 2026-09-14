# Google Maps

**État actuel : hors stack.**

Le geocoding utilisateur passe par **Nominatim / OpenStreetMap** (`apps/web/app/geocode/*`) et les zones domaine (Yaoundé, etc.).

| API | État |
| --- | --- |
| Maps | ⚪ Disabled |
| Places | ⚪ Disabled |
| Geocoding Google | ⚪ Disabled |
| Routes | ⚪ Disabled |
| Nominatim | testé en live depuis `/admin/services` |

L’admin n’affiche jamais « Google Maps opérationnel » sans clé **et** appel réussi. Aujourd’hui : **Non configuré**.

Pour activer plus tard : projet Google Cloud, APIs Maps/Places/Geocoding/Routes, restriction de clé par HTTP referrer / IP, moyen de paiement GCP, variable `GOOGLE_MAPS_API_KEY` côté serveur uniquement.
