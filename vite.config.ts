import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Tablet-first planlama aracı. netlify dev functions'ı /.netlify/functions/* altında
// servis eder; salt vite kullanılırsa aşağıdaki proxy functions portuna yönlendirir.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/.netlify/functions": {
        target: "http://localhost:8888",
        changeOrigin: true,
      },
    },
  },
});
