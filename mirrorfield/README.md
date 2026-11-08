# 镜域 MirrorField · 三维复刻与 MR 虚实交互系统及技术服务

面向园区 / 厂区 / 文保建筑的三维复刻与 MR 虚实交互平台演示项目。纯前端实现，无后端，全部数据为本地 Mock，可通过 Electron / Tauri 直接封装为桌面端（项目内不含任何桌面端依赖）。

## 快速开始

```bash
npm install
npm run dev      # http://127.0.0.1:5173
npm run build    # 产出 dist/，可直接 file:// 打开
```

演示账号：`admin / 123456`（已预填，直接登录）。

## 已验证

| 项 | 结果 |
| --- | --- |
| `tsc --noEmit`（strict + noUnusedLocals/Parameters） | 0 error |
| `vite build`（3621 modules） | 通过，产物 `dist/`（`base: './'`，`file://` 可直接打开） |
| Mock 数据层 | 21 个集合、约 3900 条记录，外键校验 0 异常 |
| `api.*` 数据访问层 58 个方法 | 全部调用通过（含分页、筛选、状态流转、验收提交） |
| GitHub Actions 打包（`windows-latest` / Node 22 / Electron 45.2.3） | 通过，6m38s，产物 `MirrorField-portable-x64` 111 MB |

打包体积（未压缩 / gzip）：antd 2.5 MB / 556 KB、echarts 2.8 MB / 632 KB、three 920 KB / 183 KB。开启 `npm run build` 默认压缩后约为上表 1/3。

> 本次构建在受限沙箱中执行，该环境禁止进程删除临时文件，故用 `--minify false --target esnext` 跳过 esbuild 的临时文件步骤；在你本机直接 `npm run build` 会自动压缩，产物更小。

## 技术栈

- Vite 5 + React 18 + TypeScript（strict）
- react-router-dom 6 · **HashRouter**（`file://` 下可用）
- Zustand（auth / ui）
- Ant Design 5 + 自定义深色主题
- three.js 0.169（程序化生成园区，无外部模型文件）
- ECharts 5
- Tailwind CSS 3（仅用于布局工具类，主视觉走 CSS 变量）

## 目录

```
src/
├─ router/          路由表（28 个页面，全部懒加载）
├─ layouts/         BasicLayout（侧栏 + 顶栏）/ ImmersiveLayout（三维全屏）
├─ components/      ui（卡片/指标/状态标签）、charts、three
├─ features/        8 个业务模块
│  ├─ dashboard     总览驾驶舱
│  ├─ data          采集任务 / 数据集 / 质量精度
│  ├─ recon         三维查看器 / 模型资产 / 轻量化 / 偏差对比 / 场景发布
│  ├─ mr            设备 / 标定 / 编排编辑器 / 远程协同 / 会话记录
│  ├─ inspect       巡检计划 / 记录 / 缺陷
│  ├─ tickets       工单看板 / 详情
│  ├─ services      服务目录 / 订单 / 交付验收 / 知识库
│  └─ system        组织 / 用户 / 角色权限 / 日志 / 参数
├─ three/           ParkViewer：场景构建、拾取、测量、剖切、点云、标注
├─ mock/            固定种子数据生成（random / scene / index）
├─ services/        数据访问层（页面只调这里）
├─ stores/          auth（角色权限）/ ui（主题、侧栏）
├─ types/           领域模型
└─ utils/           格式化、坐标换算、导出
```

## 核心能力

**三维查看器**（`/recon/viewer`）

- 程序化生成 2.6 km² 园区：18 栋建筑（锯齿/坡屋顶、幕墙、月台、烟囱）、4 座储罐、4.2 km 管廊、220 kV 构架、码头门机、道路、水体、绿化、车辆、集装箱
- 场景树定位、8 个图层开关与透明度、6 种测量（距离/水平/面积/体积/角度/坐标）
- 单面剖切、点云三色着色（RGB / 高程 / 强度）、实景 vs BIM 对比
- 世界坐标标注，可转工单；状态栏实时显示 CGCS2000 坐标、经纬度、FPS、三角面、drawcall
- 窗户/树/路灯/车辆/集装箱全部 InstancedMesh，drawcall 约 110

