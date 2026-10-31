import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: { port: 5183, host: '127.0.0.1' },
  build: { outDir: 'dist', assetsDir: 'assets', chunkSizeWarningLimit: 1600 },
});
