import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@types": path.resolve(__dirname, "../types"),
    },
  },
  optimizeDeps: {
    include: ["idb", "ethers"],
    esbuildOptions: {
      resolveExtensions: [".ts", ".tsx", ".js", ".jsx"],
    },
  },
  build: {
    commonjsOptions: {
      include: [/types/, /node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          ethers: ["ethers"],
        },
      },
    },
  },
}));
