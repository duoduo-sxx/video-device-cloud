import type { AdPlan, Creative, Material, MaterialType, PlanStatus } from '@/types';
import { ACCOUNTS } from './platforms';
import { metricsOfAccount, splitAccountMetrics } from './daily';
import { addMetrics, r2 } from '@/lib/metrics';

interface PlanDef {
  id: string;
  accountId: string;
  name: string;
  objective: string;
  bidType: AdPlan['bidType'];
  bid: number;
  dailyBudget: number;
  status: PlanStatus;
  weight: number;
  startDate: string;
}

const PLAN_DEFS: PlanDef[] = [
  // 抖音品牌主账户
  { id: 'P-1011', accountId: 'ACC-101', name: '秋冬冲锋衣·拉新成交', objective: '成交', bidType: 'oCPM', bid: 92, dailyBudget: 7600, status: 'delivering', weight: 0.45, startDate: '2026-09-12' },
  { id: 'P-1012', accountId: 'ACC-101', name: '三合一冲锋衣·爆款追投', objective: '成交', bidType: 'oCPM', bid: 78, dailyBudget: 5200, status: 'delivering', weight: 0.33, startDate: '2026-09-18' },
  { id: 'P-1013', accountId: 'ACC-101', name: '品牌词·人群包承接', objective: '成交', bidType: 'CPC', bid: 1.35, dailyBudget: 3200, status: 'limited', weight: 0.22, startDate: '2026-10-06' },
  // 抖音效果账户（素材疲劳事故账户）
  { id: 'P-1021', accountId: 'ACC-102', name: '徒步鞋·精准成交', objective: '成交', bidType: 'oCPM', bid: 86, dailyBudget: 6200, status: 'delivering', weight: 0.5, startDate: '2026-09-05' },
  { id: 'P-1022', accountId: 'ACC-102', name: '露营装备·加购蓄水', objective: '加购', bidType: 'oCPM', bid: 42, dailyBudget: 3800, status: 'delivering', weight: 0.3, startDate: '2026-09-22' },
  { id: 'P-1023', accountId: 'ACC-102', name: '老客复购·人群包', objective: '成交', bidType: 'oCPM', bid: 64, dailyBudget: 2000, status: 'learn', weight: 0.2, startDate: '2026-10-27' },
  // 千川
  { id: 'P-1031', accountId: 'ACC-103', name: '直播间·引流成交', objective: '直播成交', bidType: 'oCPM', bid: 58, dailyBudget: 5000, status: 'delivering', weight: 0.62, startDate: '2026-09-10' },
  { id: 'P-1032', accountId: 'ACC-103', name: '短视频·直播切片引流', objective: '直播成交', bidType: 'oCPM', bid: 46, dailyBudget: 3000, status: 'delivering', weight: 0.38, startDate: '2026-10-11' },
  // 腾讯
  { id: 'P-2011', accountId: 'ACC-201', name: '朋友圈·品牌大曝光', objective: '种草', bidType: 'CPM', bid: 24, dailyBudget: 5000, status: 'delivering', weight: 0.55, startDate: '2026-09-08' },
  { id: 'P-2012', accountId: 'ACC-201', name: '朋友圈·成交转化', objective: '成交', bidType: 'oCPM', bid: 118, dailyBudget: 4000, status: 'delivering', weight: 0.45, startDate: '2026-09-15' },
  { id: 'P-2021', accountId: 'ACC-202', name: '优量汇·加购拉新', objective: '加购', bidType: 'oCPM', bid: 36, dailyBudget: 4500, status: 'limited', weight: 1, startDate: '2026-09-25' },
  // 快手（掉量事故账户）
  { id: 'P-3011', accountId: 'ACC-301', name: '快手·冲锋衣成交', objective: '成交', bidType: 'oCPM', bid: 52, dailyBudget: 4200, status: 'delivering', weight: 0.6, startDate: '2026-09-09' },
  { id: 'P-3012', accountId: 'ACC-301', name: '快手·帐篷尝鲜', objective: '成交', bidType: 'oCPM', bid: 38, dailyBudget: 2800, status: 'delivering', weight: 0.4, startDate: '2026-10-02' },
  { id: 'P-3021', accountId: 'ACC-302', name: '快手品牌·人群种草', objective: '种草', bidType: 'CPM', bid: 12, dailyBudget: 3000, status: 'paused', weight: 1, startDate: '2026-09-01' },
  // 百度
  { id: 'P-4011', accountId: 'ACC-401', name: '信息流·秋冬成交', objective: '成交', bidType: 'oCPM', bid: 72, dailyBudget: 3800, status: 'delivering', weight: 0.7, startDate: '2026-09-14' },
  { id: 'P-4012', accountId: 'ACC-401', name: '信息流·装备种草', objective: '种草', bidType: 'CPC', bid: 0.95, dailyBudget: 1700, status: 'delivering', weight: 0.3, startDate: '2026-10-08' },
  { id: 'P-4021', accountId: 'ACC-402', name: '品牌专区·搜索承接', objective: '成交', bidType: 'CPC', bid: 2.4, dailyBudget: 2200, status: 'delivering', weight: 1, startDate: '2026-09-01' },
  // 小红书（授权过期账户）
  { id: 'P-5011', accountId: 'ACC-501', name: '聚光·秋冬种草', objective: '种草', bidType: 'oCPM', bid: 46, dailyBudget: 3600, status: 'delivering', weight: 0.6, startDate: '2026-09-06' },
  { id: 'P-5012', accountId: 'ACC-501', name: '聚光·成交收割', objective: '成交', bidType: 'oCPM', bid: 88, dailyBudget: 2400, status: 'delivering', weight: 0.4, startDate: '2026-09-20' },
  { id: 'P-5021', accountId: 'ACC-502', name: '达人内容加热', objective: '种草', bidType: 'CPM', bid: 32, dailyBudget: 3500, status: 'delivering', weight: 1, startDate: '2026-09-11' },
  // B站
  { id: 'P-6011', accountId: 'ACC-601', name: 'UP主·徒步场景植入', objective: '种草', bidType: 'CPM', bid: 18, dailyBudget: 3000, status: 'delivering', weight: 1, startDate: '2026-09-19' },
];

