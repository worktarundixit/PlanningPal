import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  envDir: path.resolve(__dirname, '../..'),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    host: '0.0.0.0',
    port: Number(process.env.WEB_PORT || 5173),
    proxy: {
      '/api': process.env.VITE_API_PROXY || 'http://127.0.0.1:3001',
    },
  },
  build: { sourcemap: false },
  preview: {
    host: '0.0.0.0',
    port: Number(process.env.WEB_PORT || 5173),
    proxy: {
      '/api': process.env.VITE_API_PROXY || 'http://127.0.0.1:3001',
    },
  },
})
