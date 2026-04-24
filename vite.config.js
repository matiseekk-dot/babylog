import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/babylog/',
  publicDir: 'public',
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test-setup.js'],
  },
  build: {
    assetsDir: 'assets',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // React i core
          'react-vendor': ['react', 'react-dom'],
          // Firebase — duża biblioteka, własny chunk
          'firebase-vendor': [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
          ],
          // Recharts — tylko dla wykresów
          'charts': ['recharts'],
        },
      },
    },
  },
})