/** 计划列表：账户月汇总按权重拆分，保证 Σ计划 === 账户 */
export const AD_PLANS: AdPlan[] = (() => {
  const byAccount = new Map<string, PlanDef[]>();
  for (const d of PLAN_DEFS) {
    const list = byAccount.get(d.accountId) ?? [];
    list.push(d);
    byAccount.set(d.accountId, list);
  }
  const out: AdPlan[] = [];
  for (const [accountId, defs] of byAccount) {
    const weights = defs.map((d) => d.weight);
    const parts = splitAccountMetrics(accountId, weights);
    defs.forEach((d, i) => {
      out.push({
        id: d.id,
        accountId,
        name: d.name,
        objective: d.objective,
        bidType: d.bidType,
        bid: d.bid,
        dailyBudget: d.dailyBudget,
        status: d.status,
        weight: d.weight,
        startDate: d.startDate,
        m: parts[i],
      });
    });
  }
  return out;
})();

export const PLAN_MAP = AD_PLANS.reduce((acc, p) => ({ ...acc, [p.id]: p }), {} as Record<string, AdPlan>);

/* ---------------- 素材库 ---------------- */
interface MaterialDef {
  id: string;
  name: string;
  type: MaterialType;
  duration: number;
  angle: string;
  fatigue: number;
}

const MATERIAL_DEFS: MaterialDef[] = [
  { id: 'M-01', name: '雪山实拍·冲锋衣防风', type: '短视频', duration: 18, angle: '极限场景实证', fatigue: 0.18 },
  { id: 'M-02', name: '三合一拆解·一衣三穿', type: '短视频', duration: 24, angle: '功能拆解', fatigue: 0.22 },
  { id: 'M-03', name: '雨天防滑·徒步鞋实测', type: '短视频', duration: 15, angle: '痛点实测', fatigue: 0.74 },
  { id: 'M-04', name: '3 秒速开帐篷', type: '短视频', duration: 12, angle: '省时爽感', fatigue: 0.31 },
  { id: 'M-05', name: '达人秋冬穿搭合集', type: '达人视频', duration: 32, angle: '场景穿搭', fatigue: 0.27 },
  { id: 'M-06', name: '露营装备必买清单', type: '图文', duration: 0, angle: '清单种草', fatigue: 0.44 },
  { id: 'M-07', name: '直播间福利款切片', type: '直播切片', duration: 20, angle: '价格锚点', fatigue: 0.52 },
  { id: 'M-08', name: '15000mm 防水实验', type: '短视频', duration: 21, angle: '参数可视化', fatigue: 0.19 },
  { id: 'M-09', name: '秋冬新品 lookbook', type: '图文', duration: 0, angle: '视觉调性', fatigue: 0.36 },
  { id: 'M-10', name: '亲子露营场景', type: '短视频', duration: 26, angle: '家庭场景', fatigue: 0.25 },
  { id: 'M-11', name: '城市通勤也能穿', type: '短视频', duration: 19, angle: '拓宽人群', fatigue: 0.41 },
  { id: 'M-12', name: '双 11 预售清单', type: '图文', duration: 0, angle: '促销利益点', fatigue: 0.15 },
  { id: 'M-13', name: '徒步路线 vlog', type: '达人视频', duration: 45, angle: '真实体验', fatigue: 0.29 },
  { id: 'M-14', name: '品牌词搜索承接图', type: '搜索图文', duration: 0, angle: '品牌词承接', fatigue: 0.12 },
];

