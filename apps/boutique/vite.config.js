import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // .env(.local) est à la racine du repo, partagé par les deux apps.
  envDir: fileURLToPath(new URL("../../", import.meta.url)),
  resolve: {
    alias: {
      "@shared": fileURLToPath(new URL("../../packages/shared/src/index.js", import.meta.url)),
    },
  },
});
