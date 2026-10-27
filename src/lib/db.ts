import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { __prisma?: PrismaClient };

export function createPrismaClient(url = process.env.DATABASE_URL ?? "file:./dev.db"): PrismaClient {
  // Production note: swap this adapter + the schema datasource provider for PostgreSQL.
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter, log: process.env.PRISMA_LOG === "1" ? ["query", "error"] : [] });
}

export const db: PrismaClient = globalForPrisma.__prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.__prisma = db;

export type Db = PrismaClient;
// Prisma interactive-transaction client type, accepted by service helpers.
export type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];
