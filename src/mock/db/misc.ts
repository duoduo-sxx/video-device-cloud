import type { AuditLog, Contract, Notification } from '@/types/models';
import type { ChannelId } from '@/types/enums';
import { projects } from './projects';
import { clients } from './clients';
import { users } from './users';
import { daysAgo, daysLater, makeRng } from '../seed';

const rng = makeRng(20261212);

/* ---------------- 合同 ---------------- */
const projectAmount = new Map(projects.map((p) => [p.clientId, p.contractAmount]));

export const contracts: Contract[] = clients.map((client, i) => {
  const amount = projectAmount.get(client.id) ?? client.totalContractAmount;
  const receivedRatio = rng.pick([0.25, 0.4, 0.5, 0.6, 0.75, 0.85, 1]);
  const received = Math.round(amount * receivedRatio);

  const plannedDates = [daysAgo(280), daysAgo(180), daysAgo(80), daysLater(45)];

  return {
    id: `HT-2026-${String(20 + i).padStart(4, '0')}`,
    clientId: client.id,
    projectIds: projects.filter((p) => p.clientId === client.id).map((p) => p.id),
    type: rng.pick(['fixed', 'fixed', 'fixed', 'man_day', 'revenue_share']),
    amount,
    received,
    signDate: client.cooperateSince,
    expireDate: daysLater(rng.int(30, 400)).slice(0, 10),
    status: receivedRatio >= 1 ? 'closed' : rng.chance(0.2) ? 'renewing' : 'active',
    milestones: [0, 1, 2, 3].map((idx) => {
      const ratio = [0.3, 0.25, 0.25, 0.2][idx] as number;
      const mAmount = Math.round(amount * ratio);
      const paid = received >= mAmount * (idx + 1);
      const overdue = !paid && new Date(plannedDates[idx] as string) < new Date('2026-10-19');
      return {
        name: ['合同签订首付款', '中期进度款', '验收款', '质保金'][idx] as string,
        ratio,
        amount: mAmount,
        plannedDate: (plannedDates[idx] as string).slice(0, 10),
        receivedDate: paid ? (plannedDates[idx] as string).slice(0, 10) : null,
        status: paid ? 'received' : overdue ? 'overdue' : rng.chance(0.5) ? 'invoiced' : 'pending',
      };
    }),
  };
});

export const contractsById = new Map(contracts.map((c) => [c.id, c]));

