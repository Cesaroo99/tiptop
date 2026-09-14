# IA

Provider optionnel : **OpenAI**.

- `OPENAI_API_KEY` — secret serveur, masqué dans l’admin (`••••abcd`).
- `OPENAI_MODEL` — défaut `gpt-4o-mini`.

Sans clé : le moteur Intelligence utilise le parseur de règles domaine. L’admin le dit clairement.

Le Command Center (`/admin/ai`) :

- compte recos / plans / matchs / suggestions agent (tables Prisma) ;
- limites (`aiLimits` dans `AppConfig`) ;
- feature flags `aiRecommendations`, `aiAgent`, `experiencePlanner`, `matching`.

Le matching et l’agent restent **opt-in utilisateur**. L’admin peut tout couper sans redéployer.
