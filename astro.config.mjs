/* global caches, Response, URL -- these run inside the service worker, not Node */
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import AstroPWA from "@vite-pwa/astro";

// Juz 30 is surahs 78-114. Surah 77 is also precached: the quiz engine loads each scope's neighbouring surah
// (see neededSurahs), so without it Juz 30 would fail offline.
const juz30Files = Array.from({ length: 38 }, (_, i) => String(77 + i).padStart(3, "0"));

export default defineConfig({
  site: "https://sambungayat.com",
  output: "static",
  trailingSlash: "never",
  build: { format: "file" },
  integrations: [
    react(),
    sitemap({ filter: (page) => !/\/(offline|riwayat|rekap)$/.test(page) }),
    AstroPWA({
      registerType: "autoUpdate",
      injectRegister: false, // registered in BaseLayout, skipped inside the Android app
      manifest: {
        name: "Sambung Ayat",
        short_name: "SambungAyat",
        description: "Latih hafalan Al-Qur'an dengan kuis sambung ayat",
        id: "/",
        lang: "id",
        categories: ["education"],
        shortcuts: [
          { name: "Tantangan Harian", url: "/harian" },
          { name: "Mulai Juz 30", url: "/kuis?mode=sambung&scope=juz:30&n=10&d=mudah" },
        ],
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#0d5750",
        background_color: "#f6f0de",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          {
            src: "/icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globDirectory: "dist",
        globPatterns: [
          "*.html",
          "_astro/*.{js,css}",
          "fonts/*.woff2",
          "icons/*.png",
          "brand/*.svg",
          "favicon.svg",
          "data/v1/{index,juz,ambiguous}.json",
          `data/v1/surah/{${juz30Files.join(",")}}.json`,
        ],
        globIgnores: ["404.html"],
        // No navigateFallback: it answers every non-precached navigation (surah/juz pages) with /offline even
        // when online. Navigations go network-first below; /offline is shown only when the network fails.
        navigateFallback: null,
        // /kuis?mode=... must match the precached /kuis.html
        ignoreURLParametersMatching: [/.*/],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "pages",
              networkTimeoutSeconds: 4,
              // Quiz pages carry a query string; the offline copy of /<lang>/kuis must still match.
              matchOptions: { ignoreSearch: true },
              expiration: { maxEntries: 150 },
              plugins: [
                {
                  // Self-contained: serialised into sw.js.
                  // /en/... pages fall back to /en/offline; everything else to /offline.
                  handlerDidError: async ({ request }) => {
                    const m = /^\/([a-z]{2,3})\//.exec(new URL(request.url).pathname);
                    return (
                      (m && (await caches.match(`/${m[1]}/offline`, { ignoreSearch: true }))) ||
                      (await caches.match("/offline", { ignoreSearch: true })) ||
                      Response.error()
                    );
                  },
                },
              ],
            },
          },
          {
            urlPattern: ({ url }) =>
              url.pathname.startsWith("/data/v1/surah/") || url.pathname.startsWith("/data/v1/tr/"),
            handler: "CacheFirst",
            options: { cacheName: "surah-data", expiration: { maxEntries: 120 } },
          },
          {
            // Only serves audio the user saved via AudioDownload (Range-capable); live fetches are not cached.
            urlPattern: ({ url }) => url.hostname === "everyayah.com",
            handler: "CacheFirst",
            options: { cacheName: "sa-audio", rangeRequests: true },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/fonts/"),
            handler: "CacheFirst",
            options: { cacheName: "fonts", expiration: { maxEntries: 10 } },
          },
        ],
      },
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