/* ---------------- 通知 ---------------- */
const NOTIFICATION_SEEDS: Omit<Notification, 'id' | 'read' | 'createdAt'>[] = [
  { type: 'approval', title: '发布单待审批', content: '「深海迷航：无尽海域」v1.4.2 申请发布至微信小游戏、抖音小游戏，请审批。', link: '/releases' },
  { type: 'alert', title: '首包体积超限', content: '「像素农场物语」Facebook 端首包 19.2MB，接近 20MB 上限。', link: '/assets/budget' },
  { type: 'alert', title: 'SLA 即将超时', content: 'TK-2026-1093（P0）距解决时限剩余 22 分钟，当前状态：处理中。', link: '/support/tickets' },
  { type: 'mention', title: '周砚青 在缺陷中提到了你', content: 'BUG-2026-0318：抖音渠道登录后角色数据为空，需要你确认修复方案。', link: '/projects/PRJ-2026-014/bugs' },
  { type: 'system', title: '构建失败', content: 'BLD-2026-1284 资源构建失败：shop_panel.webp 路径引用错误。', link: '/builds' },
  { type: 'alert', title: '崩溃率异常上升', content: '「极速赛道 3D」CrazyGames 渠道崩溃率升至 0.62%，较昨日 +0.31%。', link: '/quality/crashes' },
  { type: 'approval', title: '需求变更待确认', content: '「塔防纪元」3 项数值重做需求超出合同范围，需确认是否计入变更。', link: '/projects/PRJ-2026-021/requirements' },
  { type: 'mention', title: '林知远 评论了任务', content: 'TSK-2026-2841：分包加载顺序调整已完成，请安排回归。', link: '/projects/PRJ-2026-011/board' },
  { type: 'alert', title: '里程碑逾期', content: '「谜题工厂」核心玩法 Demo 已逾期 6 天。', link: '/projects/PRJ-2026-024/milestones' },
  { type: 'system', title: '渠道审核驳回', content: '「萌宠消消乐」抖音渠道审核驳回：诱导分享。', link: '/releases' },
  { type: 'approval', title: '合同续签待审批', content: '云跃网络 2027 年度框架协议续签，金额 320 万。', link: '/billing/contracts' },
  { type: 'alert', title: '未引用资源堆积', content: '素材库检测到 62 个未引用资源，可释放约 46.8MB。', link: '/assets' },
  { type: 'mention', title: '叶知秋 指派了缺陷给你', content: 'BUG-2026-0402：iOS 17.5 Safari 下音频切后台不恢复。', link: '/projects/PRJ-2025-028/bugs' },
  { type: 'system', title: '集成同步完成', content: 'GitLab 仓库同步完成，新增 14 次提交。', link: '/settings/integrations' },
  { type: 'approval', title: '灰度提升待确认', content: '「三国：烽火连城」v3.2.1 微信渠道申请从 30% 提升至 50%。', link: '/releases' },
  { type: 'alert', title: '性能预算超标', content: '「谜题工厂」低端机首屏 P95 达 4.2s，超出预算 40%。', link: '/quality/performance' },
  { type: 'mention', title: '苏牧 在需求中回复', content: 'REQ-2026-0084：图集合并方案已评估，预计节省 1.2MB。', link: '/projects/PRJ-2026-011/requirements' },
  { type: 'system', title: '成员状态变更', content: '唐小满 已进入休假状态，其名下 4 个任务待转派。', link: '/team' },
  { type: 'alert', title: '工单满意度下降', content: '本月工单满意度均值 4.1，较上月下降 0.3。', link: '/support/tickets' },
  { type: 'approval', title: '新成员待审核', content: '骆川 申请加入「深海迷航：无尽海域」项目。', link: '/team' },
  { type: 'system', title: '版本已上线', content: '「末日方舟」v2.8.4 已在抖音、微信双端全量上线。', link: '/releases' },
  { type: 'alert', title: '渠道限流预警', content: '「极速赛道 3D」Poki 渠道流量连续 12 天下滑，累计 -34%。', link: '/analytics/channels' },
  { type: 'mention', title: '陈嘉禾 提到了你', content: '周一经营会需要「深海迷航」的进度与风险材料。', link: '/projects/PRJ-2026-011' },
  { type: 'system', title: '审计日志异常', content: '检测到 3 次失败登录尝试，来源 IP 103.24.**.**。', link: '/settings/audit' },
];

export const notifications: Notification[] = NOTIFICATION_SEEDS.map((n, i) => ({
  ...n,
  id: `NT-${String(100 + i)}`,
  read: i >= 7,
  createdAt: daysAgo(i < 7 ? 0 : Math.floor(i / 4), 9 + (i % 8), (i * 7) % 60),
}));

/* ---------------- 审计日志 ---------------- */
const ACTIONS = [
  { action: '登录系统', targetType: '账号', target: '自身' },
  { action: '创建项目', targetType: '项目', target: '深海迷航：无尽海域' },
  { action: '修改需求状态', targetType: '需求', target: 'REQ-2026-0084' },
  { action: '关闭缺陷', targetType: '缺陷', target: 'BUG-2026-0318' },
  { action: '触发构建', targetType: '构建', target: 'BLD-2026-1284' },
  { action: '提交发布单', targetType: '发布', target: 'REL-2026-0231' },
  { action: '回滚版本', targetType: '发布', target: 'REL-2026-0218' },
  { action: '重置 AppKey', targetType: 'SDK', target: 'np_live_8f3a2c' },
  { action: '导出报表', targetType: '报表', target: '2026-09 经营月报' },
  { action: '修改成员角色', targetType: '成员', target: '骆川' },
  { action: '删除任务', targetType: '任务', target: 'TSK-2026-2102' },
  { action: '审批通过', targetType: '发布', target: 'REL-2026-0224' },
];