/** 创意（计划下的具体投放单元），2 条/计划，权重 0.6/0.4 */
interface CreativeDef {
  id: string;
  planId: string;
  name: string;
  materialId: string;
  status: Creative['status'];
  weight: number;
}

const CREATIVE_DEFS: CreativeDef[] = [
  { id: 'C-1011A', planId: 'P-1011', name: '雪山实拍-18s-主推', materialId: 'M-01', status: 'active', weight: 0.6 },
  { id: 'C-1011B', planId: 'P-1011', name: '防水实验-21s-次推', materialId: 'M-08', status: 'active', weight: 0.4 },
  { id: 'C-1012A', planId: 'P-1012', name: '一衣三穿-24s', materialId: 'M-02', status: 'active', weight: 0.62 },
  { id: 'C-1012B', planId: 'P-1012', name: '通勤场景-19s', materialId: 'M-11', status: 'active', weight: 0.38 },
  { id: 'C-1013A', planId: 'P-1013', name: '品牌词-搜索承接', materialId: 'M-14', status: 'active', weight: 1 },
  { id: 'C-1021A', planId: 'P-1021', name: '徒步鞋雨天实测-15s', materialId: 'M-03', status: 'active', weight: 0.7 },
  { id: 'C-1021B', planId: 'P-1021', name: '徒步路线vlog切片', materialId: 'M-13', status: 'active', weight: 0.3 },
  { id: 'C-1022A', planId: 'P-1022', name: '露营清单-图文', materialId: 'M-06', status: 'active', weight: 0.55 },
  { id: 'C-1022B', planId: 'P-1022', name: '亲子露营-26s', materialId: 'M-10', status: 'active', weight: 0.45 },
  { id: 'C-1023A', planId: 'P-1023', name: '双11预售清单', materialId: 'M-12', status: 'active', weight: 1 },
  { id: 'C-1031A', planId: 'P-1031', name: '直播福利款切片', materialId: 'M-07', status: 'active', weight: 0.65 },
  { id: 'C-1031B', planId: 'P-1031', name: '达人穿搭合集', materialId: 'M-05', status: 'active', weight: 0.35 },
  { id: 'C-1032A', planId: 'P-1032', name: '新品lookbook切片', materialId: 'M-09', status: 'active', weight: 1 },
  { id: 'C-2011A', planId: 'P-2011', name: '秋冬lookbook-朋友圈', materialId: 'M-09', status: 'active', weight: 0.55 },
  { id: 'C-2011B', planId: 'P-2011', name: '亲子露营-朋友圈', materialId: 'M-10', status: 'active', weight: 0.45 },
  { id: 'C-2012A', planId: 'P-2012', name: '三合一拆解-成交向', materialId: 'M-02', status: 'active', weight: 1 },
  { id: 'C-2021A', planId: 'P-2021', name: '露营清单-优量汇', materialId: 'M-06', status: 'active', weight: 1 },
  { id: 'C-3011A', planId: 'P-3011', name: '冲锋衣防风-快手版', materialId: 'M-01', status: 'active', weight: 1 },
  { id: 'C-3012A', planId: 'P-3012', name: '速开帐篷-快手版', materialId: 'M-04', status: 'active', weight: 1 },
  { id: 'C-3021A', planId: 'P-3021', name: '品牌种草-快手', materialId: 'M-09', status: 'paused', weight: 1 },
  { id: 'C-4011A', planId: 'P-4011', name: '秋冬成交-信息流', materialId: 'M-01', status: 'active', weight: 0.6 },
  { id: 'C-4011B', planId: 'P-4011', name: '防水实验-信息流', materialId: 'M-08', status: 'active', weight: 0.4 },
  { id: 'C-4012A', planId: 'P-4012', name: '装备清单-种草', materialId: 'M-06', status: 'active', weight: 1 },
  { id: 'C-4021A', planId: 'P-4021', name: '品牌专区-搜索图', materialId: 'M-14', status: 'active', weight: 1 },
  { id: 'C-5011A', planId: 'P-5011', name: '聚光-穿搭达人', materialId: 'M-05', status: 'active', weight: 0.6 },
  { id: 'C-5011B', planId: 'P-5011', name: '聚光-lookbook', materialId: 'M-09', status: 'active', weight: 0.4 },
  { id: 'C-5012A', planId: 'P-5012', name: '聚光-成交收割图', materialId: 'M-12', status: 'active', weight: 1 },
  { id: 'C-5021A', planId: 'P-5021', name: '达人加热-vlog', materialId: 'M-13', status: 'active', weight: 1 },
  { id: 'C-6011A', planId: 'P-6011', name: 'UP主-徒步植入', materialId: 'M-13', status: 'active', weight: 0.7 },
  { id: 'C-6011B', planId: 'P-6011', name: 'UP主-装备清单', materialId: 'M-06', status: 'active', weight: 0.3 },
];

