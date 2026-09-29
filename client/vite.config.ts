/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    // DOMPurify and markdown output need a DOM to sanitize against.
    environment: 'jsdom',
  },
  server: {
    proxy: {
      // Same-origin /api in the browser; the key never appears in any
      // client-visible request — the server adds Authorization upstream.
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: false,
      },
    },
  },
})
