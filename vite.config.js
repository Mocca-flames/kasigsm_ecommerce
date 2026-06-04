import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://3ac2-102-254-178-13.ngrok-free.app',
        changeOrigin: true,
        secure: false,
        rewrite: path => path.replace(/^\/_?api/, ''),
      },
    },
  },
})
