# 视频智能化内容理解与分析系统

纯前端演示工程。所有数据为本地 Mock，不需要后端服务；页面按桌面端打包场景设计，但工程内**不包含**任何 Electron / Tauri 依赖。

## 运行

```bash
cd video-insight
npm install
npm run dev      # http://localhost:5173
npm run build    # 产物在 dist/，可直接 file:// 打开（HashRouter + base './'）
npm run preview
npm run smoke    # 19 条路由的服务端渲染冒烟测试（不依赖浏览器）
```

Node 版本 ≥ 18。演示账号已内置，登录页任意密码均可进入，也可点「演示身份一键进入」切换五种角色。

| 角色 | 可见菜单 | 用途 |
| --- | --- | --- |
| 平台管理员 | 全部 | 完整演示 |
| 内容分析师 | 工作台 / 视频库 / 检索 / 数据分析 / 模型 | 解析与检索 |
| 内容审核员 | 工作台 / 视频库 / 审核 | 审核队列 |
| 创作者 | 工作台 / 视频库 / 检索 / 剪辑 | 剪辑与检索 |
| 只读访客 | 工作台 / 数据分析 | 看报表 |

## 页面清单

| 路由 | 页面 | 关键内容 |
| --- | --- | --- |
| `/login` | 登录 | 品牌侧栏、角色快捷登录 |
| `/dashboard` | 工作台 | 6 个指标卡、解析趋势、题材分布、标签 TOP10、时长分布、审核构成、任务流、快捷入口 |
| `/videos` | 视频资产库 | 网格/表格双视图、状态与题材筛选、批量选择、上传向导（本地/链接/回放/接口四通道） |
| `/videos/:id` | 视频详情 | 虚拟播放器、技术参数、场景切分缩略图、解析概览、审核记录、同题材推荐 |
| `/videos/:id/analysis` | 智能解析工作台 | 播放器 + 六轨时间轴 + 六个分析面板 + 解析链路条；未解析视频可提交任务并观察流水线执行 |
| `/search` | 智能检索 | 自然语言/以图搜/画面文字三种模式、四步召回动画、命中依据展开、抽屉内定位播放 |
| `/review` `/review/:id` | 内容审核 | 待审队列、风险等级与类型筛选、双栏复核台、通过/驳回/存疑、A/D/S 快捷键 |
| `/editing` `/editing/:id` | 智能剪辑 | 项目列表、AI 推荐片段、目标时长自动拼装、片段排序、导出进度模拟 |
| `/analytics` | 数据分析 | 空间与时间切片、6 指标、5 张图表、播放 TOP6、审核质量、CSV 导出 |
| `/models` | 模型与能力 | 9 个模型卡片、启停开关、详情抽屉、在线测试控制台 |
| `/models/pipeline` | 流水线编排 | 6 阶段可增删改、并发配置、三种预设模板、试运行动画、资源估算 |
| `/settings/users` | 用户管理 | 列表、角色就地调整、启停、新建用户 |
| `/settings/roles` | 角色权限 | 5 角色 × 9 模块 × 5 操作矩阵 |
| `/settings/spaces` | 空间管理 | 容量进度、成员与视频数、扩容 |
| `/settings/api-keys` | API 密钥 | 掩码展示、显示/复制、启停、新建 |
| `/settings/audit` | 操作审计 | 60 条日志、筛选、分页、导出 |
| `/settings/profile` | 个人中心 | 基本信息、安全设置、主题切换、通知偏好 |

## 目录

```
src/
  components/   Layout 骨架、UI 原语、ECharts 封装、播放器、时间轴、六个分析面板
  pages/        13 个页面
  mock/         data.ts（用户/视频/任务/审核/模型/日志/项目）
                analysis.ts（黄金样本 vid_003 的完整解析结果）
                synth.ts（其余视频的确定性解析数据生成器）
                search.ts（8 组预设查询 + 兜底召回）
  services/     全部异步接口，含 localStorage 持久化
  stores/       zustand：auth / ui(主题) / player(虚拟播放时钟)
  types/        全量 TypeScript 类型
  constants/    导航、角色权限、枚举字典
```

## 关键实现说明

**虚拟播放引擎**：不依赖真实视频文件。`stores/index.ts` 用 `requestAnimationFrame` 驱动 `currentTime`，播放器按当前时间命中场景取缩略图并叠加 Ken Burns 动效。时间轴、字幕、进度条全部订阅同一个时钟，断网也能完整演示。

**解析数据兜底**：`mock/analysis.ts` 只为 `vid_003`（景泰蓝纪录片）维护了手工样本；其余 35 个视频由 `mock/synth.ts` 依据视频时长、题材、标签确定性生成转写、场景、人物、事件、实体与摘要，同一视频每次打开内容一致。

**未解析视频**：进入解析工作台时若状态为 `pending` / `analyzing`，会弹出任务提交框，确认后按阶段推进 6 步流水线（进度与阶段状态联动），完成后写入 localStorage 并展示结果。

**持久化**：视频、用户、审核结论、通知、剪辑项目变更写入 `localStorage`（`vi_state_v1`），刷新后保留；主题与登录态分别存在 `vi_theme` / `vi_auth`。

## 桌面端打包（Windows 便携版）

工程内**不引入** Electron 依赖；主进程入口为根目录 `electron-main.cjs`（纯 JS 启动壳），Electron 运行时由 electron-builder 打包时按 `-c.electronVersion` 自动注入。应用图标在 `build/icon.ico`（多尺寸）与 `build/icon.png`。

Windows 下执行（cmd）：

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

产物为 `PACK_OUTPUT` 目录下的 `VideoInsight-Portable-<版本>.exe`（单文件便携版，双击即用）。

GitHub Actions 已配置同名 workflow（`.github/workflows/video-insight-build.yml`），推送到 `video-insight` 分支或在 Actions 页手动触发即可在线打包，产物在 workflow Artifact 中下载。

## 桌面端打包注意事项

- `vite.config.ts` 已设 `base: './'`，资源全部相对路径。
- 路由使用 `HashRouter`，`file://` 下可直接工作。
- 未使用 `window.open`、未引用绝对路径、未依赖远程字体。
- 封面图来自 `picsum.photos`、头像来自 `pravatar.cc`；离线环境下图片会静默失败但不影响布局与交互。若要完全离线，把 `lib/utils.ts` 的 `coverUrl` / `avatarUrl` 换成内置渐变占位即可。

## 二次开发约定

- 所有颜色走 CSS 变量（`styles/index.css`），浅色/深色两套；新增组件不要写死十六进制。
- 新增页面：在 `types` 补类型 → `mock` 补数据 → `services` 补异步函数 → `pages` 建页面 → `App.tsx` 注册路由 → `constants` 的 `NAV` 与 `ROLE_PERMISSIONS` 加菜单项。
- 数值展示统一用 `.num` 类（等宽数字），时间用 `formatDuration` / `formatTimecode`。
