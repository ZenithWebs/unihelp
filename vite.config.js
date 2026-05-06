import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    tailwindcss(),
    VitePWA({
  registerType: "autoUpdate",
  injectRegister: "auto",
  strategies: "generateSW",

  workbox: {
    clientsClaim: true,
    skipWaiting: true,

    // 🔥 optional but helps avoid stale assets
    cleanupOutdatedCaches: true
  },

  devOptions: {
    enabled: true
  },

  manifest: {
    name: "UniHelp",
    short_name: "UniHelp",
    start_url: "/dashboard?v=2", // 🔥 version bump trick
    display: "standalone",
    theme_color: "#000000",
    background_color: "#000000",

    icons: [
      {
        src: "/favicon.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/favicon.png",
        sizes: "512x512",
        type: "image/png"
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
