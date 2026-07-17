import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: [
        "utils/**",
        "app/lib/actions/**",
        "app/lib/classes/**",
        "app/lib/subjects/**",
        "app/lib/regular-classes/**",
      ],
    },
  },
});
