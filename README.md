# 云枢 DataRelay · 数据云端协同优化传输平台

企业级数据流转中枢的前端实现：把分散在本地机房、边缘节点、公有云与私有云之间的数据，通过智能调度与传输优化（压缩、去重、分片并行、断点续传、智能路由）安全高效地送达目标，并支持多团队在统一空间内协同。

## 运行

```bash
npm install
npm run dev      # http://127.0.0.1:5173
npm run build    # 产出 dist/
npm run preview  # 预览构建产物
```

演示账号：`admin` / `123456`，可在登录页切换「平台管理员 / 运维工程师 / 业务成员」三种角色，菜单与操作权限会同步变化。

## 打包桌面端（Windows 便携版）

项目本体不引入 `electron` 依赖；打包时由 electron-builder 按命令行传入的 `-c.electronVersion` 自行下载 Electron 运行时（走 npmmirror 镜像）。

**方式一：一键脚本（推荐）**

```bat
pack-win.bat
```

**方式二：手动执行（与脚本等价）**

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

产物：`<PACK_OUTPUT>\YunShu-DataRelay-<version>-portable-x64.exe`，双击即用、免安装。

**方式三：GitHub Actions 云端打包**

工作流 `.github/workflows/yunshu-datarelay.yml`（名称「云枢 DataRelay」）：push 到 `main` / `feat/**` 或手动触发（workflow_dispatch），在 `windows-latest` 上完成构建与打包，产物以 Artifact `YunShu-DataRelay-portable-x64` 上传。

应用图标由 `scripts/make-icon.py`（Pillow）生成，源文件与产物在 `build/`（`icon.svg` / `icon.png` / `icon.ico`），非 Electron 默认图标。

## 技术栈

React 18 · TypeScript · Vite 5 · Ant Design 5 · ECharts 5 · Zustand · React Router 6（HashRouter）

## 关键约束

- **纯前端**：无后端、无数据库，全量数据来自 `src/mock`，经 `src/services` 模拟异步返回。
- **无桌面端依赖**：不引用 `electron`、`@tauri-apps/*`、Node 原生模块，构建产物可被 Electron / Tauri 直接加载。
- `base: './'` + `HashRouter`，保证 `file://` 协议下刷新不 404。
- 不依赖 CDN、外链字体与外部图片，断网可用。

## 目录

```
src/
├── components/   通用组件（PageHeader / StatCard / StatusTag / ChartCard / EmptyState）
├── layouts/      主框架与路由守卫
├── pages/        22 个页面，按业务模块分目录
├── mock/         种子数据与图表数据生成器
├── services/     模拟异步接口层（深拷贝 + 延迟）
├── store/        Zustand 全局状态（登录态、侧边栏、通知）
├── router/       路由表与菜单配置
├── theme/        Ant Design token 与图表色板
└── utils/        格式化、CSV 导出、剪贴板、反馈
```

## 页面

总览驾驶舱 · 传输任务（列表 / 新建向导 / 详情）· 数据通道 · 优化策略（列表 / 编辑器）· 云端节点（卡片 / 拓扑）· 协同空间（列表 / 详情）· 实时监控 · 告警中心 · 报表与成本 · 审计日志 · 敏感数据 · 加密与访问控制 · 用户与角色 · 通知设置 · 系统参数 · API 密钥 · 登录 · 404

## 数据说明

所有数据均为模拟，包含 48 个传输任务、12 条通道、16 个节点、8 个协同空间、8 个优化策略、30 条告警、80 条审计日志。数据在时间、容量、速率之间保持自洽（进度 = 已传 / 总量，耗时 ≈ 数据量 / 速率）。
