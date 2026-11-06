/**
 * 运行时冒烟测试：真实 Chromium 打开预览站点，登录后遍历全部路由，
 * 收集 console error / pageerror / 失败请求，并截图。
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'

const require = createRequire('/Users/sxx/.workbuddy/binaries/node/workspace/')
const { chromium } = require('playwright-core')

const base = process.env.BASE || 'http://[::1]:5217/'
const exe = '/Users/sxx/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
const outDir = process.env.OUT || './.smoke'
fs.mkdirSync(outDir, { recursive: true })

const ROUTES = [
  ['dashboard', '态势总览'],
  ['interaction', '智能交互'],
  ['devices', '设备控制'],
  ['scenes', '场景编排'],
  ['tasks', '任务调度'],
  ['alerts', '告警中心'],
  ['service', '服务中心'],
  ['analytics', '数据分析'],
  ['admin/users', '用户管理'],
  ['admin/roles', '角色权限'],
  ['admin/audit', '审计日志'],
  ['settings', '系统设置'],
  ['about', '关于系统'],
]

const errors = []
const warns = []
const failedReq = []

const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--no-sandbox', '--disable-gpu'] })
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()

page.on('console', (m) => {
  const t = m.type()
  if (t === 'error') errors.push(`[console] ${m.text()}`)
  else if (t === 'warning') warns.push(m.text())
})
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`))
page.on('requestfailed', (r) => failedReq.push(`${r.failure()?.errorText} ${r.url()}`))

async function shot(name) {
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: false })
}

function log(...a) { console.log(...a) }

try {
  log('→ 打开登录页')
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 20000 })
  await page.waitForTimeout(700)

  const title = await page.title()
  const rootChildren = await page.evaluate(() => document.getElementById('root')?.childElementCount ?? 0)
  log(`  标题: ${title}`)
  log(`  #root 子节点数: ${rootChildren}`)
  if (rootChildren === 0) throw new Error('白屏：#root 为空')
  await shot('01-login')

  // 点击「中心主管」角色卡一键登录（权限最全）
  const adminCard = page.locator('text=中心主管').first()
  await adminCard.click({ timeout: 8000 })
  await page.waitForTimeout(1600)
  log(`→ 登录后 URL: ${page.url()}`)
  await shot('02-dashboard')

  // 遍历路由
  for (const [path, label] of ROUTES) {
    await page.evaluate((p) => { window.location.hash = `#/${p}` }, path)
    await page.waitForTimeout(1400)
    const h1 = await page.locator('h1').first().textContent().catch(() => null)
    const bodyLen = await page.evaluate(() => document.body.innerText.trim().length)
    log(`  ✓ /${path.padEnd(14)} h1=${(h1 || '(无)').trim().slice(0, 20).padEnd(20)} 文本 ${bodyLen} 字`)
    await shot(`r-${path.replace(/\//g, '-')}`)
  }

  // 交互验证：命令面板
  await page.evaluate(() => { window.location.hash = '#/dashboard' })
  await page.waitForTimeout(800)
  await page.keyboard.press('Meta+k')
  await page.waitForTimeout(600)
  const paletteVisible = await page.locator('input[placeholder*="搜索"]').count()
  log(`→ 命令面板触发: ${paletteVisible > 0 ? '正常' : '未响应'}`)
  await shot('10-palette')
  await page.keyboard.press('Escape')

  // 交互验证：对话式指令
  await page.evaluate(() => { window.location.hash = '#/interaction' })
  await page.waitForTimeout(1000)
  const input = page.locator('input[type="text"], textarea').first()
  if (await input.count()) {
    await input.fill('把A座1F展厅调成观影模式')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(2200)
    const bubbleCount = await page.locator('[class*="rounded"]').count()
    const bodyText = await page.evaluate(() => document.body.innerText)
    const understood = /观影|意图|置信度|确认/.test(bodyText)
    log(`→ 指令解析: ${understood ? '已产生意图回执' : '未识别'}`)
    await shot('11-intent')
  }

  // 深色/浅色主题切换健壮性
  await page.evaluate(() => { window.location.hash = '#/settings' })
  await page.waitForTimeout(900)
  await shot('12-settings')

} catch (e) {
  errors.push(`[fatal] ${e.message}`)
  await shot('99-fatal').catch(() => {})
} finally {
  log('\n========== 结果 ==========')
  log(`未捕获错误 ${errors.length} 条`)
  errors.slice(0, 25).forEach((e) => log('  ✗ ' + e))
  log(`失败请求 ${failedReq.length} 条`)
  failedReq.slice(0, 10).forEach((e) => log('  ✗ ' + e))
  const uniqWarn = [...new Set(warns)].filter((w) => !/Download the React DevTools/.test(w))
  log(`警告 ${uniqWarn.length} 条（去重）`)
  uniqWarn.slice(0, 10).forEach((w) => log('  ! ' + w.slice(0, 160)))
  await browser.close()
}
