import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  globalIgnores([
    ".next/**", "out/**", "public/**",
    ".local/**", "data/draft/**", "output/playwright/**",
    "scripts/checks/report/**", "scripts/checks/results/**",
  ]),
]);
