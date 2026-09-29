import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// `base: './'` makes every asset URL relative so it works on GitHub Pages (https://sanchour.github.io/bonum/)
// as well as custom domains and local previews without 404 errors.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
  build: {
    target: 'es2020',
    sourcemap: false,
  },
})
