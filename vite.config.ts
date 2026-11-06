import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  // 相对路径基准，便于后续用 Electron / Tauri 以 file:// 方式加载
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    host: '127.0.0.1'
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    // 产物文件名保持稳定（不带 hash），便于桌面端外壳固定路径加载
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]'
      }
    },
    // 桌面端外壳（Electron / Tauri）内置新版 Chromium，直接输出最新语法，
    // 避免构建期对整体产物做语法降级。
    target: 'esnext',
    // 打包进桌面端后不走网络传输，压缩收益有限；如需更小体积可改为 'esbuild'。
    minify: false,
    cssMinify: false,
    chunkSizeWarningLimit: 3000
  }
})
