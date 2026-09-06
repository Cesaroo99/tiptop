#!/usr/bin/env bash
# Build natif (si Docker n’est pas utilisé) : pnpm via npx, domain + API + Next standalone.
set -euo pipefail
export CI=true
export NEXT_TELEMETRY_DISABLED=1
npx --yes pnpm@10.34.5 install --frozen-lockfile --prod=false
npx --yes pnpm@10.34.5 --filter @tiptop/api exec prisma generate
npx --yes pnpm@10.34.5 --filter @tiptop/web build
node scripts/copy-next-standalone.mjs
