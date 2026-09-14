# TipTop Intelligence Engine

TipTop n’est pas une IA de scroll. Le moteur aide à **vivre des expériences réelles**.

## Architecture

| Couche | Rôle |
| --- | --- |
| `@tiptop/domain` `intelligence.ts` | Signaux, scoring, plan, matching, monde, consentement — déterministe |
| `apps/api/src/intelligence` | Orchestration Prisma + endpoints |
| `AiProvider` | Abstraction LLM (`OPENAI_API_KEY`) + fallback règles |
| UI | Accueil (jour), recherche / `/plan`, événement (personnes), menu (`/world`, `/agent`), paramètres |

Les recommandations combinent **données structurées + règles métier + IA optionnelle**. Un event jamais inventé : seules les sorties `PUBLISHED` existantes sont proposées à la réservation. Les étapes « idée locale » sont marquées `hint` et non bookables.

## Consentement (opt-in social / agent)

- Recos personnalisées : on par défaut
- Historique : on par défaut
- Matching social : **off**
- Agent : **off**
- L’agent ne contacte jamais un humain (`agentMayContactPeer() === false`)
- GPS exact jamais renvoyé (libellé `<1 km` / `N km`)

## Variables

| Var | Usage |
| --- | --- |
| `OPENAI_API_KEY` | Optionnel. Sans clé : parseur de contraintes domaine |
| `OPENAI_MODEL` | Défaut `gpt-4o-mini` |

## Quotas

8 plans / h, 12 questions agent / h, 40 signaux / h (process local).
