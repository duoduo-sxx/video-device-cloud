# 数据存储系统与技术服务（StorageOps Console）

面向政企数据中心的**存储资源统一纳管 + 技术服务交付**平台前端。左侧管"资产与容量"，右侧管"服务与交付"，中间用"告警 → 工单"打通。

> 纯前端项目：无后端、无真实接口，全部数据本地 Mock 并持久化到 localStorage。构建产物可直接被 Electron / Tauri 壳加载。

## 技术栈

| 层 | 选型 |
| --- | --- |
| 框架 | Vue 3.5 + `<script setup lang="ts">` |
| 语言 | TypeScript 5.6（strict） |
| 构建 | Vite 5（`base: './'`） |
| 路由 | Vue Router 4（**hash 模式**） |
| 状态 | Pinia |
| UI | Element Plus 2.8（主题变量覆盖） |
| 图表 | ECharts 5 |
| 时间 | dayjs |

零外网请求：无 CDN、无在线字体/图标/图片。

## 启动

```bash
npm install
npm run dev      # http://127.0.0.1:5173
npm run build    # 产物在 dist/，可直接 file:// 打开
npm run smoke    # 数据层 + 接口层冒烟测试（无需浏览器）
```

## 演示账号

密码统一为 `123456`。

| 账号 | 姓名 | 角色 | 数据范围 |
| --- | --- | --- | --- |
| `admin` | 系统管理员 | 平台管理员 | 全部功能 |
| `manager` | 张伟 | 服务经理 | 派单、合同、报表 |
| `engineer` | 陈立 | 存储运维工程师 | 处理工单、查看资源 |
| `customer` | 李建国 | 客户管理员 | 仅本客户、报障与验收 |
| `desk` | 林悦 | 服务台坐席 | 建单、分派 |
| `viewer` | 周敏 | 领导 / 审计 | 全部只读 |

登录页提供一键登录；顶栏用户菜单可随时"切换角色（演示）"，菜单与数据范围同步变化。

## 已实现页面

- **工作台**：8 个指标卡、容量趋势与预测、告警分布、工单趋势、服务项 TOP5、容量风险 TOP5、待办、值班、动态、最新工单
- **资源管理**：存储集群（列表 + 详情）、存储池（含扩容变更）、设备台账（表格/卡片双视图 + 详情含磁盘槽位）、卷与文件系统（新建/删除）
- **监控告警**：告警中心（等级卡筛选、批量确认、详情抽屉、一键转工单）、巡检管理（报告抽屉 + 模拟执行）
- **技术服务**：服务目录、工单列表（5 个 Tab）、新建工单（引导式 + SLA 预览）、工单详情（状态机 + 处理时间线 + SLA 倒计时 + 工时 + 满意度）、工单看板（拖拽流转）、变更管理（审批）、知识库（分类/标签/搜索 + Markdown 详情）、备件管理（库存/出入库/返修 + 领用扣减）、服务合同（列表 + SLA 条款详情）、服务质量分析（8 指标 + 4 图表 + 工程师绩效）、值班排班
- **客户与机房**：客户列表与详情（概览/设备/存储池/合同/工单/联系人）、机房管理（机柜 U 位、温湿度）
- **统计报表**：容量分析（4 图表 + 扩容需求清单）
- **系统管理**：用户管理（增改启停）、角色权限（权限树）、参数配置（含重置演示数据）、操作日志（详情对比）
- **其他**：全局搜索、消息中心、个人设置、403 / 404

## Mock 数据

`src/mock/seed.ts` 使用固定种子伪随机生成，保证每次结构与分布一致：

| 实体 | 数量 | 实体 | 数量 |
| --- | --- | --- | --- |
| 客户 | 8 | 告警 | 186 |
| 机房 | 12 | 工单 | 268 |
| 存储集群 | 18 | 备件 | 52 |
| 存储池 | 46 | 知识库 | 64 |
| 设备 | 126 | 合同 | 8 |
| 卷 | 320 | 备件记录 | 68 |
| 主机 | 86 | 用户 | 26 |
| 变更 | 22 | 日志 | 300 |
| 巡检 | 14 | 消息 | 14 |

