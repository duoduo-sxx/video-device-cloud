import type { FunnelStage, PlatformCode } from '@/types';
import { PLATFORMS } from './platforms';
import { metricsOfPlatform, totalMetrics, CURRENT_PERIOD } from './daily';
import { r2 } from '@/lib/metrics';

/** 各平台「详情页 → 加购」环节差异（内容平台种草深、加购率高；搜索平台意图强但加购低） */
const ADD_CART_RATE: Record<PlatformCode, number> = {
  oceanengine: 0.092,
  tencent: 0.074,
  kuaishou: 0.061,
  baidu: 0.108,
  xiaohongshu: 0.121,
  bilibili: 0.049,
};

/** 行业基准（用于对比找短板） */
const BENCHMARK = {
  ctr: 0.032,
  landing: 0.925,
  detail: 0.55,
  addCart: 0.11,
  order: 0.32,
  pay: 0.962,
};

function buildFunnel(impressions: number, clicks: number, conversions: number, paidOrders: number, addRate: number): FunnelStage[] {
  const landing = Math.round(clicks * 0.9135);
  const detail = Math.round(landing * 0.52);
  const addCart = Math.round(detail * addRate);
  const stages: Array<{ key: string; label: string; count: number; benchmark: number }> = [
    { key: 'impression', label: '广告曝光', count: impressions, benchmark: 0 },
    { key: 'click', label: '点击', count: clicks, benchmark: BENCHMARK.ctr },
    { key: 'landing', label: '落地页到达', count: landing, benchmark: BENCHMARK.landing },
    { key: 'detail', label: '商品详情浏览', count: detail, benchmark: BENCHMARK.detail },
    { key: 'addcart', label: '加入购物车', count: addCart, benchmark: BENCHMARK.addCart },
    { key: 'order', label: '提交订单', count: conversions, benchmark: BENCHMARK.order },
    { key: 'paid', label: '支付成功', count: paidOrders, benchmark: BENCHMARK.pay },
  ];

  return stages.map((s, i) => {
    const prev = i === 0 ? 0 : stages[i - 1].count;
    const stepRate = i === 0 ? 0 : prev ? s.count / prev : 0;
    return {
      key: s.key,
      label: s.label,
      count: s.count,
      stepRate: r2(stepRate * 10000) / 10000,
      totalRate: impressions ? r2((s.count / impressions) * 10000) / 10000 : 0,
      benchmark: s.benchmark,
    };
  });
}

const T = totalMetrics(CURRENT_PERIOD);
export const FUNNEL = buildFunnel(T.impressions, T.clicks, T.conversions, T.paidOrders, 0.092);

/** 按平台拆漏斗，用于「哪个平台链路最短」对比 */
export function funnelByPlatform() {
  return PLATFORMS.map((p) => {
    const m = metricsOfPlatform(p.code, CURRENT_PERIOD);
    const stages = buildFunnel(m.impressions, m.clicks, m.conversions, m.paidOrders, ADD_CART_RATE[p.code]);
    const order = stages.find((s) => s.key === 'order')!;
    const paid = stages.find((s) => s.key === 'paid')!;
    return {
      platform: p,
      metrics: m,
      stages,
      /** 全链路转化率：曝光 → 支付 */
      endToEnd: stages[0].count ? paid.count / stages[0].count : 0,
      /** 点击 → 下单 */
      clickToOrder: m.clicks ? order.count / m.clicks : 0,
      bottleneck:
        [...stages]
          .filter((s) => s.benchmark > 0 && s.key !== 'impression')
          .sort((a, b) => a.stepRate / (a.benchmark || 1) - b.stepRate / (b.benchmark || 1))[0]?.label ?? '—',
    };
  });
}
