# NexusPlay Console · 跨平台网页游戏综合开发管理系统与技术服务

一套纯前端的游戏研发交付管理中台：**合同 → 立项 → 需求 → 任务 → 缺陷 → 构建 → 多渠道发布 → 运营数据 → 工单服务 → 结算回款**。
无后端，全部数据由内置模拟数据服务生成（固定随机种子，刷新不跳变）。

## 开发

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck  # 类型检查
npm run build      # 类型检查 + 构建，产物在 dist/
```

## 打包为 Windows 桌面端（免安装单文件 exe）

项目**不引入任何 Electron 依赖**：`electron` 与 `electron-builder` 都在打包时通过 `npx` 按需拉取，
桌面端代码独立放在 `desktop/` 目录（自带 `package.json` + `main.cjs`），与 Web 工程依赖完全隔离。

### 方式一：本地 Windows 双击 `pack-win.bat`

等价于手工执行以下命令：

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

也可运行 `npm run pack:win`（跨平台脚本 `scripts/pack-win.mjs`）。

### 方式二：GitHub Actions 云端打包

推送到 `nexusplay-console` 分支或打 `v*` 标签即会自动触发
`.github/workflows/build-windows.yml`，在 `windows-latest` 上完成构建与打包：

- 产物在 Actions 页面的 **Artifacts** 里下载（保留 30 天）
- 打 tag 时会自动创建 GitHub Release 并附带 exe
- 也支持在 Actions 页手动 `Run workflow`

### 产物

`release/NexusPlay 游戏开发管理平台-V<version>-便携版.exe`
双击即可运行，无需安装（首次启动会自解压到临时目录，通常 1~3 秒）。
主进程会在 `127.0.0.1:41790` 起一个只读本地静态服务加载前端页面，
日志写到 `%APPDATA%/跨平台网页游戏综合开发管理系统/logs/main.log`，
便携版 exe 同级目录中另有一份 `启动日志.log`，便于就地排查。

## 目录结构

```
src/                 前端源码（React 18 + TypeScript + Vite + Ant Design 5）
  mock/              内置模拟数据服务（种子固定）
  pages/             13 个业务模块页面
desktop/             桌面端主进程（不含任何 npm 依赖）
scripts/pack-win.mjs 打包脚本
electron-builder.yml 打包配置
build/               应用图标（icon.ico / icon.png）
```

## 桌面端兼容约定（改动前端代码时请勿破坏）

- 路由使用 `createHashRouter`，不使用 `BrowserRouter`
- Vite `base: './'`，资源全部相对引用
- 不使用任何图片文件，头像/缩略图均由 CSS 生成
