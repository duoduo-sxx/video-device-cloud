import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
    open: false
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks: {
          echarts: ['echarts', 'vue-echarts'],
          element: ['element-plus', '@element-plus/icons-vue'],
          vendor: ['vue', 'vue-router', 'pinia', 'axios', 'dayjs']
        }
      }
    }
  }
})
