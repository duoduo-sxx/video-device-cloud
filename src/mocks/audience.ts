/**
 * 人群洞察：以「单个广告（计划）」为单位建模。
 *
 * 设计要点：
 * 1. 每个广告在每个维度上都有独立的人群分布（维度内合计 1000‰）；
 * 2. 大盘人群 = Σ 各广告人群（逐标签累加），不是另算一套；
 * 3. 每个广告额外有一份「投放后台设置的定向条件」（scope），
 *    实际触达 vs 定向设定 的差距即命中率，跑偏的广告自动生成结论。
 *
 * 因此页面上「这个广告投给了谁 → 有没有投偏 → 该怎么改」是从数据算出来的，
 * 不是写死的文案。
 */
import type {
  AudienceDim,
  AudienceSegment,
  LookalikePack,
  PlanAudience,
  PlanTargeting,
  TargetProfile,
  TargetingHit,
} from '@/types';
import { DIM_LABEL } from '@/types';
import { totalMetrics, CURRENT_PERIOD } from './daily';
import { AD_PLANS, PLAN_MAP } from './campaigns';
import { allocateInt, allocateMoney, cpa, roi, r2 } from '@/lib/metrics';
import { hash, rnd } from './seed';

/* ============================================================
 * 一、基准分布（行业大盘，同时也作为 TGI 的分母）
 * conv / spend / bench 均为千分比，同维度合计 1000
 * ============================================================ */
