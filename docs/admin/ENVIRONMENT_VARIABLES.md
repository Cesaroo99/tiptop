# Variables d’environnement

Ne jamais committer de secrets. Fichiers modèles : `.env.example`, `.env.development`, `.env.staging`, `.env.production` (placeholders).

| Variable | Service | Obligatoire | Envs | Où l’obtenir |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | Postgres | oui | tous | Render / Docker local |
| `SESSION_SECRET` | Auth cookie | oui | tous | générer aléatoire long |
| `WEB_ORIGIN` | CORS / cookies | oui | tous | URL publique web |
| `OTP_ALLOW_MOCK` | Auth démo | non | dev / démo | `1` pour code 1234 |
| `OTP_MOCK_CODE` | Auth démo | non | dev | défaut 1234 |
| `OTP_EXPIRY_SECONDS` | Auth | non | tous | défaut 90 |
| `OTP_MAX_ATTEMPTS` | Auth | non | tous | défaut 5 |
| `PAYMENT_WEBHOOK_SECRET` | Webhook mock | oui en prod | staging/prod | secret interne |
| `OPENAI_API_KEY` | IA | non | tous | platform.openai.com |
| `OPENAI_MODEL` | IA | non | tous | ex. gpt-4o-mini |
| `REDIS_URL` | cache | non | tous | défaut local |
| `NEXT_PUBLIC_API_URL` | web | non en prod | dev | vide en Render (même origine) |
| `API_INTERNAL_URL` | rewrite Next | oui Docker | prod | `http://127.0.0.1:3001` |
| `STRIPE_SECRET_KEY` | — | non | — | **non utilisé** |
| `GOOGLE_MAPS_API_KEY` | — | non | — | **non utilisé** |
| `FIREBASE_*` | — | non | — | **non utilisé** |

Configurer : `apps/api/.env`, dashboard Render → Environment, jamais le frontend pour les secrets.
