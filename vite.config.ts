import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { host: "localhost" },
  resolve: {
    alias: { "node:crypto": "crypto" },
  },
});