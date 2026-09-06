#!/usr/bin/env node
/**
 * Render free (512 Mo) : écoute $PORT tout de suite (health 200),
 * puis migrate + API compilée + Next standalone. Pas de pnpm/tsx au runtime.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import http from "node:http";
import net from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicPort = Number(process.env.PORT ?? 10000);
const webPort = Number(process.env.WEB_PORT ?? 3000);
const apiPort = Number(process.env.API_PORT ?? 3001);
const apiDir = resolve(root, "apps/api");

let apiReady = false;
let webReady = false;

if (process.env.DATABASE_URL && !/[?&]sslmode=/.test(process.env.DATABASE_URL)) {
  const sep = process.env.DATABASE_URL.includes("?") ? "&" : "?";
  process.env.DATABASE_URL = `${process.env.DATABASE_URL}${sep}sslmode=require`;
}
if (process.env.DATABASE_URL && !/[?&]connection_limit=/.test(process.env.DATABASE_URL)) {
  const sep = process.env.DATABASE_URL.includes("?") ? "&" : "?";
  process.env.DATABASE_URL = `${process.env.DATABASE_URL}${sep}connection_limit=5`;
}

function firstExisting(paths) {
  const hit = paths.find((p) => existsSync(p));
  if (!hit) throw new Error(`Introuvable : ${paths.join(" | ")}`);
  return hit;
}

function run(command, args, extraEnv = {}, cwd = root) {
  const child = spawn(command, args, {
    cwd,
    env: {
      ...process.env,
      NODE_OPTIONS: extraEnv.NODE_OPTIONS ?? "--max-old-space-size=192",
      ...extraEnv,
    },
    stdio: "inherit",
  });
  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`[render] ${command} ${args.join(" ")} exit ${code}`);
      process.exit(code);
    }
  });
  return child;
}

function runOnce(command, args, cwd = root) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd, env: process.env, stdio: "inherit" });
    child.on("exit", (code) =>
      code === 0 ? resolvePromise() : reject(new Error(`${command} ${args.join(" ")} → ${code}`)),
    );
  });
}

function isApi(url = "") {
  return url.startsWith("/api") || url.startsWith("/socket.io") || url.startsWith("/realtime");
}

function isHealth(url = "") {
  return url.split("?")[0] === "/api/health";
}

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
]);

function proxyHeaders(req, port) {
  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (!value || HOP_BY_HOP.has(key.toLowerCase())) continue;
    headers[key] = value;
  }
  headers.host = `127.0.0.1:${port}`;
  return headers;
}

function proxyHttp(req, res, port) {
  const up = http.request(
    {
      hostname: "127.0.0.1",
      port,
      path: req.url,
      method: req.method,
      headers: proxyHeaders(req, port),
    },
    (incoming) => {
      res.writeHead(incoming.statusCode ?? 502, incoming.headers);
      incoming.pipe(res);
    },
  );
  up.on("error", () => {
    if (!res.headersSent) {
      res.writeHead(503, { "content-type": "application/json" });
      res.end(JSON.stringify({ code: "BOOTING", message: "TipTop démarre…" }));
    }
  });
  req.pipe(up);
}

function proxyUpgrade(req, socket, head, port) {
  const up = net.connect(port, "127.0.0.1", () => {
    const lines = [`${req.method} ${req.url} HTTP/1.1`, `Host: 127.0.0.1:${port}`];
    for (const [key, value] of Object.entries(req.headers)) {
      if (!value || HOP_BY_HOP.has(key.toLowerCase())) continue;
      lines.push(`${key}: ${Array.isArray(value) ? value.join(", ") : value}`);
    }
    up.write(`${lines.join("\r\n")}\r\n\r\n`);
    if (head?.length) up.write(head);
    up.pipe(socket);
    socket.pipe(up);
  });
  up.on("error", () => socket.destroy());
}

async function waitFor(url, tries = 90) {
  for (let i = 0; i < tries; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* still booting */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Timeout: ${url}`);
}

async function migrateWithRetry(prismaBin) {
  for (let i = 0; i < 8; i += 1) {
    try {
      console.log("[render] prisma migrate deploy");
      await runOnce(prismaBin, ["migrate", "deploy"], apiDir);
      return;
    } catch (err) {
      console.error("[render] migrate retry", i + 1, err);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  throw new Error("prisma migrate deploy a échoué");
}

async function boot() {
  const prismaBin = firstExisting([
    resolve(root, "node_modules/.bin/prisma"),
    resolve(apiDir, "node_modules/.bin/prisma"),
  ]);
  const tsxBin = firstExisting([
    resolve(root, "node_modules/.bin/tsx"),
    resolve(apiDir, "node_modules/.bin/tsx"),
  ]);
  const webEntry = firstExisting([
    resolve(root, "apps/web/.next/standalone/apps/web/server.js"),
    resolve(root, "apps/web/.next/standalone/server.js"),
  ]);

  await migrateWithRetry(prismaBin);

  run(tsxBin, ["src/main.ts"], { API_PORT: String(apiPort), PORT: String(apiPort) }, apiDir);
  await waitFor(`http://127.0.0.1:${apiPort}/api/health`);
  apiReady = true;
  console.log("[render] API prête");

  void runOnce(tsxBin, ["prisma/seed.ts"], apiDir)
    .then(() => console.log("[render] seed complet OK"))
    .catch((err) => console.error("[render] seed complet ignoré :", err));

  run(
    "node",
    [webEntry],
    {
      PORT: String(webPort),
      HOSTNAME: "127.0.0.1",
      API_INTERNAL_URL: `http://127.0.0.1:${apiPort}`,
    },
    dirname(webEntry),
  );
  try {
    await waitFor(`http://127.0.0.1:${webPort}/`);
    webReady = true;
    console.log("[render] Next prêt");
  } catch {
    console.error("[render] Next lent, le proxy reste ouvert");
  }
}

const server = http.createServer((req, res) => {
  if (isHealth(req.url ?? "")) {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "tiptop", api: apiReady, web: webReady }));
    return;
  }
  proxyHttp(req, res, isApi(req.url) ? apiPort : webPort);
});
server.on("upgrade", (req, socket, head) => {
  proxyUpgrade(req, socket, head, isApi(req.url) ? apiPort : webPort);
});
server.listen(publicPort, "0.0.0.0", () => {
  console.log(`[render] écoute :${publicPort} (health immédiat)`);
  void boot().catch((err) => {
    console.error("[render] boot fatal", err);
    process.exit(1);
  });
});
