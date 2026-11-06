import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  cacheDir: 'vite-cache',
  server: {
    port: 5173,
    host: '127.0.0.1',
    open: false,
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 8192,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          antd: ['antd', '@ant-design/icons'],
          echarts: ['echarts'],
        },
      },
    },
  },
});
