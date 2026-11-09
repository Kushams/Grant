import path from "node:path";
import "@testing-library/jest-dom/vitest";

// Must be set before any module imports src/lib/db.ts.
process.env.DATABASE_URL = `file:${path.resolve(__dirname, ".tmp", "test.db")}`;
