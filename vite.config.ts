import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/node_modules\/(@tiptap|prosemirror-)/.test(id)) return "editor";
          if (/node_modules\/(recharts|victory-vendor|d3-)/.test(id)) return "charts";
          if (id.includes("node_modules/framer-motion")) return "motion";
          if (id.includes("node_modules/@radix-ui")) return "radix";
          if (
            /node_modules\/(react|react-dom|scheduler|react-router|react-router-dom|@remix-run|@tanstack)\//.test(
              id,
            )
          ) {
            return "react-vendor";
          }
          return "vendor";
        },
      },
    },
  },
  server: {
    port: 5173,
  },
});
