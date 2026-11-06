# SpaceScape · 空间视频转换系统（SpaceScape Studio Console）

一套「把 2D 视频转制为空间视频」的生产管理与服务台控制台（纯前端演示版）。

- 生产链路：素材库 → 转换任务（7 阶段流水线、实时进度）→ 质检中心 → 参数预设
- 交付链路：项目管理 / 客户管理 / 订单与账单
- 服务链路：技术服务工单（SLA 计时）+ 服务目录
- 系统能力：渲染节点、团队与权限、审计日志、设置、命令面板（⌘K）、通知中心

## 快速开始

```bash
npm install
npm run dev      # 开发环境 http://localhost:5173
npm run build    # 产出 dist/（纯静态，资源全部相对路径）
npm run preview  # 本地预览构建产物 http://localhost:4173
```

> 数据全部为本地 Mock（固定种子 `mulberry32(20261019)`），刷新不跳变；
> 所有状态持久化在 `localStorage`（key 前缀 `spacescape:v1:`），
> 「设置 → 存储与缓存 → 重置演示数据」可一键还原。

## 桌面打包兼容（已内置）

- Vite `base: './'`，产物全部相对路径
- 路由使用 `HashRouter`（`#/jobs/xxx`），无需服务端 rewrite，`file://` / 自定义协议下可用
- 无任何外链资源（字体 / 图标 / 图片全部本地生成）
- 不含 Electron / Tauri / Node API 依赖，可直接壳打包

> 注意：`dist/` 使用 ES Module 脚本，浏览器直开 `file://` 会被 CORS 拦截，请用 `npm run preview`
> 或任意静态服务器；打成桌面端（Electron / Tauri）后走自定义协议即可正常工作。

## 桌面打包（Windows 便携版）

项目源码不引入 electron 依赖；打包时通过 `npx electron-builder@latest` 临时拉取，运行时版本用
`npm view electron version` 动态获取。图标在 `build/`（icon.ico / icon.icns / icon.png，均为独立设计）。

Windows 本地打包（cmd）：

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

产物：`%PACK_OUTPUT%\SpaceScape-<版本>-portable-x64.exe`（免安装、单文件便携版）。

CI 打包：GitHub Actions workflow「SpaceScape」（`.github/workflows/spacescape.yml`），
push 到 `spacescape-console` 分支或手动触发（可指定 Electron 版本），产物上传至 Actions Artifact。

## 目录结构

```
src/             前端源码
├─ components/   ui / layout / table / charts / media / job
├─ pages/        21 条路由对应的 13 组页面
├─ store/        zustand（app UI 状态 + 数据运行时，ticker 驱动任务推进）
├─ mock/         固定种子数据集：12 客户 / 18 项目 / 60 素材 / 45 任务 / 24 订单 / 30 工单 / 8 节点
├─ lib/          format / calc / constants（计价、ETA、加权进度、SLA）
└─ types.ts      全量数据模型
electron/        桌面壳主进程（main.cjs，无任何 npm 依赖）
build/           应用图标（icon.ico / icon.icns / icon.png / icon.svg 源文件）
scripts/check.ts 数据一致性自检（可选）：esbuild bundle 后用 node 执行
```

## 关键规则

- 任务进度每 900ms 推进，按阶段权重 `[6,26,14,12,28,8,6]` 加权，完成节点自动释放
- 计费：标准 4K ¥120 / 8K ¥360 每分钟，精修 ×5，加急 ×1.5，税额 6%
- 质检阈值：舒适度 ≥85 · 时域抖动 ≤0.12 · 边缘伪影 ≤2.0% · 窗口违规 0 帧
