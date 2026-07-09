import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'dashlogo.ico'],
      manifest: {
        name: 'Time Tick Store Dashboard',
        short_name: 'TimeTickDash',
        description: 'Dashboard for Time Tick Store management',
        theme_color: '#000000',
        icons: [
          {
            src: 'dashlogo.ico',
            sizes: '192x192',
            type: 'image/icon'
          },
          {
            src: 'dashlogo.ico',
            sizes: '512x512',
            type: 'image/icon'
          }
        ]
      }
    })
  ],
})
