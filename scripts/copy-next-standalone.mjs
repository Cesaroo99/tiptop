#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const web = resolve(root, "apps/web");
const standaloneRoot = resolve(web, ".next/standalone");
const nested = resolve(standaloneRoot, "apps/web");
const dest = existsSync(resolve(nested, "server.js")) ? nested : standaloneRoot;

if (!existsSync(resolve(dest, "server.js"))) {
  console.warn("[render] standalone server.js introuvable, next start classique sera utilisé");
  process.exit(0);
}

const staticSrc = resolve(web, ".next/static");
const publicSrc = resolve(web, "public");
const staticDest = resolve(dest, ".next/static");
const publicDest = resolve(dest, "public");
mkdirSync(resolve(dest, ".next"), { recursive: true });
if (existsSync(staticSrc)) cpSync(staticSrc, staticDest, { recursive: true });
if (existsSync(publicSrc)) cpSync(publicSrc, publicDest, { recursive: true });
console.log(`[render] standalone assets → ${dest}`);
