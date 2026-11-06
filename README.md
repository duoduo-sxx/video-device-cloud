# 星火链证 XH-CHAIN

区块链存证与确权系统及技术服务 · 纯前端演示系统

## 桌面端打包（Electron，无需引入 electron 依赖）

项目**不在 `package.json` 中引入 electron / electron-builder 依赖**，运行时版本由命令行 `-c.electronVersion` 传入，由 electron-builder 自行下载。产物为 Windows 便携版单文件 exe（免安装）。

### 本机打包（Windows）

```bat
pack-win.bat
```

或手动执行（与下列命令等价）：

```bat
set "ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
set "NPM_CONFIG_ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
set "ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/"
npm install
npm run build
for /f "delims=" %i in ('npm view electron version') do set "ELECTRON_VERSION=%i"
npx --yes electron-builder@latest --win portable --x64 --config electron-builder.yml --publish never -c.electronVersion=%ELECTRON_VERSION% -c.directories.output=release
```

### GitHub Actions 云端打包

workflow：`.github/workflows/xh-chain-desktop.yml`（名称「星火链证 XH-CHAIN」）。
在 Actions 页面手动触发（可填 Electron 版本），或推送 `v*` 标签自动触发；
完成后在 Run 页面的 Artifacts 下载 `xh-chain-windows-portable`。

### 桌面端实现说明

- `electron/main.cjs`：主进程。注册 `app://` 自定义协议加载 `dist/`（ES Module 在 `file://`
  下会被 CORS 拦截，因此必须用自定义协议），单实例锁、外链转系统浏览器、F12 开发者工具。
- `electron-builder.yml`：`files` 只含 `dist`、`electron` 与图标，`asar: false`，
  不打包任何 node_modules（前端已全量 bundle）。
- `build/icon.png` / `build/icon.svg`：自绘应用图标（双环相扣），非 Electron 默认图标。
- 产物命名：`xh-chain-<版本>-portable-x64.exe`。

## 启动

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 产物输出到 dist/
npm run preview  # 本地预览 dist/，http://localhost:4173
```

`vite.config.ts` 已设置 `base: './'`，资源全部为相对路径，路由使用 `HashRouter`，因此 dist 产物可由**任意静态服务器**直接托管；Electron / Tauri 通过自定义协议（`app://` / `tauri://`）加载 dist 目录即可，项目内不包含任何桌面端依赖。

> 注意：产物使用 `<script type="module">`，浏览器的安全策略会拦截 `file://` 协议下的 ES Module，
> 因此不能直接双击 `dist/index.html` 打开，需通过 HTTP 服务（`npm run preview`、Nginx、
> Electron 自定义协议等）访问。

`dist/boot.html` 是演示引导页：访问 `boot.html?to=<路由>`（如 `?to=evidence`）会自动注入演示登录态并跳转到对应页面，便于快速浏览各功能。

## 演示账号

| 项 | 值 |
|---|---|
| 账号 | `13800138000` |
| 密码 | `demo1234` |
| 图形验证码 | 按输入框右侧显示的字符填写 |

登录后点击右上角头像 → **切换演示角色**，可在 6 个角色间切换，菜单与按钮权限会即时变化。

## 技术栈

React 18.3 · TypeScript 5.6（strict）· Vite 5 · react-router-dom 6（HashRouter）
zustand + persist · Tailwind CSS 3.4 · recharts · lucide-react · dayjs · qrcode.react · sonner

无后端、无真实网络请求；所有数据由 `src/mock` 生成，写操作写入内存并持久化到 localStorage。

## 目录

```
src/
  components/ui        基础组件（Button / Input / Table / Modal / Steps / Timeline / HashText …）
  components/business  业务组件（CertificateCard / SealStamp / DocPaper / NodeTopology）
  components/charts    recharts 封装
  layouts              AppLayout（侧栏 + 顶栏）、AuthLayout
  pages                按业务模块划分，共 45 个页面
  mock
    generators.ts      固定种子生成 480 条存证 / 120 条权属 / 2400 区块 / 9600 交易等
    api.ts             mockApi 异步接口层（延迟、分页、筛选），页面只依赖该层
  router               路由表与导航配置
  store                auth / ui / data（persist）
  types                全部数据模型
  utils                格式化、哈希、下载、常量
```

## 数据说明

- 存证 480 条、权属 120 条、区块 2400 个、交易 9600 笔、合同 86 份、取证 64 条、证据包 38 个、
  出证单 24 条、数据资产 42 个、成员 24 人、审计日志 1200 条。
- 编码规则：`EV-YYYYMMDD-NNNN`（存证）、`RR-YYYY-NNNNNN`（权属）、`XH-EV-YYYY-MM-NNNNNN`（证书）、
  `CT-YYYY-NNNN`（合同）、`FZ-…`（取证）、`PK-…`（证据包）、`JD-…`（出证）、`DA-…`（数据资产）。
- 哈希统一 `0x` + 64 位十六进制，由确定性伪随机函数生成，同一对象每次刷新结果一致。
- 区块高度与时间绑定：`height = 2486921 - (now - time) / 2100ms`，因此存证详情里的区块高度可以直接跳转区块页。

## 替换为真实接口

页面只调用 `src/mock/api.ts` 中的 `mockApi`。接入后端时，保持函数签名不变，把实现替换为 `fetch` 即可，
其余代码无需改动。

## 已实现的功能范围

- 工作台：指标卡、趋势图、类型分布、链上实时动态、待办、快捷入口
- 存证：单文件 / 文本 / 网页存证（含上链动画）、批量队列、列表筛选导出、存证详情与证书、哈希核验三态
- 确权：4 步登记向导、权属列表与详情、权属证书、权属图谱、异议处理
- 合同：合同列表、正文 A4 预览、多方模拟签署、验签信息、模板库
- 维权：网页取证（四阶段）、取证任务、侵权监测与相似度对比、证据包、司法出证与公证书预览
- 数据资产：登记向导、台账、详情（数据字典 / 授权链路 / 使用记录）、授权管理
- 区块链：总览（实时出块）、区块列表 / 详情、交易列表 / 详情（原始 JSON）、节点监控与拓扑、智能合约
- 技术服务：API 接入与调试台、密钥管理（SK 仅显示一次）、调用统计、开发文档
- 组织：成员管理、角色权限矩阵、审计日志
- 其他：套餐账单、账户设置、消息中心、帮助工单、403 / 404
