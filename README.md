# MediaForge 智媒工场

> 多媒体音视频智能处理系统与技术服务 · 纯前端演示项目

面向企业内容团队的音视频智能化生产平台，覆盖「素材接入 → AI 处理 → 人工精修 → 内容审核 → 导出分发 → 用量计量 → 对外 API 服务」全链路。

## 技术栈

- React 18 + TypeScript
- Vite 5（`base: './'`，产物可直接以静态文件打开）
- React Router 6（**HashRouter**，为 `file://` 与桌面端打包预留）
- Ant Design 5（深/浅色主题通过 theme algorithm 实现）
- Zustand（主题、当前用户、任务引擎）
- ECharts 5
- 纯 CSS 变量实现设计 token，无 Tailwind

## 启动

```bash
npm install
npm run dev          # http://localhost:5273（若被占用会自动换端口）
npm run build        # 产物在 dist/，并自动生成单文件 dist/mediaforge.html
npm run preview
npm run test:routes  # 用无头 Chrome 冒烟测试 22 条路由（需本机装有 Chrome）
```

> **单文件版**：`npm run build` 后会额外生成 `dist/mediaforge.html`，JS/CSS 全部内联，可直接双击用浏览器打开，也可直接放入 Electron / Tauri 的 `loadFile` 使用。

## 桌面端打包（Windows 便携版）

项目**不引入任何 electron / electron-builder 依赖**：主进程只有一个纯 JS 文件 `electron/main.cjs`（`require('electron')` 由运行时注入），打包工具通过 `npx` 临时拉起，应用图标为自绘的 `build/icon.ico` / `build/icon.png`（非 Electron 默认图标）。

### 方式一：本地打包（Windows cmd）

```bat
scripts\package-win.bat
```

或手动执行（与仓库 workflow 完全一致的步骤）：

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

> 交互式 cmd 用 `%i`，写成 `.bat` 文件时需改为 `%%i`。产物为 `MediaForge-1.0.0-portable-x64.exe`，单文件免安装。

### 方式二：GitHub Actions 云端打包

`.github/workflows/mediaforge-portable.yml`（名称：**多媒体音视频智能处理系统**）。手动在 Actions 页面触发（workflow_dispatch），或推送 `v*` 标签自动触发；运行在 `windows-latest`，构建完成后以 Artifact `MediaForge-Windows-Portable` 上传 exe。

### 主进程说明

- 入口 `package.json` → `main: electron/main.cjs`。
- 页面通过自定义 `app://local` 协议加载 `dist/`（Electron ≥ 25），旧版本回退 `file://` 加载单文件 `dist/mediaforge.html`。
- 未打包 `node_modules`（渲染层已由 Vite 全量打包），asar 体积即前端产物体积。

## 数据说明

- **零网络请求**：项目不调用任何后端接口，所有数据来自 `src/mock/seed/*`，任务进度由 `src/stores/tasks.ts` 中的模拟引擎推进（每 0.9 秒）。
- **持久化**：字幕编辑、标签修改、审核处置写入 `localStorage`（前缀 `mf:`）。顶栏用户菜单中的「重置演示数据」可清除并恢复初始状态。
- **任务引擎**：运行中任务按阶段推进（解析 → 推理 → 编码 → 收尾），约 3.5% 概率随机失败并分配预置错误码；排队任务在有空闲节点时自动转为运行。

## 目录

```
src/
  components/     通用组件（PageHeader / MetricCard / StatusBadge / MockPlayer / Waveform / Chart / EmptyState）
  features/       按业务域划分的页面
    dashboard/    概览
    assets/       媒体资产、资产详情
    upload/       上传中心
    tools/        12 项 AI 能力（转写 / 字幕工坊 / 增强 / 音频 / TTS / 译配 / 审核 / 理解）
    pipelines/    流水线列表、编排画布、运行记录
    tasks/        任务中心、任务详情
    templates/    模板市场
    usage/        用量与计费
    developer/    API Key、调用记录、在线调试、文档、SDK
    team/         成员、角色矩阵、资源组
    settings/     通用 / 外观 / 引擎 / 存储 / 通知 / 集成
    audit/        审计日志
  layouts/        侧边栏 + 顶栏布局
  mock/           种子数据、localStorage 数据层、任务种子
  services/       与真实 API 同构的服务函数
  stores/         Zustand 状态
  styles/         设计 token 与全局样式
  types/          TypeScript 类型定义
  utils/          格式化、时间码、确定性随机
```

## 已实现的关键交互

- **字幕工坊**：波形时间轴拖拽调整起止、字幕块 ↔ 列表 ↔ 播放头三方联动、双击行内编辑、拆分/合并、批量替换、AI 重新对齐与断句、撤销（10 步）、`Cmd/Ctrl+S` 保存、`Space` 播放、`↑/↓` 切换句子、离开前未保存提示、SRT 真实导出下载。
- **资产详情**：模拟播放器（进度拖拽、倍速、画质切换、截图、全屏）、时间码点击跳转、6 个页签、标签增删、评论锚点。
- **上传中心**：拖拽/选择文件、并发上传模拟、暂停/继续/取消/重试、重复文件秒传、完成后补录元信息抽屉。
- **内容审核**：风险时间轴打点跳转、逐个处置（通过/删除/打码/白名单）、进度同步、批量提交。
- **流水线编排**：画布平移、缩放、节点拖拽、连线跟随、节点属性编辑、试运行逐节点点亮与日志输出。
- **任务中心**：进度实时推进、优先级调整、重试/取消、按状态分 Tab、失败归因、队列概览。
- **开发者中心**：Key 创建与吊销、调用记录、在线调试三种响应、接口文档、SDK 卡片。
- **用量计费**：按能力堆叠柱状图、账单明细、CSV 导出（Blob 下载）。

## 可打包性约束（已遵守）

- 未引入任何 `electron` / `@tauri-apps` / Node 内置模块依赖。
- 路由使用 HashRouter，静态资源使用相对路径。
- 无 CDN 字体、外链图片；封面由 CSS 渐变生成，图标来自 `@ant-design/icons` 与内联 SVG。
- 文件下载使用 `Blob` + `a[download]`，不依赖后端。
- 最小视口 1024×720，主适配 1440px 及以上。

## 演示账号

顶栏右上角头像可切换当前用户（内容运营 / 剪辑师 / 审核专员 / 技术负责人 / 管理员），不同角色的侧边栏与操作权限按角色矩阵展示。
