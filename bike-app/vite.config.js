import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  test: {
    environment: "jsdom",
  },
  server: {
    port: 5173,
    allowedHosts: ['.amazonaws.com', '.cloudfront.net']
  },
})