**MR 虚实交互**

- 设备管理：18 台（HoloLens 2 / Pico 4 Enterprise / Magic Leap 2 / iPad Pro LiDAR）
- 空间标定：三步向导，模拟第一视角识别 Marker，输出 RMS、残差表与判定
- 交互编排：8 类节点 / 3 轨道时间轴 / 拖拽调整起始时间 / 播放预览（模型高亮、剖切、拆解、字幕、语音波形）
- 远程协同：双流画面、箭头/圈选/画笔/文字标注、同步提示、白板、录制、会话回放
- 所有 MR 页面均标注「模拟演示模式」，不假装连接真机

**业务闭环**

- 采集任务 → 质检 → 数据集 → 模型资产 → 轻量化 → 对比 → 发布
- 巡检 → 缺陷 → 工单 → 验收
- 服务目录 → 订单里程碑 → 交付物 → 验收结项

## 数据说明

- 固定种子 `20261019`，每次生成结果一致
- 用户 24、采集任务 42、模型资产 386、MR 终端 18、会话 327、缺陷 148、工单 212、服务订单 36、日志 2000
- 外键互相关联（设备→场景→标定→会话；缺陷→工单→三维坐标；订单→交付物→验收）
- 8%~12% 异常数据：离线设备、逾期订单、未闭环缺陷、质检不合格、SLA 超时
- 所有增删改写入 `localStorage`（前缀 `mirrorfield.`），刷新保留；参数设置页可重置

## 桌面端打包（Windows 便携版）

项目**不声明** `electron` / `electron-builder` 依赖：运行时由 electron-builder 临时下载，版本在打包时写入配置文件，`package.json` 里保持零桌面端依赖。

| 文件 | 作用 |
| --- | --- |
| `electron/main.cjs` | 主进程：单实例、去掉菜单、拦截外链与新窗口、`loadFile('dist/index.html')` |
| `electron-builder.yml` | portable / x64 / asar，只打包 `dist` 与 `electron` |
| `build/icon.ico`、`build/icon.png` | 独立设计的应用图标（256/128/64/48/32/16 六尺寸），不使用 Electron 默认图标 |
| `pack-win.bat` | 一键脚本，含镜像变量、构建、取 Electron 版本、生成配置、打包 |

Windows 上双击 `pack-win.bat` 即可，等价于：

```bat
set "ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
set "NPM_CONFIG_ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
set "ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/"
npm install
npm run build
for /f "delims=" %i in ('npm view electron version') do set "ELECTRON_VERSION=%i"
copy /y electron-builder.yml electron-builder.ci.yml >nul
(echo electronVersion: %ELECTRON_VERSION%)>> electron-builder.ci.yml
npx --yes electron-builder@latest --win portable --x64 --config electron-builder.ci.yml --publish never
```

> **不要再用 `-c.electronVersion=...` 这种写法**。electron-builder 26（`@latest` 现在解析到的版本）已移除 `-c.key=value` 覆盖语法，会把整串 `.directories.output=...` 当成配置文件路径，报 `ENOENT: open '...\.directories.output=...'`。所有参数一律写进 `electron-builder.yml`，动态值（Electron 版本）合并进临时副本 `electron-builder.ci.yml` 再传给 `--config`。

产物：`release/MirrorField-1.0.0-portable-x64.exe`，单文件双击运行，不写注册表。

CI：`.github/workflows/mirrorfield.yml`（GitHub Actions，`windows-latest`，Node 22），在 Actions 页手动 **Run workflow** 或打 `v*` 标签触发，产物在该次运行的 Artifacts 里（`MirrorField-portable-x64`，约 111 MB）。

## 已知限制

- 无后端，登录为本地校验
- 三维场景为程序化生成，不加载真实 OSGB / 3D Tiles（`ParkViewer` 中预留了接入位置）
- MR 为模拟演示，未接入真实 WebXR 会话与终端
- 无任何在线地图、CDN、Web Font 依赖，保证离线可用与桌面端封装
