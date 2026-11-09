// Resets the LOCAL SQLite demo database: deletes the file, re-applies migrations, re-seeds.
// Safety: refuses in production and refuses anything that is not a local `file:` SQLite URL.
import "dotenv/config";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
if (process.env.NODE_ENV === "production") {
  console.error("Refusing to reset a database when NODE_ENV=production.");
  process.exit(1);
}
if (!url.startsWith("file:")) {
  console.error(`Refusing: DATABASE_URL (${url.split(":")[0]}:…) is not a local SQLite file.`);
  process.exit(1);
}
const file = path.resolve(url.slice("file:".length));
for (const f of [file, `${file}-journal`, `${file}-wal`, `${file}-shm`]) {
  if (fs.existsSync(f)) {
    fs.rmSync(f);
    console.log(`Deleted ${path.relative(process.cwd(), f)}`);
  }
}
const run = (args) => {
  const r = spawnSync("npx", args, { stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
};
run(["prisma", "migrate", "deploy"]);
run(["tsx", "prisma/seed.ts"]);
