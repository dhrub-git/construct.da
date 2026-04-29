import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
      "@models": path.resolve(rootDir, "src/types"),
      "@actions": path.resolve(rootDir, "src/lib/actions"),
      "@workflows": path.resolve(rootDir, "src/lib/workflows"),
      "@auth": path.resolve(rootDir, "src/lib/auth"),
      "@data": path.resolve(rootDir, "data"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    css: true,
  },
});