/** 素材衰减曲线（7 日 CTR 指数，1.00 为上线首日） */
function decayCurve(fatigue: number): number[] {
  return Array.from({ length: 7 }, (_, i) => r2(1 - fatigue * (i / 6) ** 0.85));
}

export const CREATIVES: Creative[] = (() => {
  const out: Creative[] = [];
  const byPlan = new Map<string, CreativeDef[]>();
  for (const c of CREATIVE_DEFS) {
    const list = byPlan.get(c.planId) ?? [];
    list.push(c);
    byPlan.set(c.planId, list);
  }
  for (const [planId, defs] of byPlan) {
    const plan = PLAN_MAP[planId];
    const weights = defs.map((d) => d.weight);
    // 按权重把计划汇总拆到创意
    const cents = Math.round(plan.m.spend * 100);
    const spendParts = (() => {
      const total = cents;
      const sumW = weights.reduce((s, w) => s + w, 0);
      const raw = weights.map((w) => (total * w) / sumW);
      const base = raw.map((v) => Math.floor(v));
      let rest = total - base.reduce((s, v) => s + v, 0);
      const order = raw.map((v, i) => ({ i, f: v - Math.floor(v) })).sort((a, b) => b.f - a.f);
      for (let k = 0; k < rest; k++) base[order[k % order.length].i] += 1;
      return base.map((c) => c / 100);
    })();
    const alloc = (total: number) => {
      const sumW = weights.reduce((s, w) => s + w, 0);
      const raw = weights.map((w) => (total * w) / sumW);
      const base = raw.map((v) => Math.floor(v));
      let rest = total - base.reduce((s, v) => s + v, 0);
      const order = raw.map((v, i) => ({ i, f: v - Math.floor(v) })).sort((a, b) => b.f - a.f);
      for (let k = 0; k < rest; k++) base[order[k % order.length].i] += 1;
      return base;
    };
    const imp = alloc(plan.m.impressions);
    const clk = alloc(plan.m.clicks);
    const cnv = alloc(plan.m.conversions);
    const paid = alloc(plan.m.paidOrders);
    const gmvC = alloc(Math.round(plan.m.gmv * 100));
    const reach = alloc(plan.m.reach);
    defs.forEach((d, i) => {
      const mat = MATERIAL_DEFS.find((m) => m.id === d.materialId)!;
      out.push({
        id: d.id,
        planId,
        accountId: plan.accountId,
        name: d.name,
        materialType: mat.type,
        materialId: d.materialId,
        status: d.status,
        decay: decayCurve(mat.fatigue),
        m: {
          impressions: imp[i],
          clicks: clk[i],
          spend: spendParts[i],
          conversions: cnv[i],
          paidOrders: paid[i],
          gmv: gmvC[i] / 100,
          reach: reach[i],
        },
      });
    });
  }
  return out;
})();

export const CREATIVE_MAP = CREATIVES.reduce((acc, c) => ({ ...acc, [c.id]: c }), {} as Record<string, Creative>);

/** 素材汇总：由使用该素材的创意聚合而来，保证与创意层一致 */
export const MATERIALS: Material[] = MATERIAL_DEFS.map((d) => {
  const used = CREATIVES.filter((c) => c.materialId === d.id);
  const m = used.reduce(
    (acc, c) => addMetrics(acc, c.m),
    { impressions: 0, clicks: 0, spend: 0, conversions: 0, paidOrders: 0, gmv: 0, reach: 0 },
  );
  return {
    ...d,
    planCount: new Set(used.map((c) => c.planId)).size,
    m,
  };
});

export const MATERIAL_MAP = MATERIALS.reduce((acc, m) => ({ ...acc, [m.id]: m }), {} as Record<string, Material>);

export function plansOfAccount(accountId: string): AdPlan[] {
  return AD_PLANS.filter((p) => p.accountId === accountId);
}

export function creativesOfPlan(planId: string): Creative[] {
  return CREATIVES.filter((c) => c.planId === planId);
}

export function creativesOfAccount(accountId: string): Creative[] {
  return CREATIVES.filter((c) => c.accountId === accountId);
}

/** 校验：Σ计划 === Σ账户（顶部展示「数据勾稽通过」用） */
export const PLAN_SUM_CHECK = (() => {
  const accountTotal = ACCOUNTS.reduce((s, a) => s + metricsOfAccount(a.id).spend, 0);
  const planTotal = AD_PLANS.reduce((s, p) => s + p.m.spend, 0);
  return { accountTotal: r2(accountTotal), planTotal: r2(planTotal), ok: Math.abs(accountTotal - planTotal) < 0.01 };
})();
