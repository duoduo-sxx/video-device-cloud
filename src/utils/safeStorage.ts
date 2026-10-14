/**
 * 本地存储兼容层（必须最先导入）
 * 某些环境（Electron 的 file:// 协议、浏览器隐私模式等）可能禁用或抛出 localStorage 异常，
 * 此时降级为内存实现，保证应用仍可正常启动运行（仅本次会话内有效）。
 */
const memory = new Map<string, string>()

function usable(): boolean {
  try {
    const k = '__vc_storage_probe__'
    window.localStorage.setItem(k, '1')
    window.localStorage.removeItem(k)
    return true
  } catch {
    return false
  }
}

if (!usable()) {
  const shim: Storage = {
    get length() {
      return memory.size
    },
    clear: () => memory.clear(),
    getItem: (k: string) => (memory.has(k) ? memory.get(k)! : null),
    key: (i: number) => Array.from(memory.keys())[i] ?? null,
    removeItem: (k: string) => {
      memory.delete(k)
    },
    setItem: (k: string, v: string) => {
      memory.set(k, String(v))
    }
  }
  try {
    // file:// 等受限场景下允许覆盖
    Object.defineProperty(window, 'localStorage', {
      value: shim,
      configurable: true,
      writable: true
    })
    console.warn('[storage] localStorage 不可用，已降级为内存存储（数据仅本次会话有效）')
  } catch {
    /* 实在无法覆盖时保持原状 */
  }
}

export {}
