# 惯性参数感知系统 · InertialSense

面向惯性器件（光纤陀螺、MEMS 陀螺、加速度计、IMU、组合导航系统）的**测试标定、参数辨识、误差补偿、数据分析与健康管理**一体化 Web 平台。

纯前端实现，无后端、无网络请求，全部数据由本地 Mock 层生成；使用 HashRouter + 相对路径构建，可直接被 Electron / Tauri 等桌面外壳承载。

---

## 快速开始

```bash
# Node 18+（推荐 20/22）
npm install
npm run dev        # http://127.0.0.1:5173

npm run build      # 产物输出到 dist，可直接双击 dist/index.html
npm run preview
npm run typecheck
```

演示账号（密码均为 `123456`）：

| 账号 | 姓名 | 角色 |
|---|---|---|
| admin | 系统管理员 | 全部权限 |
| zhangqm | 张启明 | 标定工程师 |
| chenli | 陈立 | 数据分析师 |
| lihui | 李慧 | 质量审核员 |

---

## 功能地图

| 路由 | 页面 | 核心内容 |
|---|---|---|
| `/login` | 登录 | 角色演示账号、mock 鉴权 |
| `/dashboard` | 总览驾驶舱 | 6 项指标、任务趋势、设备状态、实时流、告警、健康排行 |
| `/devices` | 设备台账 | 多条件筛选、排序分页、列设置、CSV 导出、新增抽屉、状态流转 |
| `/devices/:id` | 设备详情 | 技术指标、通道配置、标定历史与参数 diff、试验记录、文档、生命周期 |
| `/stations` | 台位与工装 | 转台/温箱/静基座占用、利用率、校准有效期 |
| `/acquisition` | 实时采集 | 200 Hz 仿真、三轴波形、姿态球、数据质量、打标、保存文件 |
| `/calibration` | 标定与辨识 | 任务列表、方案库、新建任务、状态联动 |
| `/calibration/:id` | 执行向导 | 六位置流程、判稳、驻留计时、自动切换、解算动画 |
| `/calibration/:id/result` | 标定结果 | 零偏/标度因数/安装误差矩阵、残差、温度特性、审核 |
| `/modeling` | 误差建模 | 温度模型、补偿前后对比、残差改善、模型版本 |
| `/analysis` | 数据分析 | Allan 方差（五段斜率+谷底标注）、PSD、FFT、统计、直方图 |
| `/replay` | 数据回放 | 多通道联动、倍速播放、事件标记跳转 |
| `/trajectory` | 姿态与轨迹 | 姿态球、北东轨迹、姿态角曲线、时间轴联动 |
| `/tasks` | 任务与工单 | 看板拖拽改状态、列表视图、详情与评论 |
| `/alarms` | 告警中心 | 等级筛选、确认/指派/闭环、规则配置 |
| `/health` | 健康评估 | 综合评分、六维雷达、90 天趋势、维护建议、同型对比 |
| `/reports` | 报告中心 | A4 报告预览、三步生成向导、打印导出 |
| `/services` | 技术服务 | 服务工单、SLA 达标看板、知识库 |
| `/system` | 系统管理 | 用户、角色权限树、数据字典、审计日志 |

---

## 工程结构

```
src/
├─ components/     通用组件：EChart、ChartPanel、StatCard、HealthRing、PageHeader…
├─ constants/      字典与标签映射（设备类型/状态/告警等级…）
├─ layouts/        BasicLayout：深色侧栏 + 顶栏 + 页签
├─ mock/
│  ├─ seed.ts      确定性种子数据（48 设备 / 42 标定任务 / 120 数据文件 / 86 告警…）
│  └─ db.ts        内存库与写操作
├─ pages/          19 个页面
├─ services/       领域服务（异步 + 延迟 + 深拷贝），页面不直接访问 mock
├─ store/          Zustand：登录态、侧栏、页签
├─ styles/         设计变量与全局样式
├─ types/          领域模型定义
└─ utils/          格式化、统计、Allan 方差、信号与轨迹生成、图表配置
```

---

