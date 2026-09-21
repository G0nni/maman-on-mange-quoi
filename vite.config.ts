import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Maman, on mange quoi ?',
        short_name: 'On mange quoi',
        lang: 'fr',
        start_url: '/',
        display: 'standalone',
        background_color: '#EEF2EA',
        theme_color: '#2F6B4F',
        // PNG pour Android (le SVG seul ne suffit pas partout) ; la maskable est plein cadre,
        // le pictogramme tient dans la zone de sécurité (cercle de 80 %). iOS : apple-touch-icon.png.
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
    }),
  ],
})
