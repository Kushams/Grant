import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7 reads the datasource URL from this file (not from schema.prisma).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  },
});
