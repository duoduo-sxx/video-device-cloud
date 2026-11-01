import type { AttributionModel, AttributionRow, PlatformCode, TouchPath } from '@/types';
import { PLATFORMS } from './platforms';
import { totalMetrics, metricsOfPlatform, CURRENT_PERIOD } from './daily';
import { allocateInt, roi, r2 } from '@/lib/metrics';

interface ModelDef {
  model: AttributionModel;
  /** 各平台归因权重（合计 1000 千分比） */
  weights: Record<PlatformCode, number>;
  note: string;
}

/**
 * 五个归因模型对「同一批转化」做分配：
 * 每个模型的权重合计都是 1000‰，用最大余数法分配，因此
 * **各模型归因总转化完全相等**，差异只体现在平台之间的贡献分配上。
 * 这是演示「归因口径影响预算决策」的关键。
 */
const MODELS: ModelDef[] = [
  {
    model: 'last',
    weights: { oceanengine: 300, tencent: 240, kuaishou: 140, baidu: 120, xiaohongshu: 140, bilibili: 60 },
    note: '末次点击：只看最后一次触点，会低估内容种草平台',
  },
  {
    model: 'first',
    weights: { oceanengine: 356, tencent: 178, kuaishou: 122, baidu: 82, xiaohongshu: 200, bilibili: 62 },
    note: '首次点击：放大拉新触点的价值，适合评估种草',
  },
  {
    model: 'linear',
    weights: { oceanengine: 308, tencent: 222, kuaishou: 148, baidu: 112, xiaohongshu: 156, bilibili: 54 },
    note: '线性归因：所有触点均分，最中立但不区分先后',
  },
  {
    model: 'time_decay',
    weights: { oceanengine: 322, tencent: 231, kuaishou: 142, baidu: 113, xiaohongshu: 146, bilibili: 46 },
    note: '时间衰减：越靠近转化的触点权重越高（半衰期 3 天）',
  },
  {
    model: 'data_driven',
    weights: { oceanengine: 286, tencent: 214, kuaishou: 158, baidu: 132, xiaohongshu: 152, bilibili: 58 },
    note: '数据驱动：基于 Shapley 值，兼顾触点组合贡献',
  },
];

const TOTAL_CONV = totalMetrics(CURRENT_PERIOD).conversions;
const PLATFORM_CODES = PLATFORMS.map((p) => p.code);

export const ATTRIBUTION: AttributionRow[] = MODELS.map((def) => {
  const weights = PLATFORM_CODES.map((c) => def.weights[c]);
  const parts = allocateInt(TOTAL_CONV, weights);
  const byPlatform = PLATFORM_CODES.reduce(
    (acc, c, i) => ({ ...acc, [c]: parts[i] }),
    {} as Record<PlatformCode, number>,
  );
  return { model: def.model, byPlatform, total: parts.reduce((s, v) => s + v, 0) };
});

export const ATTR_NOTES = MODELS.reduce(
  (acc, m) => ({ ...acc, [m.model]: m.note }),
  {} as Record<AttributionModel, string>,
);

/** 实际平台转化占比（用于与归因结果对比：看哪个平台被低估/高估） */
export const ACTUAL_SHARE = PLATFORM_CODES.reduce((acc, c) => {
  const m = metricsOfPlatform(c, CURRENT_PERIOD);
  return { ...acc, [c]: r2((m.conversions / TOTAL_CONV) * 1000) / 1000 };
}, {} as Record<PlatformCode, number>);

/** 归因与实际的偏差（数据驱动模型 vs 实际末次口径） */
export function attributionDelta(model: AttributionModel) {
  const row = ATTRIBUTION.find((r) => r.model === model)!;
  return PLATFORM_CODES.map((c) => {
    const share = row.byPlatform[c] / TOTAL_CONV;
    return {
      platform: c,
      conversions: row.byPlatform[c],
      share: r2(share * 1000) / 1000,
      actualShare: ACTUAL_SHARE[c],
      delta: r2((share - ACTUAL_SHARE[c]) * 1000) / 1000,
    };
  });
}

/** 典型转化路径（Top 6，覆盖约 78% 转化） */
export const TOUCH_PATHS: TouchPath[] = (() => {
  const defs = [
    { path: '抖音 → 抖音 → 品牌词搜索', w: 0.214, touch: 3.2, days: 1.8, r: 4.62 },
    { path: '小红书 → 天猫站内 → 抖音', w: 0.168, touch: 4.1, days: 3.4, r: 4.05 },
    { path: '朋友圈 → 抖音 → 小红书', w: 0.142, touch: 3.6, days: 2.9, r: 3.74 },
    { path: '抖音直播 → 抖音直播', w: 0.118, touch: 2.1, days: 1.2, r: 5.18 },
    { path: 'B站 UP主 → 小红书 → 抖音', w: 0.079, touch: 4.8, days: 6.2, r: 2.96 },
    { path: '百度搜索 → 抖音 → 品牌词搜索', w: 0.059, touch: 2.7, days: 2.1, r: 3.41 },
  ];
  const parts = allocateInt(TOTAL_CONV, defs.map((d) => d.w * 1000));
  return defs.map((d, i) => ({
    path: d.path,
    conversions: parts[i],
    share: r2(d.w * 100) / 100,
    avgTouch: d.touch,
    avgDays: d.days,
    roi: d.r,
  }));
})();

/** 首个触点（拉新）贡献：展示「种草平台被末次归因低估」 */
export function firstTouchContribution() {
  const first = ATTRIBUTION.find((r) => r.model === 'first')!;
  const last = ATTRIBUTION.find((r) => r.model === 'last')!;
  return PLATFORM_CODES.map((c) => ({
    platform: c,
    firstTouch: first.byPlatform[c],
    lastTouch: last.byPlatform[c],
    gap: first.byPlatform[c] - last.byPlatform[c],
    /** 该平台被末次归因低估的比例 */
    understated: last.byPlatform[c] ? r2(((first.byPlatform[c] - last.byPlatform[c]) / last.byPlatform[c]) * 1000) / 10 : 0,
    roiActual: r2(roi(metricsOfPlatform(c, CURRENT_PERIOD))),
  }));
}
