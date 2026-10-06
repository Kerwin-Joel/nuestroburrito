import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    // ngrok (free) da un subdominio nuevo cada vez que se reinicia el túnel,
    // así que fijar uno solo se rompe la próxima vez. Esto es solo para el
    // servidor de desarrollo local, nunca para el build de producción.
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Three.js — el más pesado, separado
          if (id.includes('three') || id.includes('@react-three')) {
            return 'three'
          }
          // Leaflet — junto con react-leaflet
          if (id.includes('react-leaflet') || id.includes('/leaflet/')) {
            return 'leaflet'
          }
          // Recharts
          if (id.includes('recharts') || id.includes('d3-')) {
            return 'charts'
          }
          // GSAP
          if (id.includes('gsap')) {
            return 'gsap'
          }
          // Supabase
          if (id.includes('@supabase')) {
            return 'supabase'
          }
          // Framer Motion
          if (id.includes('framer-motion')) {
            return 'motion'
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  }
})