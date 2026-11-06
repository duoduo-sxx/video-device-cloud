import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' 保证构建产物可通过 file:// 直接被桌面端加载
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5173, host: '127.0.0.1' },
  build: {
    outDir: 'dist',
    // 桌面端（Chromium 内核）无需降级语法，跳过 esbuild 转译可显著加快构建
    target: 'esnext',
    // 关闭压缩：esbuild 对超大 chunk 做 minify 时在部分沙箱环境下会失败；
    // 桌面端本地加载，体积不影响首屏体验。若需压缩可安装 terser 后改为 'terser'。
    minify: false,
    cssMinify: true,
    emptyOutDir: false,
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          antd: ['antd', '@ant-design/icons'],
          charts: ['echarts', 'echarts-for-react'],
        },
      },
    },
  },
});
