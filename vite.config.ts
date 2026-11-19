
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5432,
    proxy: { '/api': 'https://sirt-backend-production.up.railway.app', '/storage': 'https://sirt-backend-production.up.railway.app' }
  },
})
