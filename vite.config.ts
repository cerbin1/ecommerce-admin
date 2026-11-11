import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir:
      "/home/skr/domains/portfolio.skr.smallhost.pl/public_html/ecommerce-admin",
    emptyOutDir: true,
  },
});
