# 沉浸式智能控制人机交互系统与技术服务

> Web 端纯前端演示系统。所有数据在本地 Mock，无后端、无外部请求；构建产物可直接被桌面壳以 `file://` 加载。

## 启动

```bash
npm install
npm run dev        # 开发预览 http://localhost:5173
npm run build      # 产出 dist/
npm run preview    # 预览构建产物
npx tsc --noEmit   # 类型检查

# 可选：浏览器冒烟测试（需先 npm run preview，并安装 playwright-core）
# node scripts/smoke.mjs   # 遍历全部路由，收集 console error / 失败请求并截图到 .smoke/
```

## 演示账号

| 账号 | 密码 | 角色 |
| --- | --- | --- |
| `operator` | `123456` | 值班调度员 |
| `engineer` | `123456` | 技术运维 |
| `manager` | `123456` | 中心主管 |
| `guest` | `123456` | 访客演示（只读） |

登录页也提供四个角色卡片，点击直接进入。

## 桌面端打包须知

项目本身**不声明任何 Electron / Tauri 依赖**（`npm install` 不会下载 electron）。构建产物满足以下条件，可被桌面壳直接加载：

- `vite.config.ts` 中 `base: './'`，资源使用相对路径
- 路由使用 `HashRouter`，`file://` 下不会 404
- 字体、图标、图表全部本地打包，断网可用
- 不访问 Node 内置模块与浏览器扩展 API

### Windows 便携版打包

主进程入口 `electron/main.cjs`（`package.json` 的 `main` 字段指向它），
打包配置 `electron-builder.yml`，应用图标 `build/icon.ico`（多尺寸，7 档 16→256）。

**方式一：双击 `pack-win.bat`**（推荐，自动设置镜像并处理随机输出目录）

**方式二：在 cmd 中逐条执行**

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

产物：`release-retry-xxxxx/ImmersionControl-<version>-portable-x64.exe`，单文件免安装。

> 说明：`electron` 版本由 `npm view electron version` 动态解析后通过 `-c.electronVersion` 注入，
> electron 运行时由 electron-builder 依镜像下载，不进入项目依赖树。

### 云端打包（GitHub Actions）

workflow：`.github/workflows/desktop-pack.yml`，显示名称为「沉浸式智能控制人机交互系统」。

- 触发：手动 `Run workflow`，或推送 `v*` 标签、推送到当前分支
- 环境：`windows-latest` + Node 20，已预置三个国内镜像变量
- 产物：Actions 运行页 `Artifacts` → `immersive-control-windows-portable-x64`

### 图标

`build/icon.svg` 为矢量源文件，`build/icon.ico` / `build/icon.png` 由源文件渲染生成：

- 深色科技风圆角底板 + 三重对称青色圆弧 + 中心发光核心 + 紫/青卫星节点
- ICO 内含 16/24/32/48/64/128/256 七个尺寸，非 Electron 默认图标


## 功能模块

| 模块 | 路由 |
| --- | --- |
| 态势总览 | `/` |
| 多模态交互中心 | `/interaction` |
| 设备与空间 | `/devices` |
| 场景编排 | `/scenes`、`/scenes/:id` |
| 任务与自动化 | `/tasks` |
| 告警与事件 | `/alerts` |
| 技术服务 | `/service`、`/service/tickets/:id` |
| 数据分析 | `/analytics` |
| 用户 / 权限 / 审计 | `/admin/users`、`/admin/roles`、`/admin/audit` |
| 系统设置 / 关于 | `/settings`、`/about` |

## 数据

- 种子数据：52 台设备、6 个空间、8 个场景、36 个任务、64 条告警、24 个工单、14 个用户、18 篇知识文章、200 条指令记录
- 运行时状态写入 `localStorage`（键 `ice.db.v1`）
- 「系统设置 → 数据 → 重置演示数据」可恢复初始状态

## 技术栈

Vite 5 · React 18 · TypeScript · TailwindCSS 3 · Zustand · React Router 6 · ECharts · Framer Motion · dnd-kit