export const auditLogs: AuditLog[] = Array.from({ length: 300 }, (_, i) => {
  const a = ACTIONS[i % ACTIONS.length] as (typeof ACTIONS)[number];
  const user = users[i % users.length] as (typeof users)[number];
  return {
    id: `LOG-${String(10000 + i)}`,
    userId: user.id,
    action: a.action,
    targetType: a.targetType,
    targetName: a.target,
    ip: `10.24.${rng.int(1, 254)}.${rng.int(1, 254)}`,
    result: rng.chance(0.94) ? 'success' : 'failed',
    createdAt: daysAgo(i < 120 ? 0 : Math.floor(i / 12), rng.int(8, 21), rng.int(0, 59)),
  };
});

/* ---------------- 异常聚合 ---------------- */
export interface CrashGroup {
  id: string;
  signature: string;
  type: string;
  message: string;
  count: number;
  users: number;
  firstSeen: string;
  lastSeen: string;
  version: string;
  projectId: string;
  channel: ChannelId;
  status: 'open' | 'fixing' | 'fixed' | 'ignored';
  isNew: boolean;
  stack: string[];
  devices: { name: string; ratio: number }[];
}

const CRASH_TEMPLATES = [
  {
    signature: 'TypeError: Cannot read property "length" of undefined',
    type: 'TypeError',
    message: "Cannot read property 'length' of undefined",
    stack: [
      "TypeError: Cannot read property 'length' of undefined",
      '    at BattleController.update (battle.js:1284:31)',
      '    at GameLoop.tick (game-loop.js:96:18)',
      '    at rAF (raf.js:12:9)',
    ],
  },
  {
    signature: 'RangeError: Maximum call stack size exceeded',
    type: 'RangeError',
    message: 'Maximum call stack size exceeded',
    stack: [
      'RangeError: Maximum call stack size exceeded',
      '    at AtlasManager.reload (atlas.js:412:22)',
      '    at ResourceLoader.onProgress (loader.js:288:14)',
      '    at XHR.onload (xhr.js:64:7)',
    ],
  },
  {
    signature: 'AbortError: The play() request was interrupted',
    type: 'AbortError',
    message: 'The play() request was interrupted by a call to pause()',
    stack: [
      'AbortError: The play() request was interrupted by a call to pause()',
      '    at HTMLAudioElement.play (audio.js:318:9)',
      '    at AudioManager.resume (audio.js:142:12)',
    ],
  },
  {
    signature: 'WebGL: INVALID_OPERATION: drawElements: no valid shader program',
    type: 'WebGLError',
    message: 'INVALID_OPERATION: drawElements: no valid shader program in use',
    stack: [
      'WebGL: INVALID_OPERATION: drawElements: no valid shader program in use',
      '    at ShaderProgram.bind (webgl.js:846:11)',
      '    at Renderer.flush (renderer.js:1204:9)',
    ],
  },
  {
    signature: 'TypeError: Cannot read properties of null (reading "getContext")',
    type: 'TypeError',
    message: "Cannot read properties of null (reading 'getContext')",
    stack: [
      "TypeError: Cannot read properties of null (reading 'getContext')",
      '    at Canvas2DRenderer.init (canvas.js:88:24)',
      '    at Game.start (game.js:156:18)',
    ],
  },
  {
    signature: 'NetworkError: Failed to fetch chunk 3 (404)',
    type: 'NetworkError',
    message: 'Failed to fetch chunk asset-3 (404)',
    stack: [
      'NetworkError: Failed to fetch chunk asset-3 (404)',
      '    at SubpackageLoader.load (subpackage.js:212:15)',
      '    at SceneLoader.preload (scene.js:340:11)',
    ],
  },
];

