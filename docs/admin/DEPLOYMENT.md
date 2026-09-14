# Déploiement Command Center

## Infrastructure actuelle

TipTop tourne sur **Render** (Docker + Postgres), URL app : `https://tiptop-phone.onrender.com` (branche `main`). Blueprint : `render.yaml`.

Il n’existe **pas** aujourd’hui d’URL `admin.tiptop.ca` ni de staging automatique. Ne pas inventer une URL.

## Environnements

| Env | Données | Usage |
| --- | --- | --- |
| development | locale / seed | `.env` développeur |
| staging | à créer (Render preview ou second service) | validation, **pas** le ledger prod |
| production | `tiptop-db` Render | données réelles |

Ne jamais pointer le dev sur la base finance de production.

## Sous-domaine admin

1. Créer un enregistrement DNS `admin.tiptop.ca` (CNAME vers le service Render, ou le même service).
2. Ajouter le hostname custom dans Render (SSL automatique).
3. Le middleware Next réécrit `admin.*` → `/admin`.
4. Poser `WEB_ORIGIN` avec l’origine réelle (cookies).

## Build

```bash
pnpm --filter @tiptop/domain test
pnpm --filter @tiptop/web test
pnpm --filter @tiptop/web build
```

Le Dockerfile racine build API + web. Les migrations Prisma doivent s’appliquer au boot / release (`prisma migrate deploy`).

## CI

`.github/workflows/ci.yml` lance les tests domain + web. Un commit défectueux ne déploie pas tout seul : Render déploie `main` uniquement après merge.
