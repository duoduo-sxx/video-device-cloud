# CloudFlow · 数据云端协同优化传输平台

面向多云 / 混合云 / 边缘场景的数据传输编排与优化平台前端原型。纯前端 SPA，全部数据为本地 Mock，无任何后端依赖、无真实网络请求，构建产物可直接被 Electron / Tauri 以 `file://` 方式加载。

## 快速开始

```bash
npm install
npm run dev      # http://127.0.0.1:5173
npm run build    # 产物在 dist/
npm run preview
npm run typecheck
```

## 技术栈

| 层次 | 选型 |
|---|---|
| 构建 | Vite 5（`base: './'`） |
| 框架 | React 18 + TypeScript 5（strict） |
| UI | Ant Design 5（中文包 + 自定义 token） |
| 路由 | react-router-dom 6 · **HashRouter** |
| 状态 | Zustand（UI 切片 + 数据切片，persist 持久化） |
| 图表 | ECharts 5 + echarts-for-react（自定义亮/暗主题） |
| 时间 | dayjs（relativeTime / zh-cn） |
| 样式 | 原生 CSS 变量（`src/styles/global.css`） |

## 目录结构

```
src/
├── App.tsx                 # ConfigProvider + 路由表
├── main.tsx
├── layouts/BasicLayout.tsx # 侧边栏 + 顶栏 + 全局搜索 + 通知抽屉
├── components/             # PageHeader / StatusTag / StatCard / ChartCard / TableToolbar / AuthGuard
├── charts/                 # EChart 封装 + 亮暗主题注册
├── pages/                  # 22 个路由页面
├── mock/seed.ts            # 全量 Mock 种子数据 + 时间序列生成器
├── services/api.ts         # 异步 Mock 服务（测试连通性 / 链路探测）
├── store/                  # dataStore（任务/告警/审批/策略）、uiStore（主题/角色）
├── constants/              # 菜单、字典（状态 → 中文 → 颜色）
├── types/index.ts          # 全量数据模型
└── styles/global.css       # 设计 token 与布局样式
```

## 页面清单（22 个路由）

| 分组 | 页面 | 路由 |
|---|---|---|
| 总览 | 驾驶舱 | `#/dashboard` |
| 传输任务 | 任务列表 / 新建向导 / 任务详情 | `#/jobs` `#/jobs/new` `#/jobs/:id` |
| 链路与节点 | 节点管理 / 节点详情 / 链路监控 / 网络拓扑 | `#/nodes` `#/nodes/:id` `#/links` `#/topology` |
| 优化引擎 | 优化策略 / 模型与实验 / 收益分析 | `#/optimization/*` |
| 协同空间 | 空间与成员 / 审批中心 | `#/collab/*` |
| 数据资产 | 数据集目录 | `#/catalog` |
| 监控告警 | 告警中心 / 告警规则 | `#/alerts` `#/alerts/rules` |
| 报表分析 | 传输报表 | `#/reports` |
| 系统管理 | 用户与角色 / 连接器 / 审计日志 / 系统设置 | `#/admin/*` |
| 个人 | 个人中心 | `#/profile` |

## Mock 数据说明

- 任务 32 个（运行中 6 / 排队 5 / 成功 14 / 失败 4 / 暂停 2 / 重试中 1）、节点 18 个、链路 14 条、策略 10 条、告警 26 条、审批 20 单、数据集 24 个、连接器 6 个、用户 12 人、审计日志 60 条。
- 时间统一以 `2026-10-19` 为基准日，相对时间由 dayjs 计算。
- 随机数使用固定种子（mulberry32），每次加载数据一致，便于演示与截图。
- 任务进度每 5 秒推进一次（仅在运行中任务），进度/速率/ETA 联动更新。
- 任务、告警、审批、策略的变更会写入 localStorage（`cf-data-v1`）；跨天或种子日期变化时自动重置，避免数据过期。清除方式：浏览器控制台执行 `localStorage.removeItem('cf-data-v1')`。

## 设计规范

- 主色 `#2563EB`，辅助青 `#06B6D4`，成功 `#16A34A`，警告 `#D97706`，危险 `#DC2626`，优化引擎紫 `#8B5CF6`。
- 状态色映射集中在 `src/constants/dict.ts`，页面不得自定义颜色。
- 侧边栏 224/64px 深色 `#0B1220`，顶栏 56px，内容区 padding 20px，卡片圆角 10px。
- 字节 IEC 1024 进制、速率 `MB/s` / `Gbps` 自适应，均封装在 `utils/format.ts`。
- 支持亮/暗主题，切换后 ECharts 主题、AntD token 与 CSS 变量同步切换。

## 角色权限（演示）

顶栏用户菜单可实时切换角色：

| 角色 | 权限 |
|---|---|
| 管理员 | 全部功能 |
| 操作员 | 隐藏「系统管理」菜单，任务/策略/告警可写 |
| 访客 | 所有写操作按钮隐藏，仅可查看与导出 |

## 桌面端打包（Windows Portable）

项目**不引入** electron / electron-builder 依赖，全部通过 `npx` 临时调用。打包入口 `electron/main.cjs` 通过自定义 `app://` 协议加载 `dist/`（绕开 Chromium 对 `file://` 下 ES Module 的 CORS 限制），图标在 `build/icon.ico`（含 256/128/64/48/32/16 六档尺寸）。

Windows CMD 下直接执行：

```bat
set "ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
set "NPM_CONFIG_ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
set "ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/"
npm install
npm run build
for /f "delims=" %i in ('npm view electron version') do set "ELECTRON_VERSION=%i"
set "PACK_OUTPUT=release-retry-%RANDOM%"
npx --yes electron-builder@latest --win portable --x64 --config electron-builder.yml -c.electronVersion=%ELECTRON_VERSION% -c.directories.output=%PACK_OUTPUT%
```

产物为 `PACK_OUTPUT` 目录下的 `CloudFlow-Portable-<version>-x64.exe`（单文件免安装，双击即用）。

### GitHub Actions 自动打包

`.github/workflows/cloudflow-desktop.yml`（名称：数据云端协同优化传输平台）在任意分支 push 或手动触发（workflow_dispatch）时，于 `windows-latest` 上执行与上完全相同的打包流程并上传 Artifact。镜像变量已写入 workflow，国内/海外 Runner 均可用。

### 桌面端实现要点

1. `vite.config.ts` 已设置 `base: './'`，资源全部相对路径引用。
2. 路由使用 HashRouter（`#/jobs`），不依赖服务端 history 回退。
3. 未使用 MSW / Service Worker；Mock 为纯 TS 异步函数，无 SW 注册限制。
4. **不要直接双击 `dist/index.html` 预览**——ES Module 在 `file://` 下会被 CORS 拦截；主进程已用 `app://` 协议加载，Electron 内无此问题。本地想用浏览器看，请 `npm run preview`。
5. 主进程 `webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }`，渲染进程无任何 Node 能力。

## 未包含的能力

真实鉴权、真实传输引擎、WebSocket 实时推送、i18n 英文包、移动端适配、单元测试。以上均为原型阶段的刻意取舍。
