import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/** Unit tests for the app's logic (`npm test`): services, the API layer and helpers. */
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { environment: "node", include: ["src/**/*.test.ts"], restoreMocks: true },
});
