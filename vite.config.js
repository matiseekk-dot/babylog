import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  plugins: [react()],
  base: '/babylog/',
  publicDir: 'public',
  // Wstrzyknij wersję z package.json jako globalną stałą.
  // Używane w Settings > stopka ("Spokojny Rodzic v2.7.5").
  // Dzięki temu version bump wymaga tylko edycji package.json + git tag.
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
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
