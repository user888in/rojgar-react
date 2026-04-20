import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    https: {
      cert: fs.readFileSync('localhost+2.pem'),
      key: fs.readFileSync('localhost+2-key.pem'),
    },
    port: 5173,
  },
})