## 数据说明

- 随机种子固定 `20261019`，同一设备每次进入页面数据形态一致。
- 编号规则：`IMU-2023-0017`、`CAL-2026-0187`、`RAW-20261015-0031`、`ALM-20261019-0031`、`RPT-CAL-2026-0187`、`SR-2026-0451`。
- 指标区间符合行业常识：零偏稳定性 0.012~0.12 °/h、ARW 0.008~0.06 °/√h、非线性 30~80 ppm。
- 关联自洽：设备与台位双向绑定；结果回指任务；健康分与健康记录一致；告警设备均存在。
- Allan 曲线由五项噪声公式生成：`σ²(τ)=3Q²/τ²+N²/τ+(2ln2/π)B²+K²τ/3+R²τ²/2`。
- 实时波形 = 常值零偏 + 白噪声 + 一阶马尔可夫 1/f 漂移 + 随机游走 + 30 min 周期温度漂移。

> 所有厂商、型号、人名均为虚构，仅用于演示。

---

## 桌面端打包

项目本身**不依赖 electron npm 包**（dependencies / devDependencies 里没有任何 Electron 相关项）。构建后 `dist/` 为纯静态资源：

1. `base: './'` + `HashRouter`，可直接以 `file://` 加载；
2. 无 CDN、无外链字体、无 Service Worker；
3. 下载使用 Blob + `URL.createObjectURL`；
4. 导出 PDF 走 `window.print()` + 打印样式。

### Windows 便携版（免安装单 exe）

打包所需配置已就绪：

| 文件 | 作用 |
|---|---|
| `electron/main.cjs` | Electron 主进程（仅承载窗口加载 `dist/index.html`，不含业务逻辑；CommonJS，不受 `"type": "module"` 影响） |
| `electron-builder.yml` | 打包配置：productName、`build/icon.ico` 图标、portable 目标、只打包 `dist/ + electron/ + package.json` |
| `build/icon.ico` / `build/icon.png` | 应用图标（多尺寸 16~256，非 Electron 默认图标） |
| `pack-win.bat` | Windows 一键打包脚本（npm 镜像 → install → build → electron-builder） |

本机打包（CMD）：

```bat
pack-win.bat
```

或手动执行（与 GitHub Actions 完全一致）：

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

### GitHub Actions 云端打包

`.github/workflows/inertial-sense-build.yml`（名称：**惯性参数感知系统**）：

- 触发：手动 `workflow_dispatch`、push 到 `main` / `feat/**`、推送 `v*` 标签；
- 运行在 `windows-latest`，使用 npmmirror 镜像下载 Electron 二进制；
- 步骤：`npm install` → `npm run build` → 读取 Electron 最新版本 → `npx electron-builder --win portable --x64`；
- 产物以 Artifact 上传（保留 14 天），可直接下载 exe。

---

## 自检结果

| 检查项 | 命令 | 结果 |
|---|---|---|
| 类型检查 | `npm run typecheck`（tsc --noEmit，strict） | 0 error |
| 模块转译 | `npm run build` 的 transform 阶段 | 3633 个模块全部通过 |
| 数据层一致性 | 72 条断言（体量、外键、数值区间、服务分页、Allan/遥测算法） | 72/72 通过 |
| 模块加载 | 19 页 + 布局 + 服务 + 工具模块 | 全部可加载，默认导出正常 |

数据层断言覆盖：设备 48 / 台位 8 / 标定任务 42 / 数据文件 120 / 告警 86 / 工单 36 / 报告 26 / 服务单 24 / 知识 18 / 用户 12 / 审计日志 200，
并校验「任务→设备」「结果→任务」「文件→设备」「告警→设备」「健康记录→设备」「设备↔台位」六类外键全部闭合。

---

## 本地清理

首次安装若被中断，可能残留 `tmpdeps/`、`vite-cache/`、`*.log` 与 `vite.config.ts.timestamp-*.mjs`，均可安全删除：

```bash
rm -rf tmpdeps vite-cache *.log vite.config.ts.timestamp-*.mjs
```

