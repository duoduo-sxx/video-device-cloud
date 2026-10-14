/// <reference types="vite/client" />

/**
 * Vite 客户端类型声明
 * - 提供 import.meta.env 等类型（见 src/api/request.ts 的 VITE_USE_MOCK 开关）
 * - 纯前端项目：接口默认全部走本地 Mock 适配器
 */

/** Electron 桌面端环境信息（由 electron/preload.js 注入，浏览器下不存在） */
declare global {
  interface Window {
    desktop?: {
      isDesktop: boolean
      platform: string
      versions: { electron: string; chrome: string; node: string }
    }
  }
}

export {}

