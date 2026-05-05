import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
       devOptions: {
        enabled: true // ✅ prevents dev crash
      },
      manifest: {
        name: 'UniHelp',
        short_name: 'UniHelp',
        start_url: '/',
        display: 'standalone',
        theme_color: '#000000',
        icons: [
          {
            src: '/Favicon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/Favicon.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    }),
    ],
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
})
