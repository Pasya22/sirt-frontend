
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5432,
    proxy: { '/api': 'http://0.0.0.0:8000', '/storage': 'http://0.0.0.0:8000' }
  },
})
