# Firebase

**État actuel : hors stack.**

TipTop n’utilise pas Firebase Authentication, Firestore, Storage, FCM ni App Check.

| Service | État | Réalité TipTop |
| --- | --- | --- |
| Authentication | ⚪ Disabled | OTP + cookie session |
| Firestore | ⚪ Disabled | PostgreSQL / Prisma |
| Storage | ⚪ Disabled | URLs locales / seed |
| FCM | ⚪ Disabled | Push no-op, notifs in-app |
| App Check | ⚪ Disabled | — |

L’admin affiche **Non configuré / hors stack**, jamais « Firebase connecté ».

Si l’équipe décide d’ajouter Firebase plus tard : créer un projet Google Cloud, activer les APIs, poser les variables (sans les committer), puis brancher un adapter. Ce n’est pas requis pour administrer TipTop aujourd’hui.
