// Prepares an isolated e2e database and serves a production build of the app.
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const port = process.argv[2] ?? "3100";
const dir = path.resolve("e2e", ".tmp");
fs.mkdirSync(dir, { recursive: true });
const db = path.join(dir, "e2e.db");
for (const f of [db, `${db}-journal`]) if (fs.existsSync(f)) fs.rmSync(f);

const env = {
  ...process.env,
  DATABASE_URL: `file:${db}`,
  DEMO_SEED_PASSWORD: "Demo-Passw0rd!",
  SESSION_COOKIE_SECURE: "false", // plain-HTTP localhost
  NODE_ENV: "production",
};
const run = (cmd, args, extra = {}) => {
  const r = spawnSync(cmd, args, { stdio: "inherit", env: { ...env, ...extra }, shell: false });
  if (r.status !== 0) process.exit(r.status ?? 1);
};
run("npx", ["prisma", "migrate", "deploy"]);
// The seed refuses NODE_ENV=production, so run it as development.
run("npx", ["tsx", "prisma/seed.ts"], { NODE_ENV: "development" });
if (!process.env.E2E_SKIP_BUILD) run("npx", ["next", "build"]);
const server = spawn("npx", ["next", "start", "-p", port], { stdio: "inherit", env });
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => { server.kill(sig); process.exit(0); });
server.on("exit", (c) => process.exit(c ?? 0));
