import type { AudienceDim, AudienceSegment, LookalikePack, TargetProfile } from '@/types';
import { totalMetrics, CURRENT_PERIOD } from './daily';
import { allocateInt, allocateMoney, cpa, roi, r2 } from '@/lib/metrics';

interface SegDef {
  label: string;
  /** 转化占比（千分比，同维度合计 1000，避免浮点尾差） */
  conv: number;
  /** 消耗占比（千分比，同维度合计 1000） */
  spend: number;
  /** 行业大盘转化占比（千分比，用于 TGI） */
  bench: number;
}

const DEFS: Record<AudienceDim, SegDef[]> = {
  gender: [
    { label: '女性', conv: 520, spend: 500, bench: 460 },
    { label: '男性', conv: 480, spend: 500, bench: 540 },
  ],
  age: [
    { label: '18-24 岁', conv: 140, spend: 158, bench: 180 },
    { label: '25-34 岁', conv: 420, spend: 402, bench: 330 },
    { label: '35-44 岁', conv: 310, spend: 305, bench: 290 },
    { label: '45-54 岁', conv: 100, spend: 102, bench: 140 },
    { label: '55 岁以上', conv: 30, spend: 33, bench: 60 },
  ],
  city: [
    { label: '一线城市', conv: 340, spend: 352, bench: 240 },
    { label: '新一线城市', conv: 300, spend: 296, bench: 260 },
    { label: '二线城市', conv: 210, spend: 208, bench: 240 },
    { label: '三线及以下', conv: 150, spend: 144, bench: 260 },
  ],
  interest: [
    { label: '户外露营', conv: 300, spend: 274, bench: 120 },
    { label: '徒步登山', conv: 240, spend: 216, bench: 100 },
    { label: '运动户外', conv: 180, spend: 186, bench: 160 },
    { label: '服饰穿搭', conv: 130, spend: 158, bench: 220 },
    { label: '亲子家庭', conv: 90, spend: 96, bench: 120 },
    { label: '其他兴趣', conv: 60, spend: 70, bench: 280 },
  ],
  device: [
    { label: 'iOS 设备', conv: 560, spend: 542, bench: 410 },
    { label: 'Android 设备', conv: 440, spend: 458, bench: 590 },
  ],
  hour: [
    { label: '00:00-08:00', conv: 60, spend: 72, bench: 80 },
    { label: '08:00-12:00', conv: 120, spend: 132, bench: 150 },
    { label: '12:00-14:00', conv: 130, spend: 138, bench: 140 },
    { label: '14:00-18:00', conv: 150, spend: 156, bench: 170 },
    { label: '18:00-20:00', conv: 180, spend: 176, bench: 160 },
    { label: '20:00-23:00', conv: 300, spend: 264, bench: 230 },
    { label: '23:00-24:00', conv: 60, spend: 62, bench: 70 },
  ],
};

const TOTAL = totalMetrics(CURRENT_PERIOD);

function buildDim(dim: AudienceDim): AudienceSegment[] {
  const defs = DEFS[dim];
  const convPerm = defs.map((d) => d.conv);
  const spendPerm = defs.map((d) => d.spend);
  const convParts = allocateInt(TOTAL.conversions, convPerm);
  const spendParts = allocateMoney(TOTAL.spend, spendPerm);
  const gmvParts = allocateMoney(TOTAL.gmv, convPerm); // GMV 与转化同分布
  return defs.map((d, i) => {
    const conversions = convParts[i];
    const spend = spendParts[i];
    const gmv = gmvParts[i];
    const convShare = d.conv / 1000;
    return {
      dim,
      label: d.label,
      convShare,
      spendShare: d.spend / 1000,
      benchmarkShare: d.bench / 1000,
      conversions,
      spend: r2(spend),
      gmv: r2(gmv),
      cpa: r2(cpa({ conversions, spend, impressions: 0, clicks: 0, paidOrders: 0, gmv, reach: 0 })),
      roi: r2(roi({ conversions, spend, impressions: 0, clicks: 0, paidOrders: 0, gmv, reach: 0 })),
      tgi: Math.round((convShare / (d.bench / 1000)) * 100),
    };
  });
}

