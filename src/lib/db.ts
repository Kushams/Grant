import { createRequire } from "node:module";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { __prisma?: PrismaClient };

type D1Binding = ConstructorParameters<typeof PrismaD1>[0];

// On Cloudflare Workers the database is the D1 binding named "DB" (see wrangler.jsonc);
// everywhere else (local dev, tests) it is a SQLite file through better-sqlite3.
// The SQLite adapter is loaded with a Node require so the Workers bundle never loads the
// native module: the D1 branch above is the only one that runs there.
function cloudflareD1(): D1Binding | null {
  try {
    const env = getCloudflareContext().env as unknown as { DB?: D1Binding };
    return env.DB ?? null;
  } catch {
    return null;
  }
}

export function createPrismaClient(url = process.env.DATABASE_URL ?? "file:./dev.db"): PrismaClient {
  const d1 = cloudflareD1();
  if (d1) {
    const client = new PrismaClient({ adapter: new PrismaD1(d1), log: process.env.PRISMA_LOG === "1" ? ["query", "error"] : [] });
    // Cloudflare D1 does not support interactive transactions: Prisma's D1 adapter throws
    // "Cloudflare D1 does not support interactive transactions" for $transaction(async tx => ...).
    // The service layer uses that form throughout, so on D1 the callback is run against the
    // client itself — its operations execute sequentially in order, just without atomic
    // rollback. The array form $transaction([...]) is a real D1 batch and passes through.
    const batchTransaction = client.$transaction.bind(client) as (...args: unknown[]) => unknown;
    (client as unknown as { $transaction: unknown }).$transaction = (arg: unknown, options?: unknown) =>
      typeof arg === "function"
        ? (arg as (tx: PrismaClient) => Promise<unknown>)(client)
        : batchTransaction(arg, options);
    return client;
  }
  const nodeRequire = createRequire(import.meta.url);
  const { PrismaBetterSqlite3 } = nodeRequire("@prisma/adapter-better-sqlite3") as typeof import("@prisma/adapter-better-sqlite3");
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter, log: process.env.PRISMA_LOG === "1" ? ["query", "error"] : [] });
}

// Lazily created on first use: on Workers the D1 binding only exists inside a request
// context, so the client cannot be built at module load the way the Node version was.
let instance: PrismaClient | undefined;

function getDb(): PrismaClient {
  if (!instance) {
    instance = globalForPrisma.__prisma ?? createPrismaClient();
    if (process.env.NODE_ENV !== "production") globalForPrisma.__prisma = instance;
  }
  return instance;
}

export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getDb() as unknown as Record<string | symbol, unknown>;
    const value = client[prop];
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(client) : value;
  },
});

export type Db = PrismaClient;
// Prisma interactive-transaction client type, accepted by service helpers.
export type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];
