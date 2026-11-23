import type { AdAccount, Platform, PlatformCode } from '@/types';
import { QIANCHUAN_RECORDS } from './qianchuan';
import { hash, rnd } from './seed';

/**
 * 演示主体：跨平台投放账户群。
 * 巨量千川为真实账户列表快照（595 个账户），其余 5 个平台保留 mock 用于跨平台对比演示。
 * 源表没有日期字段，演示账期固定为 2026-10 / 环比 2026-09。
 */
export const BRAND = {
  name: '全域效果投放账户群',
  shortName: '全域投放',
  category: '电商全域投放（真实账户 + 演示对照平台）',
  aovRef: 92,
  owner: '增长中心 · 投放分析组',
  period: '2026-10',
  prevPeriod: '2026-09',
  today: '2026-10-31',
};

export const PLATFORMS: Platform[] = [
  {
    code: 'oceanengine',
    name: '巨量千川',
    product: '竞价（全域投放）· 账户列表快照',
    short: '千川',
    color: '#111827',
    caliber: '真实账户快照：595 个账户中 43 个有消耗；表内「整体成交订单数」即转化，「整体成交金额」即 GMV。源表无日期/曝光/点击字段，日粒度为确定性派生',
  },
  {
    code: 'tencent',
    name: '腾讯广告',
    product: '微信朋友圈 / 优量汇',
    short: '腾讯',
    color: '#1D4ED8',
    caliber: '转化口径为「下单」，与巨量「支付」口径差 3.5%，已在 DWD 层对齐',
  },
  {
    code: 'kuaishou',
    name: '磁力引擎',
    product: '快手信息流',
    short: '快手',
    color: '#EA580C',
    caliber: '曝光按「有效曝光」计，比原始曝光低 0.8%',
  },
  {
    code: 'baidu',
    name: '百度营销',
    product: '百度信息流 / 搜索',
    short: '百度',
    color: '#2563EB',
    caliber: '搜索广告无曝光概念，以展现计，CTR 分母为展现',
  },
  {
    code: 'xiaohongshu',
    name: '小红书聚光',
    product: '蒲公英 / 信息流',
    short: '小红书',
    color: '#DB2777',
    caliber: '转化含「站内成交+引流天猫」，已按归因窗口 7 日合并',
  },
  {
    code: 'bilibili',
    name: 'B站商业化',
    product: 'UP 主商单 / 悬赏',
    short: 'B站',
    color: '#0891B2',
    caliber: '仅支持 CPM 计费，转化数据依赖第三方回传，延迟约 6 小时',
  },
];

export const PLATFORM_MAP: Record<PlatformCode, Platform> = PLATFORMS.reduce(
  (acc, p) => ({ ...acc, [p.code]: p }),
  {} as Record<PlatformCode, Platform>,
);

/**
 * 5 个对照平台的 12 个演示账户（原示例账户已改挂到非千川平台）。
 * base 参数只用于生成日粒度基础量，页面上所有比率均由基础量实时算出。
 */
