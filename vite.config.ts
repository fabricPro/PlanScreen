import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Tablet-first planlama aracı. Yerel geliştirmede `vercel dev` hem frontend'i hem
// /api function'larını servis eder. Salt vite kullanılırsa /api istekleri
// `vercel dev` portuna (3000) proxy'lenir.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
