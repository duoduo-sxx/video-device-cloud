/**
 * 冒烟测试：用 Vite 的 SSR 加载链路把每个页面渲染一次，捕捉运行时渲染错误。
 * 只做一次性验证，不参与生产构建。运行：node scripts/smoke.mjs
 */
import { createServer } from 'vite'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

const cases = [
  ['/login', '/src/pages/Login.tsx'],
  ['/dashboard', '/src/pages/Dashboard.tsx'],
  ['/videos', '/src/pages/Videos.tsx'],
  ['/videos/vid_003', '/src/pages/VideoDetail.tsx'],
  ['/videos/vid_003/analysis', '/src/pages/Analysis.tsx'],
  ['/search', '/src/pages/Search.tsx'],
  ['/review', '/src/pages/Review.tsx'],
  ['/editing', '/src/pages/Editing.tsx'],
  ['/editing/prj_001', '/src/pages/Editing.tsx'],
  ['/analytics', '/src/pages/Analytics.tsx'],
  ['/models', '/src/pages/Models.tsx'],
  ['/models/pipeline', '/src/pages/Models.tsx'],
  ['/settings/users', '/src/pages/Settings.tsx'],
  ['/settings/roles', '/src/pages/Settings.tsx'],
  ['/settings/spaces', '/src/pages/Settings.tsx'],
  ['/settings/api-keys', '/src/pages/Settings.tsx'],
  ['/settings/audit', '/src/pages/Settings.tsx'],
  ['/settings/profile', '/src/pages/Settings.tsx'],
  ['/nope', '/src/pages/Error.tsx', 'NotFound'],
]

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
})

let failed = 0
for (const [route, file, named] of cases) {
  try {
    const mod = await server.ssrLoadModule(file)
    const Page = named ? mod[named] : mod.default
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        { initialEntries: [route] },
        React.createElement(Routes, null, React.createElement(Route, { path: '*', element: React.createElement(Page) })),
      ),
    )
    if (!html || html.length < 50) throw new Error('输出为空')
    console.log(`ok   ${route.padEnd(26)} ${html.length} chars`)
  } catch (e) {
    failed++
    console.log(`FAIL ${route.padEnd(26)} ${e.message}`)
  }
}

await server.close()
console.log(failed === 0 ? 'ALL PASS' : `${failed} FAILED`)
process.exit(failed === 0 ? 0 : 1)
