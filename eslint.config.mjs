import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "coverage/**", "src/generated/**", "playwright-report/**", "test-results/**", "preview-site/**", "e2e/.tmp/**", "tests/.tmp/**", "next-env.d.ts"]),
]);
