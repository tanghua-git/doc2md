import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['ttxia.icu', 'www.ttxia.icu', '43.159.37.10', 'localhost', '127.0.0.1']
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: ['ttxia.icu', 'www.ttxia.icu', '43.159.37.10', 'localhost', '127.0.0.1']
  }
})
