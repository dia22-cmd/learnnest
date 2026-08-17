import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Allow external mapping through container ports
    watch: {
      usePolling: true,
      interval: 100,
    },
    hmr: {
      clientPort: 5173, // Map client HMR websockets back to host port 5173
    },
    proxy: {
      "/api": {
        target: process.env.VITE_PROXY_TARGET || "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
