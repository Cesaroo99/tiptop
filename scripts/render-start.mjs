#!/usr/bin/env node
/**
 * Un seul service Render free : migrate + seed démo rapide, puis
 * proxy public → Next (UI) + Nest (API / sockets).
 * Le seed complet (1600+ lignes) n’est pas lancé : trop lourd pour 512 Mo.
 */
import { spawn } from "node:child_process";
import http from "node:http";
import net from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicPort = Number(process.env.PORT ?? 10000);
const webPort = Number(process.env.WEB_PORT ?? 3000);
const apiPort = Number(process.env.API_PORT ?? 3001);

if (process.env.DATABASE_URL && !/[?&]sslmode=/.test(process.env.DATABASE_URL)) {
  const sep = process.env.DATABASE_URL.includes("?") ? "&" : "?";
  process.env.DATABASE_URL = `${process.env.DATABASE_URL}${sep}sslmode=require`;
}

function run(command, args, extraEnv = {}) {
  const child = spawn(command, args, {
    cwd: root,
    env: { ...process.env, ...extraEnv },
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

function runOnce(command, args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: process.env,
      stdio: "inherit",
    });
    child.on("exit", (code) =>
      code === 0 ? resolvePromise() : reject(new Error(`${command} ${args.join(" ")} → ${code}`)),
    );
  });
}

function isApi(url = "") {
  return url.startsWith("/api") || url.startsWith("/socket.io") || url.startsWith("/realtime");
}

function proxyHttp(req, res, port) {
  const up = http.request(
    {
      hostname: "127.0.0.1",
      port,
      path: req.url,
      method: req.method,
      headers: req.headers,
    },
    (incoming) => {
      res.writeHead(incoming.statusCode ?? 502, incoming.headers);
      incoming.pipe(res);
    },
  );
  up.on("error", () => {
    if (!res.headersSent) res.writeHead(502).end("TipTop indisponible");
  });
  req.pipe(up);
}

function proxyUpgrade(req, socket, head, port) {
  const up = net.connect(port, "127.0.0.1", () => {
    const lines = [`${req.method} ${req.url} HTTP/1.1`];
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) lines.push(`${key}: ${Array.isArray(value) ? value.join(", ") : value}`);
    }
    up.write(`${lines.join("\r\n")}\r\n\r\n`);
    if (head?.length) up.write(head);
    up.pipe(socket);
    socket.pipe(up);
  });
  up.on("error", () => socket.destroy());
}

async function waitFor(url, tries = 80) {
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

console.log("[render] prisma migrate deploy");
await runOnce("pnpm", ["--filter", "@tiptop/api", "exec", "prisma", "migrate", "deploy"]);

try {
  console.log("[render] seed démo (César / Erica)");
  await runOnce("pnpm", ["--filter", "@tiptop/api", "prisma:seed-demo"]);
} catch (err) {
  console.error("[render] seed démo ignoré :", err);
}

run("pnpm", ["--filter", "@tiptop/api", "exec", "tsx", "src/main.ts"], {
  API_PORT: String(apiPort),
  PORT: String(apiPort),
});
run("pnpm", ["--filter", "@tiptop/web", "start", "--", "--port", String(webPort)], {
  PORT: String(webPort),
});

await waitFor(`http://127.0.0.1:${apiPort}/api/health`);

const server = http.createServer((req, res) => {
  proxyHttp(req, res, isApi(req.url) ? apiPort : webPort);
});
server.on("upgrade", (req, socket, head) => {
  proxyUpgrade(req, socket, head, isApi(req.url) ? apiPort : webPort);
});
server.listen(publicPort, "0.0.0.0", () => {
  console.log(`[render] TipTop public :${publicPort} → web :${webPort} / api :${apiPort}`);
});
