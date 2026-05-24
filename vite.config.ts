import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use react-app.html as the entry for the Vite/React SPA
  // (index.html is kept for the legacy vanilla-JS GitHub Pages deploy)
  root: ".",
  build: {
    rollupOptions: {
      input: resolve(__dirname, "react-app.html"),
    },
    outDir: "dist/react",
  },
});
