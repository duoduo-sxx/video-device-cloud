/**
 * 占位媒体生成
 * 全部使用本地 SVG Data URL，不依赖任何外链图片，保证离线 / 内网环境可用
 */
import { hashString } from './random'

/** 生成模拟监控抓图（深色底 + 建筑轮廓 + 目标框 + 扫描线 + 通道与时间水印） */
export function snapshotUrl(seed: string, channelLabel = 'CH01', time = '', ratio = 16 / 9): string {
  const h = hashString(seed)
  const hue = h % 360
  const w = 320
  const ht = Math.round(w / ratio)
  const bg = `hsl(${hue},16%,13%)`
  const far = `hsl(${hue},14%,18%)`
  const near = `hsl(${hue},12%,24%)`
  const ground = `hsl(${hue},10%,16%)`
  const accent = `hsl(${(hue + 140) % 360},60%,55%)`
  const person = `hsl(${(hue + 40) % 360},35%,62%)`

  // 用 seed 决定几个"目标"的位置
  const boxes: { x: number; y: number; w: number; h: number }[] = []
  const count = 1 + (h % 3)
  for (let i = 0; i < count; i++) {
    const bx = 30 + ((h >> (i * 3)) % (w - 100))
    const by = ht * 0.5 + ((h >> (i * 2)) % Math.round(ht * 0.28))
    const bw = 16 + ((h >> (i * 5)) % 22)
    const bh = Math.round(bw * 2.1)
    boxes.push({ x: bx, y: by - bh + bh * 0.32, w: bw, h: bh })
  }

  const boxSvg = boxes
    .map(
      (b, i) => `
  <rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="2" fill="${person}" opacity="0.82"/>
  <rect x="${b.x - 3}" y="${b.y - 3}" width="${b.w + 6}" height="${b.h + 6}" fill="none" stroke="${accent}" stroke-width="1"/>
  <text x="${b.x - 3}" y="${b.y - 6}" font-size="7" fill="${accent}" font-family="monospace">PERSON ${(0.7 + ((h >> i) % 28) / 100).toFixed(2)}</text>`
    )
    .join('')

  const lines = Array.from({ length: 12 })
    .map((_, i) => `<line x1="0" y1="${i * (ht / 12)}" x2="${w}" y2="${i * (ht / 12)}" stroke="hsl(${hue},20%,40%)" stroke-width="0.4" opacity="0.35"/>`)
    .join('')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${ht}" viewBox="0 0 ${w} ${ht}">
  <rect width="${w}" height="${ht}" fill="${bg}"/>
  <rect x="0" y="0" width="${w}" height="${ht * 0.45}" fill="${far}"/>
  <rect x="${w * 0.06}" y="${ht * 0.12}" width="${w * 0.2}" height="${ht * 0.33}" fill="${near}"/>
  <rect x="${w * 0.34}" y="${ht * 0.22}" width="${w * 0.16}" height="${ht * 0.23}" fill="${near}"/>
  <rect x="${w * 0.6}" y="${ht * 0.08}" width="${w * 0.26}" height="${ht * 0.37}" fill="${near}"/>
  <rect x="0" y="${ht * 0.72}" width="${w}" height="${ht * 0.28}" fill="${ground}"/>
  <path d="M0 ${ht * 0.72} L${w * 0.3} ${ht * 0.62} L${w * 0.55} ${ht * 0.78} L${w} ${ht * 0.66} L${w} ${ht} L0 ${ht} Z" fill="${ground}"/>
  ${boxSvg}
  ${lines}
  <rect x="6" y="6" width="${channelLabel.length * 6.6 + 12}" height="15" fill="rgba(0,0,0,0.55)"/>
  <text x="12" y="17" font-size="9" fill="#e8e8e8" font-family="monospace">${escapeXml(channelLabel)}</text>
  <text x="${w - 8}" y="17" font-size="9" fill="#e8e8e8" font-family="monospace" text-anchor="end">${escapeXml(time || '')}</text>
  <text x="8" y="${ht - 7}" font-size="8" fill="rgba(232,232,232,0.7)" font-family="monospace">1080P  H.265  4096Kbps</text>
  <circle cx="${w - 12}" cy="${ht - 11}" r="3.4" fill="#ff4d4f"/>
</svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

/** 生成首字母头像 */
export function avatarUrl(name: string): string {
  const h = hashString(name)
  const hue = h % 360
  const bg = `hsl(${hue},52%,46%)`
  const initial = name ? name.slice(-2) : '用'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <rect width="80" height="80" rx="40" fill="${bg}"/>
  <text x="40" y="41" font-size="26" fill="#ffffff" font-family="-apple-system,PingFang SC,Microsoft YaHei,sans-serif" text-anchor="middle" dominant-baseline="central">${escapeXml(initial)}</text>
</svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

/** 设备点位缩略图（浅色示意，用于列表） */
export function deviceThumbUrl(seed: string, label: string): string {
  const h = hashString(seed)
  const hue = h % 360
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="68" viewBox="0 0 120 68">
  <rect width="120" height="68" fill="hsl(${hue},30%,94%)"/>
  <circle cx="60" cy="30" r="12" fill="none" stroke="hsl(${hue},45%,52%)" stroke-width="2"/>
  <circle cx="60" cy="30" r="4" fill="hsl(${hue},45%,52%)"/>
  <rect x="52" y="42" width="16" height="6" rx="2" fill="hsl(${hue},45%,62%)"/>
  <text x="60" y="62" font-size="9" fill="hsl(${hue},30%,35%)" font-family="monospace" text-anchor="middle">${escapeXml(label)}</text>
</svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

function escapeXml(s: string): string {
  return String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] as string))
}
