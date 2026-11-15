import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// The live app is served by GitHub Pages at taegansheena.github.io/mullon/. It must stay at that
// address: the prototype kept books in localStorage there, and the app imports them on first sign-in.
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'serve' && !isPreview ? '/' : '/mullon/',
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Same file name as the prototype's worker, so installed copies of the prototype pick this one up.
      filename: 'sw.js',
      manifest: {
        name: 'Reading log',
        short_name: 'Reading log',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#f3efe2',
        theme_color: '#f3efe2',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Book covers never change for a given ID, so serve them from the cache once seen.
            urlPattern: ({ url }) => url.origin === 'https://covers.openlibrary.org',
            handler: 'CacheFirst',
            options: { cacheName: 'covers', cacheableResponse: { statuses: [0, 200] }, expiration: { maxEntries: 1000 } },
          },
        ],
      },
    }),
  ],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  server: { allowedHosts: true },
}))
