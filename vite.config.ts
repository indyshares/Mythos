import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.webp', 'pwa.png', 'pwa-maskable.png'],
        manifest: {
          name: 'Mythos - Cloud Knowledge & Writing Workspace',
          short_name: 'Mythos',
          description: 'Cloud-based Knowledge Management & Writing Workspace with hierarchical file system, Markdown live editor, internal links, graph, story timeline, and multi-provider AI Knowledge Assistant.',
          theme_color: '#090d16',
          background_color: '#090d16',
          display: 'standalone',
          orientation: 'portrait-primary',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/pwa.png',
              sizes: 'any',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-maskable.png',
              sizes: 'any',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        devOptions: {
          enabled: true
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
        }
      })
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('.', import.meta.url)),
      },
    },
    server: {
      // HMR is disabled in AI Studio (ignore WebSocket errors).
      // Disabling HMR stops @vite/client from attempting WebSocket connections in this container environment.
      hmr: false,
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
