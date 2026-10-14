/**
 * 预加载脚本：向渲染进程暴露只读的桌面环境信息
 * 应用代码可通过 window.desktop 判断是否运行于桌面端（纯前端逻辑，无 Node 权限）
 */
const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('desktop', {
  isDesktop: true,
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node
  }
})
