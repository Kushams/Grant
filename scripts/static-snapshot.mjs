// Builds a read-only STATIC snapshot of the public pages for GitHub Pages.
// The real app needs a Node server + database; this just captures what an anonymous visitor sees.
// Usage: node scripts/static-snapshot.mjs [basePath=/Grant] [outDir=preview-site]
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const base = (process.argv[2] ?? "/Grant").replace(/\/$/, "");
const out = path.resolve(process.argv[3] ?? "preview-site");
const port = 3200;
const tmp = path.resolve("e2e", ".tmp");
fs.mkdirSync(tmp, { recursive: true });
const db = path.join(tmp, "snapshot.db");
for (const f of [db, `${db}-journal`]) if (fs.existsSync(f)) fs.rmSync(f);

const env = { ...process.env, DATABASE_URL: `file:${db}`, NEXT_PUBLIC_BASE_PATH: base, SESSION_COOKIE_SECURE: "false", ...(process.env.SNAPSHOT_MODE === "demo" ? { SITE_MODE: "demo" } : { SITE_MODE: "" }) };
const run = (cmd, args, extra = {}) => { const r = spawnSync(cmd, args, { stdio: "inherit", env: { ...env, ...extra } }); if (r.status !== 0) process.exit(r.status ?? 1); };
run("npx", ["prisma", "migrate", "deploy"]);
// Live mode (default): an empty database, no sample data. Set SNAPSHOT_MODE=demo to seed the labelled demo data instead.
const demo = process.env.SNAPSHOT_MODE === "demo";
if (demo) run("npx", ["tsx", "prisma/seed.ts"], { NODE_ENV: "development" });
run("npx", ["next", "build"], { NODE_ENV: "production" });

spawnSync("fuser", ["-k", `${port}/tcp`], { stdio: "ignore" }); // clear a leftover server from an earlier run
const server = spawn("npx", ["next", "start", "-p", String(port)], { stdio: "ignore", detached: true, env: { ...env, NODE_ENV: "production" } });
const stopServer = () => { try { process.kill(-server.pid); } catch {} };
const origin = `http://localhost:${port}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; i < 60; i++) { try { if ((await fetch(`${origin}${base}`)).ok) break; } catch {} await sleep(500); }

const BANNER = () => `<div id="nen-preview-banner" style="position:fixed;left:0;right:0;bottom:0;z-index:2147483647;background:#0c1a2e;color:#fff;font:600 13px/1.4 system-ui,sans-serif;padding:8px 14px;text-align:center">Static preview snapshot — sign-in, forms, search and dashboards are disabled here. ${demo ? " All content is fictional demo data." : " Applications are not open yet."}</div><script>document.addEventListener("submit",function(e){e.preventDefault();e.stopImmediatePropagation();alert("This is a static preview, so forms are disabled. Run the app locally for the full experience (see README).");},true);</script>`;
const SKIP = /^\/(dashboard|admin|access-denied)(\/|$)/;

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const seen = new Set();
const queue = ["/"];
while (queue.length) {
  const route = queue.shift();
  if (seen.has(route)) continue;
  seen.add(route);
  const res = await fetch(`${origin}${base}${route === "/" ? "" : route}`, { redirect: "manual" });
  if (res.status !== 200) { console.log(`skip ${route} (${res.status})`); continue; }
  let html = await res.text();
  for (const m of html.matchAll(/href="([^"#?]+)"/g)) {
    const h = m[1];
    if (!h.startsWith(`${base}/`) && h !== base) continue;
    const r = h.slice(base.length) || "/";
    if (/\.(png|svg|ico|css|js|txt|xml)$/.test(r) || r.startsWith("/_next") || SKIP.test(r) || seen.has(r)) continue;
    queue.push(r.replace(/\/$/, "") || "/");
  }
  html = html.replace("</body>", `${BANNER()}</body>`);
  const file = route === "/" ? path.join(out, "index.html") : path.join(out, route, "index.html");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  console.log(`saved ${route}`);
}
// 404 page
const nf = await fetch(`${origin}${base}/does-not-exist`);
fs.writeFileSync(path.join(out, "404.html"), (await nf.text()).replace("</body>", `${BANNER()}</body>`));
// Static assets + icon
fs.cpSync(path.resolve(".next/static"), path.join(out, "_next/static"), { recursive: true });
for (const f of ["/icon.svg"]) { const r = await fetch(`${origin}${base}${f}`); if (r.ok) fs.writeFileSync(path.join(out, f), Buffer.from(await r.arrayBuffer())); }
fs.writeFileSync(path.join(out, ".nojekyll"), "");
stopServer();
console.log(`\nSnapshot: ${out} (${seen.size} routes)`);
process.exit(0);
