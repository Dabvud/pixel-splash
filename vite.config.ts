/// <reference types="vitest/config" />
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { version: string };
let commitHash = "dev";
try {
  commitHash = execSync("git rev-parse --short HEAD", {
    cwd: new URL(".", import.meta.url),
    stdio: ["ignore", "pipe", "ignore"],
  }).toString().trim() || "dev";
} catch {
  // Builds without a Git checkout still carry a useful version and timestamp.
}

export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __COMMIT_HASH__: JSON.stringify(commitHash),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
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
    // Atlas- und Arena-Tests brauchen unter Last (parallele Codex-Läufe, Handy-Emulation) mehr als 5 s
    testTimeout: 30000,
    // Mit tausenden Spielzug-Tests liefen die Fork-Worker in „Timeout calling onTaskUpdate“ (CI rot trotz grüner Tests)
    pool: "threads",
  },
});
