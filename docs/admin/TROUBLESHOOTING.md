# Dépannage

**403 ADMIN_ONLY** — le compte n’est pas staff. Vérifier `User.role` en base (jamais via le frontend seul).

**403 ADMIN_FORBIDDEN** — rôle insuffisant pour la permission (ex. support qui change la commission).

**PROTECTED_DEMO_ACCOUNT** — tentative de bloquer / rétrograder César.

**BROADCAST_CONFIRM_REQUIRED** — envoi notif à tous sans `confirmBroadcast: true`.

**Stripe / Firebase / Maps « en erreur »** — s’ils sont rouges « disabled », ce n’est pas une panne : ils ne sont pas dans la stack.

**Nominatim error** — réseau sortant bloqué ou rate-limit OSM. Le geocode app peut aussi échouer.

**OpenAI 401** — clé invalide. L’admin le teste via `GET https://api.openai.com/v1/models`.

**Colonnes Event manquantes** — `POST /admin/repair-schema` + migration `20240914120000_admin_command`.

**Admin vide après login** — cookie non envoyé (mauvais `WEB_ORIGIN` / domaine).
