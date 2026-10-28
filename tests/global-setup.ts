import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export const TEST_DB = path.resolve(__dirname, ".tmp", "test.db");

/** Builds a fresh SQLite database from the real migrations (including append-only triggers). */
export default function setup() {
  fs.mkdirSync(path.dirname(TEST_DB), { recursive: true });
  for (const f of [TEST_DB, `${TEST_DB}-journal`]) if (fs.existsSync(f)) fs.rmSync(f);
  execSync("npx prisma migrate deploy", {
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: `file:${TEST_DB}` },
  });
}
