import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/babylog/',
  build: {
    // Ensure public dir files including hidden .well-known are copied
    assetsDir: 'assets',
  },
  publicDir: 'public',
})
