import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
export default defineConfig({
  plugins:[react()],
  server:{host:'0.0.0.0',proxy:{'/api':{target:'http://127.0.0.1:5000',changeOrigin:false}}},
  preview:{allowedHosts:['greenmap-5iea.onrender.com',process.env.RENDER_EXTERNAL_HOSTNAME].filter(Boolean)}
})