interface SegDef {
  label: string;
  conv: number;
  spend: number;
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

export const DIMS: AudienceDim[] = ['age', 'interest', 'city', 'gender', 'device', 'hour'];

const TOTAL = totalMetrics(CURRENT_PERIOD);

const labelsOf = (dim: AudienceDim) => DEFS[dim].map((d) => d.label);
const baseOf = (dim: AudienceDim) => DEFS[dim].map((d) => d.conv / 1000);

/* ============================================================
 * 二、每个广告的人群倾向（persona）
 * 对应真实投放里的「这条广告实际吸引了谁」——由素材、出价、版位共同决定
 * ============================================================ */
interface Persona {
  /** 年龄峰值，0=18-24 1=25-34 2=35-44 3=45-54 4=55+ */
  agePeak: number;
  ageSpread?: number;
  /** 活跃时段峰值，0=00-08 … 5=20-23 6=23-24 */
  hourPeak: number;
  hourSpread?: number;
  city?: string[];
  interest?: string[];
  device?: string;
  gender?: string;
}

const PERSONAS: Record<string, Persona> = {
  'P-1011': { agePeak: 1, city: ['一线城市', '新一线城市'], interest: ['户外露营', '徒步登山'], device: 'iOS 设备', hourPeak: 5, gender: '男性' },
  'P-1012': { agePeak: 1, city: ['新一线城市', '二线城市'], interest: ['运动户外', '户外露营'], device: 'Android 设备', hourPeak: 4, gender: '男性' },
  'P-1013': { agePeak: 1, city: ['一线城市'], interest: ['户外露营', '徒步登山'], device: 'iOS 设备', hourPeak: 5, gender: '女性' },
  'P-1021': { agePeak: 2, city: ['新一线城市'], interest: ['徒步登山', '运动户外'], device: 'Android 设备', hourPeak: 1, gender: '男性' },
  'P-1022': { agePeak: 1, city: ['一线城市', '新一线城市'], interest: ['户外露营', '亲子家庭'], device: 'iOS 设备', hourPeak: 5, gender: '女性' },
  'P-1023': { agePeak: 2, city: ['一线城市'], interest: ['户外露营', '徒步登山'], device: 'iOS 设备', hourPeak: 2, gender: '女性' },
  'P-1031': { agePeak: 0, city: ['二线城市', '三线及以下'], interest: ['服饰穿搭', '运动户外'], device: 'Android 设备', hourPeak: 5, gender: '女性' },
  'P-1032': { agePeak: 0, city: ['二线城市'], interest: ['服饰穿搭', '户外露营'], device: 'Android 设备', hourPeak: 5, gender: '女性' },
  'P-2011': { agePeak: 1, city: ['一线城市'], interest: ['服饰穿搭', '运动户外'], device: 'iOS 设备', hourPeak: 2, gender: '女性' },
  'P-2012': { agePeak: 1, city: ['一线城市', '新一线城市'], interest: ['户外露营'], device: 'iOS 设备', hourPeak: 5, gender: '女性' },
  'P-2021': { agePeak: 2, city: ['三线及以下'], interest: ['其他兴趣', '亲子家庭'], device: 'Android 设备', hourPeak: 4, gender: '女性' },
  'P-3011': { agePeak: 1, city: ['二线城市', '三线及以下'], interest: ['运动户外', '服饰穿搭'], device: 'Android 设备', hourPeak: 5, gender: '男性' },
  'P-3012': { agePeak: 1, city: ['三线及以下'], interest: ['户外露营', '亲子家庭'], device: 'Android 设备', hourPeak: 2, gender: '女性' },
  'P-3021': { agePeak: 0, city: ['二线城市'], interest: ['服饰穿搭'], device: 'Android 设备', hourPeak: 5, gender: '女性' },
  'P-4011': { agePeak: 2, city: ['二线城市'], interest: ['运动户外', '户外露营'], device: 'Android 设备', hourPeak: 1, gender: '男性' },
  'P-4012': { agePeak: 1, city: ['新一线城市'], interest: ['户外露营', '徒步登山'], device: 'iOS 设备', hourPeak: 3, gender: '男性' },
  'P-4021': { agePeak: 1, city: ['一线城市', '新一线城市'], interest: ['户外露营', '徒步登山'], device: 'iOS 设备', hourPeak: 5, gender: '男性' },
  'P-5011': { agePeak: 0, city: ['一线城市', '新一线城市'], interest: ['服饰穿搭', '户外露营'], device: 'iOS 设备', hourPeak: 5, gender: '女性' },
  'P-5012': { agePeak: 1, city: ['一线城市'], interest: ['户外露营'], device: 'iOS 设备', hourPeak: 5, gender: '女性' },
  'P-5021': { agePeak: 0, city: ['一线城市', '新一线城市'], interest: ['服饰穿搭', '户外露营'], device: 'iOS 设备', hourPeak: 5, gender: '女性' },
  'P-6011': { agePeak: 1, city: ['一线城市', '新一线城市'], interest: ['徒步登山', '户外露营'], device: 'Android 设备', hourPeak: 4, gender: '男性' },
};

/* ============================================================
 * 三、分布生成：基准分布 × 人群倾向，再归一化到 1000‰
 * ============================================================ */
const gaussAt = (i: number, peak: number, spread: number) =>
  Math.exp(-((i - peak) ** 2) / (2 * spread * spread));

/** 把一组相对权重转成合计正好 1000 的千分比整数 */
function toPermille(weights: number[]): number[] {
  return allocateInt(1000, weights);
}

function mixCurve(dim: 'age' | 'hour', peak: number, spread: number, strength: number): number[] {
  const base = baseOf(dim);
  const g = DEFS[dim].map((_, i) => gaussAt(i, peak, spread));
  const gsum = g.reduce((a, b) => a + b, 0);
  return DEFS[dim].map((_, i) => strength * (g[i] / gsum) + (1 - strength) * base[i]);
}

function mixTags(dim: AudienceDim, tags: string[], strength: number, inW = 1.65, outW = 0.55): number[] {
  const base = baseOf(dim);
  const w = DEFS[dim].map((d) => (tags.includes(d.label) ? inW : outW));
  const wsum = w.reduce((a, b) => a + b, 0);
  return DEFS[dim].map((_, i) => strength * (w[i] / wsum) + (1 - strength) * base[i]);
}

/** 单个广告在某维度上的千分比分布（合计 1000） */
function permilleOf(planId: string, dim: AudienceDim): number[] {
  const p = PERSONAS[planId];
  if (!p) return toPermille(baseOf(dim));

  let raw: number[];
  switch (dim) {
    case 'age':
      raw = mixCurve('age', p.agePeak, p.ageSpread ?? 1.05, 0.38);
      break;
    case 'hour':
      raw = mixCurve('hour', p.hourPeak, p.hourSpread ?? 0.85, 0.35);
      break;
    case 'city':
      raw = mixTags('city', p.city ?? [], 0.5);
      break;
    case 'interest':
      raw = mixTags('interest', p.interest ?? [], 0.5);
      break;
    case 'device':
      raw = mixTags('device', p.device ? [p.device] : [], 0.4, 1.5, 0.7);
      break;
    default:
      raw = mixTags('gender', p.gender ? [p.gender] : [], 0.3, 1.35, 0.8);
      break;
  }

  // ±6% 确定性抖动：避免每个广告的比例过于工整
  const jittered = raw.map((w, i) => w * (0.94 + rnd(hash(`${planId}|${dim}|${i}`)) * 0.12));
  return toPermille(jittered);
}

/* ============================================================
 * 四、构建每个广告的人群画像
 * 转化数 / 消耗 / GMV 均按分布拆分，保证维度内合计 = 该广告总量
 * ============================================================ */
function buildPlanAudience(planId: string): PlanAudience {
  const plan = PLAN_MAP[planId];
  const spend = plan?.m.spend ?? 0;
  const gmv = plan?.m.gmv ?? 0;
  const conv = plan?.m.conversions ?? 0;
  const out = {} as PlanAudience;

  for (const dim of DIMS) {
    const perm = permilleOf(planId, dim);
    const convParts = allocateInt(conv, perm);
    const spendParts = allocateMoney(spend, perm);
    const gmvParts = allocateMoney(gmv, perm);

    out[dim] = DEFS[dim].map((d, i) => {
      const c = convParts[i];
      const s = spendParts[i];
      const g = gmvParts[i];
      const convShare = conv ? c / conv : 0;
      return {
        dim,
        label: d.label,
        convShare,
        spendShare: spend ? s / spend : 0,
        benchmarkShare: d.bench / 1000,
        conversions: c,
        spend: r2(s),
        gmv: r2(g),
        cpa: r2(cpa({ conversions: c, spend: s, impressions: 0, clicks: 0, paidOrders: 0, gmv: g, reach: 0 })),
        roi: r2(roi({ conversions: c, spend: s, impressions: 0, clicks: 0, paidOrders: 0, gmv: g, reach: 0 })),
        tgi: Math.round((convShare / (d.bench / 1000)) * 100),
      };
    });
  }
  return out;
}

export const PLAN_AUDIENCE: Record<string, PlanAudience> = AD_PLANS.reduce(
  (acc, p) => ({ ...acc, [p.id]: buildPlanAudience(p.id) }),
  {} as Record<string, PlanAudience>,
);

export function audienceOf(planId: string): PlanAudience {
  return PLAN_AUDIENCE[planId] ?? PLAN_AUDIENCE[AD_PLANS[0].id];
}

/* ============================================================
 * 五、大盘人群 = Σ 各广告（逐标签累加，保证与总转化严格一致）
 * ============================================================ */
function aggregate(dim: AudienceDim): AudienceSegment[] {
  const acc = DEFS[dim].map(() => ({ conversions: 0, spend: 0, gmv: 0 }));
  for (const plan of AD_PLANS) {
    const segs = PLAN_AUDIENCE[plan.id][dim];
    segs.forEach((s, i) => {
      acc[i].conversions += s.conversions;
      acc[i].spend += s.spend;
      acc[i].gmv += s.gmv;
    });
  }
  return DEFS[dim].map((d, i) => {
    const { conversions: c, spend: s, gmv: g } = acc[i];
    const convShare = TOTAL.conversions ? c / TOTAL.conversions : 0;
    return {
      dim,
      label: d.label,
      convShare,
      spendShare: TOTAL.spend ? s / TOTAL.spend : 0,
      benchmarkShare: d.bench / 1000,
      conversions: c,
      spend: r2(s),
      gmv: r2(g),
      cpa: r2(cpa({ conversions: c, spend: s, impressions: 0, clicks: 0, paidOrders: 0, gmv: g, reach: 0 })),
      roi: r2(roi({ conversions: c, spend: s, impressions: 0, clicks: 0, paidOrders: 0, gmv: g, reach: 0 })),
      tgi: Math.round((convShare / (d.bench / 1000)) * 100),
    };
  });
}

export const AUDIENCE: Record<AudienceDim, AudienceSegment[]> = {
  gender: aggregate('gender'),
  age: aggregate('age'),
  city: aggregate('city'),
  interest: aggregate('interest'),
  device: aggregate('device'),
  hour: aggregate('hour'),
};

export function segmentsOf(dim: AudienceDim): AudienceSegment[] {
  return AUDIENCE[dim];
}

export function topByTgi(dim: AudienceDim, n = 3): AudienceSegment[] {
  return [...AUDIENCE[dim]].sort((a, b) => b.tgi - a.tgi).slice(0, n);
}

/** 某个广告在指定维度上按 TGI 排序 */
export function topByTgiOf(planId: string, dim: AudienceDim, n = 3): AudienceSegment[] {
  return [...audienceOf(planId)[dim]].sort((a, b) => b.tgi - a.tgi).slice(0, n);
}

/** 某个广告在指定维度上按转化占比排序（谁是主力） */
export function topByShareOf(planId: string, dim: AudienceDim, n = 3): AudienceSegment[] {
  return [...audienceOf(planId)[dim]].sort((a, b) => b.convShare - a.convShare).slice(0, n);
}

/* ============================================================
 * 六、投放后台真实的定向设置
 * 缺省维度视为「不限」，settingText 由 scope 自动生成，避免文案与数据打架
 * ============================================================ */
interface TargetingDef {
  planId: string;
  age?: string[];
  gender?: string[];
  city?: string[];
  interest?: string[];
  device?: string[];
  hour?: string[];
}

const TARGETING_DEFS: TargetingDef[] = [
  { planId: 'P-1011', age: ['25-34 岁', '35-44 岁'], city: ['一线城市', '新一线城市', '二线城市'], interest: ['户外露营', '徒步登山', '运动户外'], hour: ['18:00-20:00', '20:00-23:00', '23:00-24:00'] },
  { planId: 'P-1012', age: ['25-34 岁', '35-44 岁'], interest: ['户外露营', '徒步登山', '运动户外'] },
  { planId: 'P-1013', age: ['25-34 岁', '35-44 岁'], city: ['一线城市', '新一线城市'], interest: ['户外露营', '徒步登山', '运动户外'] },
  { planId: 'P-1021', age: ['25-34 岁', '35-44 岁'], interest: ['徒步登山', '户外露营', '运动户外'] },
  { planId: 'P-1022', age: ['18-24 岁', '25-34 岁', '35-44 岁'], interest: ['户外露营', '徒步登山', '亲子家庭'] },
  { planId: 'P-1023', age: ['25-34 岁', '35-44 岁', '45-54 岁'], city: ['一线城市', '新一线城市'] },
  // 直播间福利款：定向写的是 25-44 岁 + 一二线，实际被 18-24 岁 + 下沉市场拉走
  { planId: 'P-1031', age: ['25-34 岁', '35-44 岁'], city: ['一线城市', '新一线城市'] },
  { planId: 'P-1032', age: ['18-24 岁', '25-34 岁'], city: ['一线城市', '新一线城市', '二线城市'] },
  { planId: 'P-2011', age: ['25-34 岁', '35-44 岁'], city: ['一线城市', '新一线城市'] },
  { planId: 'P-2012', age: ['25-34 岁', '35-44 岁'], interest: ['户外露营', '徒步登山', '运动户外'], device: ['iOS 设备'] },
  // 优量汇：只圈了一二三线，实际三线以下占比最高
  { planId: 'P-2021', city: ['一线城市', '新一线城市', '二线城市'], interest: ['户外露营', '徒步登山', '运动户外'] },
  { planId: 'P-3011', age: ['18-24 岁', '25-34 岁', '35-44 岁'], city: ['二线城市', '三线及以下'], hour: ['18:00-20:00', '20:00-23:00'] },
  // 快手帐篷：只圈了户外兴趣，实际被亲子家庭带走
  { planId: 'P-3012', interest: ['户外露营', '徒步登山', '运动户外'] },
  { planId: 'P-3021', age: ['18-24 岁', '25-34 岁'], interest: ['服饰穿搭', '运动户外', '户外露营'] },
  { planId: 'P-4011', age: ['35-44 岁', '45-54 岁'], city: ['二线城市', '三线及以下'] },
  { planId: 'P-4012', age: ['25-34 岁', '35-44 岁'], interest: ['户外露营', '徒步登山', '运动户外'] },
  { planId: 'P-4021', age: ['25-34 岁', '35-44 岁'], city: ['一线城市', '新一线城市'], interest: ['户外露营', '徒步登山'] },
  // 聚光种草：定向 25-44 岁户外，实际服饰穿搭 + 18-24 岁占了三成
  { planId: 'P-5011', age: ['25-34 岁', '35-44 岁'], interest: ['户外露营', '徒步登山', '运动户外'], device: ['iOS 设备'], hour: ['18:00-20:00', '20:00-23:00'] },
  { planId: 'P-5012', age: ['25-34 岁', '35-44 岁'], city: ['一线城市', '新一线城市'] },
  { planId: 'P-5021', age: ['18-24 岁', '25-34 岁'], interest: ['户外露营', '徒步登山', '运动户外'] },
  // B 站 UP 主：定向 18-24 岁，但 B 站户外区用户已经 25-34 为主
  { planId: 'P-6011', age: ['18-24 岁'], interest: ['徒步登山', '户外露营', '运动户外'] },
];

export const TARGETING: Record<string, PlanTargeting> = AD_PLANS.reduce((acc, plan) => {
  const def = TARGETING_DEFS.find((d) => d.planId === plan.id);
  const all = (dim: AudienceDim) => labelsOf(dim);
  acc[plan.id] = {
    planId: plan.id,
    scope: {
      gender: def?.gender ?? all('gender'),
      age: def?.age ?? all('age'),
      city: def?.city ?? all('city'),
      interest: def?.interest ?? all('interest'),
      device: def?.device ?? all('device'),
      hour: def?.hour ?? all('hour'),
    },
  };
  return acc;
}, {} as Record<string, PlanTargeting>);

/** 定向设定的可读文案 */
export function settingText(planId: string, dim: AudienceDim): string {
  const scope = TARGETING[planId].scope[dim];
  const all = labelsOf(dim);
  if (scope.length === 0 || scope.length === all.length) return '不限';
  if (scope.length <= 2) return scope.join('、');
  return `${scope.slice(0, 2).join('、')} 等 ${scope.length} 项`;
}

/* ============================================================
 * 七、定向命中率：设定的圈 vs 实际跑出来的人
 * ============================================================ */
export function targetingHits(planId: string): TargetingHit[] {
  const segs = audienceOf(planId);
  const total = PLAN_MAP[planId]?.m.conversions ?? 0;

  return DIMS.map((dim) => {
    const scope = TARGETING[planId].scope[dim];
    const list = segs[dim];
    const isOpen = scope.length === 0 || scope.length === list.length;
    const inScope = list.filter((s) => scope.includes(s.label));
    const outScope = list.filter((s) => !scope.includes(s.label));

    const hitConv = inScope.reduce((s, x) => s + x.conversions, 0);
    const hitRate = total ? hitConv / total : 0;

    // 自然基准：这些标签如果完全不定向，本该占多少
    const benchInScope = inScope.reduce((s, x) => s + x.benchmarkShare, 0);
    const lift = benchInScope > 0 ? hitRate / benchInScope : 1;

    const top = [...list].sort((a, b) => b.conversions - a.conversions)[0];
    const spill = [...outScope].sort((a, b) => b.conversions - a.conversions)[0];
    const spillShareOfLabel = spill ? spill.convShare : 0;

    // 判定看「比自然分布浓多少倍」，不看绝对占比：
    // 收窄到 2 个年龄段时，命中 70% 已经是 1.15 倍浓度，属于正常水平
    const verdict: TargetingHit['verdict'] = isOpen
      ? 'ok'
      : lift >= 1.12
        ? 'ok'
        : lift >= 1.0
          ? 'spill'
          : 'drift';

    const note = isOpen
      ? `${DIM_LABEL[dim]}未做定向收窄（全量投放），实际结构与大盘一致`
      : verdict === 'ok'
        ? `定向有效：圈内浓度是自然分布的 ${lift.toFixed(2)} 倍，Top1「${top.label}」落在圈内`
        : `圈外「${spill?.label ?? '—'}」占 ${(spillShareOfLabel * 100).toFixed(1)}%（TGI ${spill?.tgi ?? 0}），` +
          `圈内浓度只有自然分布的 ${lift.toFixed(2)} 倍，${DIM_LABEL[dim]}定向已失效`;

    return {
      dim,
      settingText: settingText(planId, dim),
      open: isOpen,
      lift: r2(lift),
      hitRate,
      spillShare: 1 - hitRate,
      actualTop: top.label,
      actualTopShare: top.convShare,
      spillLabel: spill?.label ?? '—',
      spillShareOfLabel,
      spillTgi: spill?.tgi ?? 0,
      verdict,
      note,
    };
  });
}

/**
 * 收窄维度（做过定向的维度）的平均命中率才是有效指标；
 * 全量投放的维度命中率恒为 100%，不参与统计。
 */
export function targetingSummary(planId: string): {
  hitRate: number;
  narrowed: number;
  /** 明显跑偏：圈内浓度低于自然分布，定向等于没起作用 */
  driftDims: TargetingHit[];
  /** 轻度溢出：定向有效但不彻底，仍有预算花在圈外 */
  spillDims: TargetingHit[];
  worst?: TargetingHit;
} {
  const hits = targetingHits(planId);
  const narrowed = hits.filter((h) => !h.open);
  const hitRate = narrowed.length ? narrowed.reduce((s, h) => s + h.hitRate, 0) / narrowed.length : 1;
  const driftDims = narrowed.filter((h) => h.verdict === 'drift').sort((a, b) => a.lift - b.lift);
  const spillDims = narrowed.filter((h) => h.verdict === 'spill').sort((a, b) => a.lift - b.lift);
  return { hitRate, narrowed: narrowed.length, driftDims, spillDims, worst: driftDims[0] ?? spillDims[0] };
}

/* ============================================================
 * 八、单个广告的目标人群结论（全部由数据生成）
 * ============================================================ */
export function profileOf(planId: string): TargetProfile {
  const plan = PLAN_MAP[planId];
  const segs = audienceOf(planId);
  const pick = (dim: AudienceDim) => [...segs[dim]].sort((a, b) => b.convShare - a.convShare)[0];

  const age = pick('age');
  const city = pick('city');
  const interest = pick('interest');
  const device = pick('device');
  const hour = pick('hour');
  const gender = pick('gender');
  const { worst } = targetingSummary(planId);

  const cvrLift = (age.tgi + interest.tgi) / 200;

  const summary =
    `模型在该广告本月 ${plan.m.conversions.toLocaleString('zh-CN')} 次转化上提取特征：` +
    `${age.label}贡献 ${(age.convShare * 100).toFixed(1)}%（大盘 ${(age.benchmarkShare * 100).toFixed(1)}%，TGI ${age.tgi}），` +
    `${city.label}占 ${(city.convShare * 100).toFixed(1)}%；` +
    `兴趣高度集中在「${interest.label}」（${(interest.convShare * 100).toFixed(1)}%，TGI ${interest.tgi}）。` +
    `设备以 ${device.label} 为主（${(device.convShare * 100).toFixed(1)}%），` +
    `${hour.label} 是转化高峰（${(hour.convShare * 100).toFixed(1)}%）。` +
    (worst
      ? `但${DIM_LABEL[worst.dim]}维度跑偏：设定「${worst.settingText}」，实际「${worst.spillLabel}」占 ` +
        `${(worst.spillShareOfLabel * 100).toFixed(1)}%（TGI ${worst.spillTgi}），定向命中率只有 ${(worst.hitRate * 100).toFixed(1)}%。`
      : `六个维度的定向命中率均在 90% 以上，人群结构与设定一致，可以在当前画像上小步扩量。`);

  return {
    planId,
    title: `${age.label} · ${city.label} · ${interest.label} 核心人群`,
    summary,
    coreTags: [
      `${age.label}（TGI ${age.tgi}）`,
      `${city.label}`,
      `${interest.label}（TGI ${interest.tgi}）`,
      `${gender.label}`,
      `${device.label}`,
      `${hour.label} 活跃`,
    ],
    sizeEstimate: Math.round((plan.m.reach || plan.m.impressions * 0.32) * 3.6),
    roi: r2(roi(plan.m)),
    cpa: r2(cpa(plan.m)),
    cvrLift: r2(cvrLift),
  };
}

/** 模型置信度：样本越大越高，落在 62%-95% */
export function confidenceOf(planId: string): number {
  const conv = PLAN_MAP[planId]?.m.conversions ?? 0;
  return Math.min(95, Math.round(62 + Math.log10(conv + 1) * 11));
}

/* ============================================================
 * 九、人群包：与具体广告绑定
 * ============================================================ */
export const LOOKALIKE_PACKS: LookalikePack[] = [
  {
    id: 'LK-01',
    name: '户外核心人群-lookalike v3',
    seed: '近 30 天下单用户 4.2 万（去重）',
    coverage: 18600000,
    similarity: 0.82,
    status: 'used',
    planCount: 5,
    planIds: ['P-1011', 'P-1013', 'P-2012', 'P-4021', 'P-5012'],
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
    planIds: ['P-1021', 'P-1023', 'P-4012'],
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
    planIds: ['P-1022', 'P-3012'],
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
    planIds: [],
    roi: 0,
    createdAt: '2026-10-27T11:18:00',
  },
  {
    id: 'LK-05',
    name: '双 11 高意向加购包',
    seed: '10/20 后加购未支付用户 2.3 万',
    coverage: 4760000,
    similarity: 0.88,
    status: 'building',
    planCount: 0,
    planIds: [],
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
    planIds: ['P-1031', 'P-1032', 'P-2021', 'P-5021'],
    roi: 0,
    createdAt: '2026-10-24T16:33:00',
  },
];

export function packsOf(planId: string): LookalikePack[] {
  return LOOKALIKE_PACKS.filter((p) => p.planIds.includes(planId));
}

/* ============================================================
 * 十、跨广告人群对比矩阵（年龄维度的 TGI 热力）
 * ============================================================ */
export function ageTgiMatrix(topN = 8): {
  plans: { id: string; name: string; platform: string; spend: number; cells: { label: string; tgi: number }[] }[];
  ageLabels: string[];
} {
  const plans = [...AD_PLANS]
    .sort((a, b) => b.m.spend - a.m.spend)
    .slice(0, topN)
    .map((p) => ({
      id: p.id,
      name: p.name,
      platform: p.accountId,
      spend: p.m.spend,
      cells: audienceOf(p.id).age.map((s) => ({ label: s.label, tgi: s.tgi })),
    }));
  return { plans, ageLabels: labelsOf('age') };
}
