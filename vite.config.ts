import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base 使用相对路径：产物可被 file:// 直接加载（Electron / Tauri 打包场景）
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2000,
    // 目标设为 esnext 且不使用 esbuild 压缩，可跳过 rollup 阶段的 esbuild 二次转译。
    // 桌面端（Electron / Tauri）内置的 Chromium 版本远高于此目标，无需降级语法。
    target: 'esnext',
    minify: false,
    sourcemap: false,
  },
});
