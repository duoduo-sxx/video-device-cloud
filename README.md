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

> ⚠️ **Windows 传参陷阱（已踩过）**：命令行里的 `-c.xxx=yyy` 覆盖写法在 Windows 下可能被 electron-builder 当成「配置文件路径」，
> 报错 `ENOENT: no such file or directory, open '...\.directories.output=release'`，随后表现为「没有产物 exe」。
> `npm run dist:win` 已改为**生成临时配置 `electron-builder.ci.yml`**（把 `electronVersion` 与输出目录写进 yml）再打包，规避该问题。
> 手工执行时如遇同样报错，请改用生成的配置文件方式，或直接 `npm run dist:win`。

产物：`AV-Repair-Studio-1.0.0-portable-x64.exe`，双击即用，免安装。

## CI 打包

GitHub Actions 工作流：`.github/workflows/av-repair-studio.yml`（名称「音视频自动化修补系统」）。

- 触发：手动 `workflow_dispatch`（可选填 electron 版本），或推送 `main` / `av-repair-studio/**` 分支
- 流程：安装依赖 → 前端构建 → 解析 electron 版本 → 生成 `electron-builder.ci.yml` → electron-builder 打便携包 → 校验产物 → 上传 Artifact
- 版本固定：`electron-builder@26.18.0`、Node 22；electron 版本默认取 `npm view electron version`
- 源：CI 跑在 GitHub 海外 runner 上，直连官方源（npmmirror 在国内本地打包时才用）；`CSC_IDENTITY_AUTO_DISCOVERY=false` 跳过签名
- 失败排查：打包日志会写入 job summary 与 annotation（标题 `electron-builder exit=N` / `pack-log`），可直接在运行页面看到真实报错
- 产物：Artifact `AV-Repair-Studio-portable-x64`（约 98 MB，保留 14 天）

## 桌面端打包要点

| 事项 | 说明 |
| --- | --- |
| 主进程入口 | `electron/main.cjs`，加载 `dist/index.html`（HashRouter，file:// 可用） |
| 打包清单 | `electron-builder.yml` 只含 `dist/**`、`electron/**`、`build/icon.png`，`node_modules` 全部排除 |
| 依赖归类 | react/vite 等全部放在 `devDependencies`：打包体积不包含 node_modules |
| 应用图标 | `build/icon.ico`（16–256 多尺寸）/ `build/icon-512.png`，独立绘制，非 Electron 默认图标 |
| 运行时注入 | electron 版本写进生成的 `electron-builder.ci.yml`（`electronVersion: x.y.z`），项目内无 electron 依赖；不要用 `-c.electronVersion=` 直接在 Windows 命令行覆盖 |
