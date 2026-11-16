import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: "./",
    // The business rules run in Node; a component spec opts into jsdom with a file comment.
    environment: "node",
    include: ["src/**/*.spec.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/core/**", "src/services/**", "src/adapters/**"],
    },
  },
});
