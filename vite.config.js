import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: [
      'greenmap-5iea.onrender.com',
      process.env.RENDER_EXTERNAL_HOSTNAME,
    ].filter(Boolean),
  },
})
