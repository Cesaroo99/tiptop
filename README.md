# TipTop

Réseau social pour **reconnecter les gens au monde réel**.

Phase actuelle : **parcours réel fermé (Phase 9)** — avis G22, Message Amies → DM, aide à jour.

## Démarrer

```bash
# PostgreSQL + Redis (Docker) ou services locaux
# docker compose up -d

pnpm install
pnpm --filter @tiptop/api prisma generate
pnpm --filter @tiptop/api exec prisma migrate dev --name init
pnpm db:seed
pnpm dev:api
pnpm dev:web
```

Ouvre `http://localhost:3000` — splash puis login.

**Démo :** `+237 695 21 47 85` / OTP `1234`

## Documents

| Document | Rôle |
| --- | --- |
| [TIPTOP_PRODUCT_AUDIT.md](./TIPTOP_PRODUCT_AUDIT.md) | Audit maquettes |
| [TIPTOP_PRODUCT_DECISIONS.md](./TIPTOP_PRODUCT_DECISIONS.md) | Décisions |
| [TIPTOP_SCREEN_MATRIX.md](./TIPTOP_SCREEN_MATRIX.md) | Écrans |
| [TIPTOP_USER_FLOWS.md](./TIPTOP_USER_FLOWS.md) | Parcours |
| [TIPTOP_ARCHITECTURE.md](./TIPTOP_ARCHITECTURE.md) | Architecture |
| [TIPTOP_DATABASE.md](./TIPTOP_DATABASE.md) | Schéma |
| [TIPTOP_TESTING.md](./TIPTOP_TESTING.md) | Tests |
| [TIPTOP_QA_AUDIT.md](./TIPTOP_QA_AUDIT.md) | Audit QA Phase 8 |
| [TIPTOP_ENVIRONMENT.md](./TIPTOP_ENVIRONMENT.md) | Env |
| [docs/PHASES.md](./docs/PHASES.md) | Checklist |
| [docs/mockups/](./docs/mockups/) | Maquettes (ne pas supprimer) |

## Tests

```bash
pnpm --filter @tiptop/domain test
pnpm --filter @tiptop/api test
pnpm test:e2e
```
