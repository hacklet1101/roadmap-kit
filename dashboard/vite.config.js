import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
//
// Environment variables:
//   PORT         - Server port (default: 6969)
//   BASE_PATH    - Base path for subpath deployment (default: '/')
//                  Example: BASE_PATH=/roadmap npm run build
//
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH || '/',
  server: {
    port: parseInt(process.env.PORT) || 6969,
    open: true
  }
})
