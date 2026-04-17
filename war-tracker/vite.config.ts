import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Enable code splitting for better caching and smaller initial load
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core React runtime — cached across all pages
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
            return 'vendor-react';
          }
          // Heavy visualization libs — only loaded when needed
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'vendor-charts';
          }
          // Map library — only loaded on /live and /cities pages
          if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) {
            return 'vendor-map';
          }
          // Utility libraries
          if (id.includes('node_modules/date-fns') || id.includes('node_modules/lucide-react')) {
            return 'vendor-utils';
          }
        },
      },
    },
    // Increase chunk size warning limit (vendor chunks are intentionally larger)
    chunkSizeWarningLimit: 600,
  },
})