数量是确定值（循环次数固定），容量、使用率、状态等字段按固定种子随机分布；`npm run smoke` 会逐项校验数量与关联完整性。

数据使用真实厂商型号（华为 OceanStor Dorado 6800 V6、浪潮 AS5500G5、NetApp AFF A400、PowerStore 5000T 等）、真实命名规范（`POOL-GOV-PRD-01`、`LUN-GOV-ORA-DATA01`、`10.20.11.x`、`WO-202610-0042`），并按合理分布造数（使用率均值 62%、5% 池超 90%、工单状态与优先级按真实比例分布）。

写操作（建单、派单、解决、关闭、备件领用、扩容、审批、消息已读等）会修改内存数据并写入 `localStorage`，刷新不丢失。系统管理 → 参数配置页可一键重置。

## 目录

```
src/
├─ api/           模拟接口层（与真实接口同签名，含分页/筛选/排序）
├─ mock/          种子数据与本地库（localStorage 持久化）
├─ components/    布局、指标卡、图表卡、状态标签、容量条、空态
├─ config/        侧边栏导航配置
├─ constants/     角色、权限、状态映射、图表色板
├─ router/        路由与权限守卫
├─ stores/        用户与会话
├─ styles/        主题变量与 Element Plus 覆盖
├─ types/         全部实体类型
├─ utils/         格式化、查询、CSV 导出、Markdown 渲染
└─ views/         页面
```

## 桌面端打包说明

项目内**不含**任何 Electron / Tauri 依赖。直接套壳时注意：

1. 路由已是 hash 模式，`file://` 下刷新不 404；
2. `vite.config.ts` 已设置 `base: './'`；
3. 产物文件名固定（`dist/assets/index.js`、`index.css` 等，不带 hash），外壳可直接写死入口；
4. 无任何外网请求，图片与图标全部本地；
5. 持久化仅使用 localStorage（键名前缀 `soc.`）；
6. 导出使用 Blob + `a.download`，不依赖 Node API。

构建参数说明：`target: 'esnext'`（外壳内置新版 Chromium，无需语法降级）、`minify: false`（本地/离线加载，压缩收益有限；需要更小体积时改成 `'esbuild'` 即可）。

## 质量校验

- `npm run build`：模板编译、类型忽略、按页分包全部通过（30+ 页面，首个 JS 约 2.7 MB 未压缩）；
- `npm run smoke`：校验 19 类实体数量、客户/机房/集群/池/设备/卷/告警/工单/备件记录的关联完整性、容量口径自洽，并跑通「建单 → 受理 → 派单 → 解决 → 关闭 + 满意度」、告警确认、备件领用扣减、存储池扩容、全局搜索、格式化与 Markdown 渲染。

## 已知限制

- 登录为本地 Mock，密码固定 `123456`，不做真实鉴权；
- 附件仅记录文件名，不上传真实文件；
- 扩容、审批、备件领用等为前端状态模拟，不产生真实工单流转记录到后端；
- 图表指标（IOPS、时延、预测）为造数，不代表真实设备采集。

## 桌面端打包（Windows portable）

工程内**不引入**任何 electron 依赖，打包时由 `electron-builder` 临时拉取运行时：

1. `electron-builder.yml`：打包配置（只带 `dist/` 前端产物，asar、免安装单文件 portable、应用图标 `build/icon.ico`）；
2. `build/icon.ico` + `build/icons/*.png`：应用图标（独立设计生成，非 Electron 默认图标）；
3. `.github/workflows/storageops-console.yml`：GitHub Actions 自动打包，推送到 `storageops-web` 分支或手动触发（workflow_dispatch），产物为 Windows x64 portable exe，可在 Actions 页面下载。

Windows 本地打包命令：

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
