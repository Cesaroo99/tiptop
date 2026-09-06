# TipTop — architecture IA (préparée, non développée)

Le prompt de lancement demande de **préparer** une architecture, pas de livrer une fonctionnalité IA.

## Points d’extension existants

| Besoin futur | Où se brancher | Aujourd’hui |
| --- | --- | --- |
| Recommandations feed | `apps/web/lib/feed-mix.ts` + `GET /feed` | Mix déterministe (posts, events, people, moods) |
| Découverte | `discovery.service.ts`, `search.service.ts` | Règles + proximité opt-in |
| Personnalisation Moods | `moodInterestScore` | Score d’intérêts simple |
| Modération | `Report` + admin hide posts/moods | Humain |
| Anti-spam | `canSubmitReport`, limites invitations / OTP | Quotas domaine |

## Règle

Aucun modèle, aucun appel LLM, aucun classifieur n’est activé au lancement.

Quand une IA sera décidée, elle consommera les mêmes événements que `TIPTOP_ANALYTICS.md` et les mêmes services — elle ne remplacera pas le feed, le Mood ou le profil.