export const AUDIENCE: Record<AudienceDim, AudienceSegment[]> = {
  gender: buildDim('gender'),
  age: buildDim('age'),
  city: buildDim('city'),
  interest: buildDim('interest'),
  device: buildDim('device'),
  hour: buildDim('hour'),
};

export function segmentsOf(dim: AudienceDim): AudienceSegment[] {
  return AUDIENCE[dim];
}

/** 按 TGI 排序，取目标人群特征 */
export function topByTgi(dim: AudienceDim, n = 3): AudienceSegment[] {
  return [...AUDIENCE[dim]].sort((a, b) => b.tgi - a.tgi).slice(0, n);
}

export const TARGET_PROFILE: TargetProfile = {
  title: '25-39 岁 · 一线/新一线 · 户外兴趣核心人群',
  summary:
    '模型在近 30 天 4.2 万次成交上做人群特征提取：该人群以 25-34 岁为核心（转化占比 42.0%，大盘 33.0%，TGI 127），' +
    '城市集中在一线/新一线（合计 64.0%，大盘 50.0%），兴趣标签高度集中在「户外露营 / 徒步登山」（合计 54.0%，大盘仅 22.0%，TGI 超过 230）。' +
    '设备上 iOS 占比 56.0%（TGI 137），说明客单价承受力更强；活跃时段集中在 20:00-23:00（30.0%，TGI 130）。' +
    '综合判断：该广告的真实目标用户不是「泛户外人群」，而是「城市中产 + 周末轻户外」人群，' +
    '「亲子家庭」「服饰穿搭」两类标签转化占比显著低于大盘，属于应当排除或降低出价的人群。',
  coreTags: ['25-34 岁', '一线/新一线', '户外露营', '徒步登山', 'iOS 高价值设备', '20:00-23:00 活跃'],
  sizeEstimate: 18600000,
  roi: 4.21,
  cpa: 178.6,
  cvrLift: 2.3,
};

export const LOOKALIKE_PACKS: LookalikePack[] = [
  {
    id: 'LK-01',
    name: '户外核心人群-lookalike v3',
    seed: '近 30 天下单用户 4.2 万（去重）',
    coverage: 18600000,
    similarity: 0.82,
    status: 'used',
    planCount: 5,
    roi: 4.21,
    createdAt: '2026-10-12T10:24:00',
  },
  {
    id: 'LK-02',
    name: '高客单-徒步鞋兴趣包',
    seed: '购买徒步鞋且客单 > 800 元用户 1.1 万',
    coverage: 6420000,
    similarity: 0.78,
    status: 'used',
    planCount: 3,
    roi: 3.86,
    createdAt: '2026-10-16T15:02:00',
  },
  {
    id: 'LK-03',
    name: '亲子露营家庭包',
    seed: '购买帐篷/天幕且含亲子标签 0.6 万',
    coverage: 3180000,
    similarity: 0.74,
    status: 'used',
    planCount: 2,
    roi: 3.42,
    createdAt: '2026-10-19T09:41:00',
  },
  {
    id: 'LK-04',
    name: '竞品兴趣人群（拓展）',
    seed: '竞品官方旗舰店互动用户 8.7 万',
    coverage: 12400000,
    similarity: 0.61,
    status: 'ready',
    planCount: 0,
    roi: 0,
    createdAt: '2026-10-27T11:18:00',
  },
  {
    id: 'LK-05',
    name: '双11 高意向加购包',
    seed: '10/20 后加购未支付用户 2.3 万',
    coverage: 4760000,
    similarity: 0.88,
    status: 'building',
    planCount: 0,
    roi: 0,
    createdAt: '2026-10-30T20:06:00',
  },
  {
    id: 'LK-06',
    name: '低效人群排除包',
    seed: '曝光 ≥3 次且 30 天未点击 12.4 万',
    coverage: 8920000,
    similarity: 0,
    status: 'ready',
    planCount: 4,
    roi: 0,
    createdAt: '2026-10-24T16:33:00',
  },
];
