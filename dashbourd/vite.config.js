import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const resolveSharedDepsPlugin = () => ({
  name: 'resolve-shared-deps',
  resolveId(source, importer) {
    if (importer && importer.includes(path.normalize('/shared/').replace(/\\/g, '/')) && !source.startsWith('.') && !source.startsWith('/')) {
      return this.resolve(source, path.resolve(__dirname, 'index.html'), { skipSelf: true })
        .then(resolved => resolved || null);
    }
    return null;
  }
});

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    resolveSharedDepsPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'logo.png'],
      manifest: {
        name: 'لوحة تحكم السعيدة',
        short_name: 'السعيدة',
        description: 'لوحة تحكم متجر السعيدة',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        icons: [
          {
            src: 'logo.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'node_modules/shared')
    },
    preserveSymlinks: true
  },
  server: {
    fs: {
      allow: ['..']
    }
  },
  optimizeDeps: {
    exclude: ['shared']
  }
})
