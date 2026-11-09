# IIUP — 智能交互与理解软件系统与技术服务（前端演示项目）

纯前端 SPA，全量本地 Mock 数据，无后端、无桌面端依赖。构建产物为纯静态 `dist/`，可直接静态部署或后续套桌面壳。

## 技术栈

React 18 + TypeScript + Vite + Ant Design 5（中文）+ Zustand + React Router v6（Hash 路由）+ ECharts 5

## 快速开始

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 产出 dist/（纯静态，相对路径，file:// 或任意静态服务器可用）
npm run preview    # 预览构建产物
```

## 演示账号

登录页任意非空账号密码均可登录（含 Mock 验证码）。登录时可选择角色：

| 角色 | 可见范围 |
|---|---|
| 系统管理员 admin | 全部模块 |
| 普通坐席/运营 | 工作台、对话中心、语义理解、语音演示、知识库 |
| 知识管理员 | 工作台、知识库、场景配置、对话中心、语义理解 |
| 数据分析员 | 工作台、报表分析、运营大屏、质量评测、语义理解 |

## 模块一览

- M1 登录与全局框架（亮/暗主题、全局搜索、通知）
- M2 工作台首页（指标卡、快捷入口、待办、公告）
- M3 智能对话中心（模拟流式输出、意图/置信度、会话管理）
- M4 语义理解工作台（意图+实体高亮+情感+敏感词、批量分析导出 CSV）
- M5 语音交互演示（TTS / ASR 全模拟，无真实音频服务）
- M6 知识库管理（CRUD、分类、模拟导入、检索测试）
- M7 场景与机器人配置（机器人、意图、话术、展示级流程编排画布）
- M8 数据分析与监控（报表分析 + 深色运营大屏）
- M9 质量标注与评测（逐轮标注、Badcase 流转、评测任务）
- M10 系统管理（用户、角色权限、操作日志、参数配置）

## 数据说明

- 所有数据由带种子的伪随机生成（时间基于当前系统时间相对生成，无硬编码日期）。
- 写操作持久化到 localStorage（键 `iiup_db_v1` / `iiup_store`），刷新不丢失。
- 右上角头像菜单提供「重置演示数据」一键还原。

## 目录结构

```
src/
  api/        接口层（Promise + { code, data, message } 风格，组件不直接读写 mock）
  mock/       数据生成与 localStorage 持久化
  components/ 通用组件（ECharts 封装等）
  constants/  菜单、角色权限、敏感词等常量
  layouts/    全局布局
  pages/      按模块划分的页面
  router/     路由与守卫
  store/      Zustand 状态
  types/      TypeScript 类型定义
electron/      主进程脚本（打包时使用，不参与前端构建）
build/         应用图标（icon.ico / icon.png，独立设计）
scripts/       Windows 一键打包脚本
```

## 桌面端打包（Windows 免安装版）

本项目**不包含 electron 依赖**（`package.json` 中无 electron / electron-builder），打包时由 `electron-builder` 按指定版本自动下载运行时。

### 方式一：Windows 本地一键打包

在 cmd 中执行（或直接双击 `scripts/pack-win.cmd`）：

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

产物：`release-retry-<随机数>/IIUP-1.0.0-portable-x64.exe`（绿色免安装，双击即用）。

### 方式二：GitHub Actions 自动打包

工作流：`.github/workflows/iiup-windows-portable.yml`（名称：智能交互与理解软件系统与技术服务）

- 触发：手动 `workflow_dispatch`、推送到 `main` / `master` / `feature/iiup-web`、打 `v*` 标签
- 流程：`npm install` → `npm run typecheck` → `npm run build` → 读取 `npm view electron version` → `electron-builder --win portable --x64`
- 产物作为 Artifact `IIUP-portable-x64` 上传（保留 30 天）

### 打包配置说明

| 文件 | 作用 |
|---|---|
| `electron-builder.yml` | appId、productName、图标、`dist/` 打包范围、electron 镜像、portable 目标 |
| `electron/main.cjs` | 主进程：加载 `dist/index.html`、单实例锁、外链走系统浏览器 |
| `build/icon.ico` | 独立设计的应用图标（512px 源图，含 16~256 多尺寸） |
| `package.json` 的 `main` | 指向 `electron/main.cjs`（electron-builder 启动入口） |

> 前端依赖已被 Vite 打包进 bundle，`files` 中排除 `node_modules`，因此安装包体积仅包含运行时与静态产物。

