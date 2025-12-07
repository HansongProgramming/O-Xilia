import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    conditions: ["node"],   // tell Vite to prefer Node builds when available
  },
  optimizeDeps: {
    exclude: ["path", "fs"], // don’t bundle them at all
  },
});