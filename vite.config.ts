import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative base so the built assets work at any GitHub Pages sub-path
  base: "./",
  build: {
    rollupOptions: {
      input: resolve(__dirname, "react-app.html"),
    },
    outDir: "dist/react",
    emptyOutDir: true,
  },
});
