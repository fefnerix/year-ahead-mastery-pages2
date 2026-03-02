import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "brand/logo-365.png",
        "brand/favicon-32.png",
        "brand/favicon-16.png",
        "brand/apple-touch-icon.png",
        "brand/og-image.png",
        "robots.txt",
      ],
      manifest: {
        name: "PROGRESS",
        short_name: "PROGRESS",
        description: "Tu transformación diaria — Progress",
        theme_color: "#0B0E1A",
        background_color: "#0B0E1A",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/brand/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/brand/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,jpg,jpeg,svg,woff2}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/~oauth/],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
