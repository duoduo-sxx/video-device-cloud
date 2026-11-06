# 视频清晰度增强系统（VidClear Studio）

AI 视频画质增强工作台 —— 纯前端 Web 应用（Vue 3 + Vite + TypeScript + Pinia + ECharts），
所有业务数据均为内置 Mock，可打包为 Windows 免安装单文件 exe 桌面应用。

## 目录结构

```
├── src/                     Web 前端源码（纯前端，无任何 Electron 依赖）
├── desktop/                 桌面端壳工程（独立 package.json + main.cjs）
│   ├── main.cjs             Electron 主进程：本地静态服务 + 主窗口
│   └── renderer-server.cjs  127.0.0.1 只读静态服务（可在 Node 下独立冒烟测试）
├── build/                   打包资源（icon.ico / icon.png，由 scripts/gen-icon.py 生成）
├── scripts/gen-icon.py      应用图标生成脚本（品牌渐变 + 取景框 + 锐化星芒）
├── public/favicon.png       Web 标签页图标
├── electron-builder.yml     electron-builder 打包配置（portable / x64）
├── pack-win.bat             Windows 本地一键打包脚本
└── .github/workflows/
    └── package-windows.yml  GitHub Actions 云端打包（名称：视频清晰度增强系统）
```

## 本地开发

```bash
npm install
npm run dev        # 开发（http://localhost:5173）
npm run build      # 类型检查 + 产物构建 → dist/
```

## Windows 打包（本地）

双击或执行 `pack-win.bat`，或手动：

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

产物：`<PACK_OUTPUT>/视频清晰度增强系统-V1.0.0-便携版.exe`，免安装单文件，双击即用。

> electron / electron-builder 都**不在**项目依赖里，由 npx 打包时按需拉取；
> 桌面端壳工程位于 `desktop/`（独立 package.json），与 Web 工程完全隔离。

## 云端打包（GitHub Actions）

推送到 `main` 或打 `v*` 标签即自动触发工作流「视频清晰度增强系统」：

```bash
git tag v1.0.0 && git push origin v1.0.0
```

- Artifacts：`vidclear-studio-windows-exe`（保留 30 天）
- 打 tag 时自动创建 GitHub Release 并附上 exe

## 应用图标

图标为独立设计（非 Electron 默认图标）：品牌渐变底（#4F7CFF → #22D3A6，与 UI 的
`--gradient` 令牌一致）+ 四角取景框 + 中心锐化星芒。重新生成：

```bash
python3 scripts/gen-icon.py   # 产出 build/icon.ico、build/icon.png、public/favicon.png
```
