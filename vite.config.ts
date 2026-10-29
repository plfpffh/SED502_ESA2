import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import apiFunktionen from './vite-plugin-api.ts'

// https://vite.dev/config/
export default defineConfig({
  // apiFunktionen: /api/* im Dev-Server wie auf Vercel ausführen
  plugins: [react(), apiFunktionen()],
})
