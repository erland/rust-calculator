import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Kalkylator', short_name: 'Kalkylator', start_url: './', scope: './',
        display: 'standalone', background_color: '#101829', theme_color: '#101829',
        icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
                { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }],
      },
      workbox: {
        globPatterns: ['**/*.{html,js,css,svg,png,wasm}'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
    }),
  ],
  // For GitHub Pages, set VITE_BASE_PATH=/repository-name/ when building.
  base: './',
  clearScreen: false,
});