const MOCK_ACCOUNTS: AdAccount[] = [
  {
    id: 'ACC-101',
    platform: 'tencent',
    name: '对照·品牌主账户 A',
    advertiserId: 'demo-101',
    objective: '成交',
    status: 'active',
    balance: 186420.5,
    dailyBudget: 16000,
    lastSyncAt: '2026-10-31T08:12:40',
    owner: '陈默',
    base: { daily: 58000, cpm: 31.6, ctr: 0.0312, cvr: 0.0049, aov: 768 },
  },
  {
    id: 'ACC-102',
    platform: 'kuaishou',
    name: '对照·效果账户 B（素材疲劳演示）',
    advertiserId: 'demo-102',
    objective: '成交',
    status: 'active',
    balance: 92310.2,
    dailyBudget: 12000,
    lastSyncAt: '2026-10-31T08:12:41',
    owner: '周雨',
    base: { daily: 52000, cpm: 29.4, ctr: 0.0348, cvr: 0.0056, aov: 742 },
  },
  {
    id: 'ACC-103',
    platform: 'bilibili',
    name: '对照·直播间账户 C',
    advertiserId: 'demo-103',
    objective: '直播成交',
    status: 'active',
    balance: 42880,
    dailyBudget: 8000,
    lastSyncAt: '2026-10-31T08:12:42',
    owner: '周雨',
    base: { daily: 18000, cpm: 34.2, ctr: 0.0406, cvr: 0.0072, aov: 596 },
  },
  {
    id: 'ACC-201',
    platform: 'tencent',
    name: '栖野·微信朋友圈',
    advertiserId: 'tencent-88201',
    objective: '成交',
    status: 'active',
    balance: 64520.8,
    dailyBudget: 9000,
    lastSyncAt: '2026-10-31T08:15:02',
    owner: '李澈',
    base: { daily: 42000, cpm: 52.4, ctr: 0.0142, cvr: 0.0068, aov: 812 },
  },
  {
    id: 'ACC-202',
    platform: 'tencent',
    name: '栖野·腾讯优量汇',
    advertiserId: 'tencent-88202',
    objective: '加购',
    status: 'balance_low',
    balance: 3210.6,
    dailyBudget: 4500,
    lastSyncAt: '2026-10-31T08:15:03',
    owner: '李澈',
    base: { daily: 16000, cpm: 18.6, ctr: 0.0208, cvr: 0.0031, aov: 688 },
  },
  {
    id: 'ACC-301',
    platform: 'kuaishou',
    name: '栖野·磁力效果',
    advertiserId: 'ks-552107',
    objective: '成交',
    status: 'active',
    balance: 38470.4,
    dailyBudget: 7000,
    lastSyncAt: '2026-10-31T08:18:20',
    owner: '孙岚',
    base: { daily: 38000, cpm: 21.8, ctr: 0.0386, cvr: 0.0038, aov: 634 },
  },
  {
    id: 'ACC-302',
    platform: 'kuaishou',
    name: '栖野·磁力品牌',
    advertiserId: 'ks-552108',
    objective: '种草',
    status: 'paused',
    balance: 15600,
    dailyBudget: 3000,
    lastSyncAt: '2026-10-30T08:19:02',
    owner: '孙岚',
    base: { daily: 9000, cpm: 19.2, ctr: 0.0302, cvr: 0.0026, aov: 612 },
  },
  {
    id: 'ACC-401',
    platform: 'baidu',
    name: '栖野·百度信息流',
    advertiserId: 'bd-771205',
    objective: '成交',
    status: 'active',
    balance: 27380.9,
    dailyBudget: 5500,
    lastSyncAt: '2026-10-31T08:20:11',
    owner: '王倩',
    base: { daily: 28000, cpm: 24.6, ctr: 0.0254, cvr: 0.0052, aov: 706 },
  },
  {
    id: 'ACC-402',
    platform: 'baidu',
    name: '栖野·百度品牌专区',
    advertiserId: 'bd-771206',
    objective: '成交',
    status: 'active',
    balance: 8840.3,
    dailyBudget: 2200,
    lastSyncAt: '2026-10-31T08:20:12',
    owner: '王倩',
    base: { daily: 11000, cpm: 28.2, ctr: 0.0362, cvr: 0.0086, aov: 848 },
  },
  {
    id: 'ACC-501',
    platform: 'xiaohongshu',
    name: '栖野·聚光种草',
    advertiserId: 'xhs-30921',
    objective: '种草',
    status: 'auth_expired',
    balance: 12800.7,
    dailyBudget: 6000,
    lastSyncAt: '2026-10-29T08:22:45',
    owner: '赵一诺',
    base: { daily: 26000, cpm: 62.8, ctr: 0.0448, cvr: 0.0062, aov: 796 },
  },
  {
    id: 'ACC-502',
    platform: 'xiaohongshu',
    name: '栖野·小红书达人',
    advertiserId: 'xhs-30922',
    objective: '种草',
    status: 'active',
    balance: 21650.5,
    dailyBudget: 3500,
    lastSyncAt: '2026-10-31T08:22:46',
    owner: '赵一诺',
    base: { daily: 18000, cpm: 58.4, ctr: 0.0492, cvr: 0.0074, aov: 826 },
  },
  {
    id: 'ACC-601',
    platform: 'bilibili',
    name: '栖野·B站 UP 主',
    advertiserId: 'bili-99013',
    objective: '种草',
    status: 'active',
    balance: 9200.2,
    dailyBudget: 3000,
    lastSyncAt: '2026-10-31T08:25:30',
    owner: '陈默',
    base: { daily: 14000, cpm: 25.4, ctr: 0.0168, cvr: 0.0034, aov: 738 },
  },
];

/**
 * 巨量千川 595 个真实账户：
 * - 表内字段原样落到 balance / spend / paidOrders / gmv 上（daily.ts 按总额拆分日粒度）
 * - 552 个零消耗账户标记为 idle（未投放），与表内「有余额无消耗」一致
 * - base 中的 cpm/ctr/cvr 仅用于派生曝光点击的确定性参数，不参与真实金额计算
 */
const r2 = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

const QIANCHUAN_ACCOUNTS: AdAccount[] = QIANCHUAN_RECORDS.map((r) => {
  const seed = hash(r.id);
  const active = r.spend > 0;
  const group = r.group.replace(/^\[|\]$/g, '').split(',')[0]?.trim() || '千川投放组';
  return {
    id: r.id,
    platform: 'oceanengine',
    name: r.name,
    advertiserId: r.id,
    objective: r.name.includes('直播') || r.name.includes('店播') ? '直播成交' : '成交',
    status: active ? 'active' : 'idle',
    balance: r.balance,
    dailyBudget: active ? Math.ceil(r.spend / 31 / 1000) * 1000 : 0,
    lastSyncAt: '2026-10-31T08:12:00',
    owner: group,
    base: {
      daily: active ? r.spend / 31 : 0,
      cpm: r2(28 + rnd(seed) * 22),
      ctr: r2(0.018 + rnd(seed + 1) * 0.030, 4),
      cvr: r2(0.003 + rnd(seed + 2) * 0.006, 4),
      aov: r.orders ? r2(r.gmv / r.orders) : 90,
    },
  } satisfies AdAccount;
});

/** 全量账户 = 595 个真实千川账户 + 12 个对照平台演示账户 */
export const ACCOUNTS: AdAccount[] = [...QIANCHUAN_ACCOUNTS, ...MOCK_ACCOUNTS];

export const QIANCHUAN_ACCOUNT_IDS = new Set(QIANCHUAN_ACCOUNTS.map((a) => a.id));

export const ACCOUNT_MAP = ACCOUNTS.reduce(
  (acc, a) => ({ ...acc, [a.id]: a }),
  {} as Record<string, AdAccount>,
);

export function accountsOf(platform: PlatformCode): AdAccount[] {
  return ACCOUNTS.filter((a) => a.platform === platform);
}
