import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";

// The sandbox ships a pre-installed Chromium; use it when present.
const preinstalled = "/opt/pw-browsers/chromium";
const executablePath = fs.existsSync(preinstalled) ? undefined : undefined;
void executablePath;

const PORT = 3100;

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure", ...devices["Desktop Chrome"] },
  webServer: {
    // Uses an isolated, freshly seeded database so e2e never touches dev.db.
    command: `node e2e/prepare-and-serve.mjs ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