const DEVICE_NAMES = [
  'Redmi Note 12',
  'iPhone 12',
  'OPPO Reno 11',
  '华为 nova 11',
  '小米 14',
  'vivo X100',
  'iPhone SE (3rd)',
];

export const crashGroups: CrashGroup[] = [];

for (let i = 0; i < 60; i += 1) {
  const tpl = CRASH_TEMPLATES[i % CRASH_TEMPLATES.length] as (typeof CRASH_TEMPLATES)[number];
  const project = projects[i % projects.length] as (typeof projects)[number];
  const channel = project.platforms[i % project.platforms.length] ?? 'h5';
  const count = rng.int(12, 2400);
  const isNew = i < 8;

  const chosen = rng.picks(DEVICE_NAMES, 3);
  const r1 = rng.int(30, 60);
  const r2 = rng.int(15, 100 - r1 - 5);

  crashGroups.push({
    id: `CR-${String(200 + i)}`,
    signature: tpl.signature,
    type: tpl.type,
    message: tpl.message,
    count,
    users: Math.round(count * rng.float(0.4, 0.78, 2)),
    firstSeen: daysAgo(isNew ? rng.int(0, 2) : rng.int(5, 60), rng.int(9, 20), rng.int(0, 59)),
    lastSeen: daysAgo(rng.int(0, 2), rng.int(9, 21), rng.int(0, 59)),
    version: project.currentVersion,
    projectId: project.id,
    channel,
    status: rng.pick(['open', 'open', 'fixing', 'fixed', 'ignored']),
    isNew,
    stack: tpl.stack,
    devices: [
      { name: chosen[0] as string, ratio: r1 },
      { name: chosen[1] as string, ratio: r2 },
      { name: chosen[2] as string, ratio: 100 - r1 - r2 },
    ],
  });
}

/* ---------------- 兼容性矩阵 ---------------- */
export interface CompatDevice {
  id: string;
  name: string;
  os: string;
  resolution: string;
  chip: string;
  tier: 'high' | 'mid' | 'low';
  share: number;
}

export const compatDevices: CompatDevice[] = [
  { id: 'D01', name: 'iPhone 15 Pro', os: 'iOS 18.1', resolution: '1179×2556', chip: 'A17 Pro', tier: 'high', share: 6.2 },
  { id: 'D02', name: 'iPhone 14', os: 'iOS 17.6', resolution: '1170×2532', chip: 'A16', tier: 'high', share: 8.4 },
  { id: 'D03', name: 'iPhone 12', os: 'iOS 16.7', resolution: '1170×2532', chip: 'A14', tier: 'mid', share: 11.3 },
  { id: 'D04', name: 'iPhone SE (3rd)', os: 'iOS 17.5', resolution: '750×1334', chip: 'A15', tier: 'mid', share: 3.1 },
  { id: 'D05', name: 'iPad Air (5th)', os: 'iPadOS 17.4', resolution: '1640×2360', chip: 'M1', tier: 'high', share: 2.7 },
  { id: 'D06', name: '小米 14', os: 'Android 14', resolution: '1200×2670', chip: '骁龙 8 Gen3', tier: 'high', share: 5.8 },
  { id: 'D07', name: 'Redmi Note 12', os: 'Android 13', resolution: '1080×2400', chip: '骁龙 685', tier: 'low', share: 9.6 },
  { id: 'D08', name: 'Redmi K70', os: 'Android 14', resolution: '1220×2712', chip: '天玑 8300', tier: 'mid', share: 4.2 },
  { id: 'D09', name: '华为 Mate 60 Pro', os: 'HarmonyOS 4.2', resolution: '1260×2720', chip: '麒麟 9000s', tier: 'high', share: 7.1 },
  { id: 'D10', name: '华为 nova 11', os: 'HarmonyOS 4.0', resolution: '1084×2412', chip: '骁龙 778G', tier: 'mid', share: 5.3 },
  { id: 'D11', name: 'OPPO Reno 11', os: 'ColorOS 14', resolution: '1080×2412', chip: '天玑 8200', tier: 'mid', share: 6.7 },
  { id: 'D12', name: 'vivo X100', os: 'OriginOS 4', resolution: '1260×2800', chip: '天玑 9300', tier: 'high', share: 5.1 },
  { id: 'D13', name: '荣耀 90', os: 'MagicOS 7.2', resolution: '1200×2664', chip: '骁龙 7 Gen3', tier: 'mid', share: 4.8 },
  { id: 'D14', name: '三星 Galaxy S23', os: 'Android 14', resolution: '1080×2340', chip: '骁龙 8 Gen2', tier: 'high', share: 2.2 },
];

