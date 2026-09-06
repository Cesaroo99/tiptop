#!/usr/bin/env bash
# Build Render free : pnpm via npm (pas corepack), toutes les deps (prisma/tsx/typescript).
set -euo pipefail
export CI=true
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=1536}"
npm install -g pnpm@10.34.5
# NODE_ENV=production sur le service ferait un install --prod et casserait next/prisma.
pnpm install --frozen-lockfile --prod=false
pnpm --filter @tiptop/api exec prisma generate
pnpm --filter @tiptop/web build
