/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Pixel Splash",
        short_name: "Pixel Splash",
        description: "Wurf-Labor: Basketball im Pixel-Look",
        lang: "de",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#110e0c",
        background_color: "#110e0c",
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: { globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"] },
    }),
  ],
  test: {
    globals: true,
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
  },
});
