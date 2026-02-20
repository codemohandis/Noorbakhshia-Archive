import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    sveltekit(),
    SvelteKitPWA({
      srcDir: 'src',
      mode: 'production',
      strategies: 'generateSW',
      scope: '/',
      base: '/',
      registerType: 'autoUpdate',
      manifest: {
        name: 'Dars-e-Noorbakhshia',
        short_name: 'Noorbakhshia',
        description: 'Islamic audio lectures streaming from Archive.org',
        theme_color: '#0D1117',
        background_color: '#0D1117',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
          {
            src: '/icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/archive\.org\/metadata\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'archive-metadata',
              expiration: {
                maxAgeSeconds: 86400, // 24 hours
              },
            },
          },
          {
            urlPattern: /^https:\/\/archive\.org\/download\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'archive-audio',
              expiration: {
                maxAgeSeconds: 2592000, // 30 days
              },
              rangeRequests: true,
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxAgeSeconds: 2592000, // 30 days
                maxEntries: 100,
              },
            },
          },
          {
            urlPattern: /\.(?:woff|woff2|ttf|otf)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts',
              expiration: {
                maxAgeSeconds: 31536000, // 1 year
                maxEntries: 20,
              },
            },
          },
        ],
      },
      injectManifest: {
        globPatterns: ['client/**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: '/',
      },
    }),
  ],
  define: {
    '__APP_VERSION__': JSON.stringify(process.env.npm_package_version || '1.0.0'),
  },
});