export const compatCases = [
  { key: 'launch', label: '启动加载' },
  { key: 'render', label: '渲染' },
  { key: 'audio', label: '音频' },
  { key: 'touch', label: '触控' },
  { key: 'pay', label: '支付' },
  { key: 'share', label: '分享' },
  { key: 'weaknet', label: '弱网' },
  { key: 'background', label: '后台切换' },
];

export interface CompatCell {
  deviceId: string;
  caseKey: string;
  status: 'pass' | 'partial' | 'fail' | 'untested';
  note?: string;
  bugId?: string;
}

export const compatMatrix: CompatCell[] = (() => {
  const cells: CompatCell[] = [];
  compatDevices.forEach((device) => {
    compatCases.forEach((c) => {
      const r = rng.next();
      let status: CompatCell['status'] = 'pass';
      if (r > 0.965) status = 'fail';
      else if (r > 0.9) status = 'partial';
      else if (r > 0.88) status = 'untested';

      cells.push({
        deviceId: device.id,
        caseKey: c.key,
        status,
        note:
          status === 'fail'
            ? rng.pick([
                '首次加载黑屏 3 秒以上',
                '音频无法播放，需用户手势触发',
                '支付回调未触发',
                '弱网下资源加载超时无重试',
              ])
            : undefined,
        bugId: status === 'fail' ? `BUG-2026-${String(rng.int(1, 480)).padStart(4, '0')}` : undefined,
      });
    });
  });
  return cells;
})();

/* ---------------- 知识库 ---------------- */
export interface KnowledgeNode {
  key: string;
  title: string;
  children?: KnowledgeNode[];
  content?: string;
}

export const knowledgeTree: KnowledgeNode[] = [
  {
    key: 'integration',
    title: '接入指南',
    children: [
      { key: 'quickstart', title: '5 分钟快速接入', content: 'quickstart' },
      { key: 'auth', title: '登录与账号打通', content: 'auth' },
      { key: 'pay', title: '支付接入与回调', content: 'pay' },
      { key: 'track', title: '埋点与数据上报', content: 'track' },
    ],
  },
  {
    key: 'channel',
    title: '渠道规范',
    children: [
      { key: 'wechat', title: '微信小游戏审核要点', content: 'wechat' },
      { key: 'douyin', title: '抖音小游戏合规清单', content: 'douyin' },
      { key: 'overseas', title: '海外平台注意事项', content: 'overseas' },
    ],
  },
  {
    key: 'faq',
    title: '常见问题',
    children: [
      { key: 'subpackage', title: '分包加载失败排查', content: 'subpackage' },
      { key: 'audio', title: '音频不播放的 6 种原因', content: 'audio' },
      { key: 'size', title: '包体超限的优化手段', content: 'size' },
    ],
  },
  {
    key: 'perf',
    title: '性能优化',
    children: [
      { key: 'firstscreen', title: '首屏加载优化实践', content: 'firstscreen' },
      { key: 'atlas', title: '图集与 DrawCall', content: 'atlas' },
    ],
  },
];
