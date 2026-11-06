# AV Repair Studio · 音视频自动化修补系统

纯前端实现（数据全部 Mock），构建产物为静态站点，同时提供打包为 Windows 桌面端（便携版）的配置与 CI 工作流。**项目不引入 electron npm 依赖**——桌面壳由 electron-builder 在打包时按注入的 `electronVersion` 提供运行时。

## 本地开发

```bash
npm install
npm run dev        # 开发
npm run build      # 类型检查 + 构建 → dist/
npm run preview    # 预览构建产物
```

## Windows 一键打包（便携版 exe）

方式一：npm 脚本（推荐，跨平台，等价于下列手工命令）

```bash
npm run dist:win
```

方式二：手工命令（与 README 中的批处理一致）

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

产物：`AV-Repair-Studio-1.0.0-portable-x64.exe`，双击即用，免安装。

## CI 打包

GitHub Actions 工作流：`.github/workflows/av-repair-studio.yml`（名称「音视频自动化修补系统」）。

- 触发：手动 `workflow_dispatch`，或推送 `main` / `av-repair-studio/**` 分支
- 流程：安装依赖 → 前端构建 → 动态解析 electron 版本 → electron-builder 打便携包 → 上传 Artifact
- 镜像：workflow 内已配置 npmmirror 的 electron 与 electron-builder-binaries 镜像

## 桌面端打包要点

| 事项 | 说明 |
| --- | --- |
| 主进程入口 | `electron/main.cjs`，加载 `dist/index.html`（HashRouter，file:// 可用） |
| 打包清单 | `electron-builder.yml` 只含 `dist/**`、`electron/**`、`build/icon.png`，`node_modules` 全部排除 |
| 依赖归类 | react/vite 等全部放在 `devDependencies`：打包体积不包含 node_modules |
| 应用图标 | `build/icon.ico`（16–256 多尺寸）/ `build/icon-512.png`，独立绘制，非 Electron 默认图标 |
| 运行时注入 | electron 版本通过 `-c.electronVersion=<npm view electron version>` 传入，项目内无 electron 依赖 |
