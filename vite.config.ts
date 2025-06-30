import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

import { defineConfig } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Define environment variables for conditional compilation
    __IS_BROWSER__: JSON.stringify(true),
  },
  build: {
    sourcemap: false,
    minify: "esbuild",
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["@tanstack/react-router"],
          ui: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
          ],
          forms: ["react-hook-form", "@hookform/resolvers", "zod"],
          utils: ["clsx", "tailwind-merge", "class-variance-authority"],
          faker: ["@faker-js/faker"],
          pdf: ["pdf-lib"],
        },
      },
    },
  },
  optimizeDeps: {
    exclude: [
      // Exclude Node.js-specific modules from optimization
      "mysql2",
      "mysql2/promise",
      // Also exclude crypto and other Node.js built-ins
      "crypto",
      "fs",
      "path",
      "url",
      "net",
      "tls",
      "events",
      "stream",
      "buffer",
      "util",
      "zlib",
      "timers",
      "string_decoder",
      "process",
    ],
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api/": {
        target: "http://localhost:3001/",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/wilayah/, "/api"),
        secure: true,
      },
    },
  },
  preview: {
    port: 4173,
    host: true,
  },
});
