# Build Render (machine de build) + runtime free 512 Mo.
FROM node:20-bookworm-slim
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g pnpm@10.34.5

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/e2e/package.json apps/e2e/package.json
COPY packages/domain/package.json packages/domain/package.json
COPY packages/i18n/package.json packages/i18n/package.json

ENV CI=true
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max-old-space-size=1536
RUN pnpm install --frozen-lockfile --prod=false

COPY . .
RUN pnpm --filter @tiptop/api exec prisma generate \
  && pnpm --filter @tiptop/web build \
  && node scripts/copy-next-standalone.mjs

ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=256
EXPOSE 10000
CMD ["node", "scripts/render-start.mjs"]
