import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Build optimizations for production
  build: {
    target: 'es2015',
    minify: 'esbuild', // Using esbuild instead of terser for better compatibility
    sourcemap: false,

    // Code splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-leaflet': ['leaflet', 'react-leaflet'],
        },
      },
    },

    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },

  // Server configuration for development
  server: {
    port: 5173,
    strictPort: false,
    host: true, // Listen on all addresses for mobile testing
  },

  // Preview server configuration
  preview: {
    port: 4173,
    strictPort: false,
    host: true,
  },
})
