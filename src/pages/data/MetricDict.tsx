import { Card, CardHeader, PageHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { METRIC_DEFS } from '@/mocks/pipeline';
import { totalMetrics, CURRENT_PERIOD } from '@/mocks/daily';
import { cpa, cpc, cpm, ctr, cvr, frequency, roi } from '@/lib/metrics';
import { num, pct } from '@/lib/format';

const T = totalMetrics(CURRENT_PERIOD);

const VALUES: Record<string, string> = {
  spend: `¥${num(T.spend)}`,
  impressions: num(T.impressions),
  clicks: num(T.clicks),
  ctr: pct(ctr(T), 2),
  cpc: `¥${cpc(T).toFixed(2)}`,
  cpm: `¥${cpm(T).toFixed(2)}`,
  conversions: num(T.conversions),
  cvr: pct(cvr(T), 2),
  cpa: `¥${cpa(T).toFixed(2)}`,
  paidOrders: num(T.paidOrders),
  gmv: `¥${num(T.gmv)}`,
  roi: roi(T).toFixed(2),
  frequency: frequency(T).toFixed(2),
};

export default function MetricDict() {
  return (
    <>
      <PageHeader
        title="指标字典"
        desc="13 个核心指标的计算式、口径与平台差异全部落在这里；所有页面都必须引用同一份定义，禁止各页面各算一套"
        breadcrumb="数据资产 / 指标字典"
        actions={<Badge tone="blue">本月实际值已代入</Badge>}
      />

      <Card className="mb-4">
        <CardHeader
          title="为什么指标字典是「数据可信」的前提"
          desc="同一个「转化数」，巨量按「下单」、腾讯按「支付」、小红书含站外成交——不统一口径，跨平台对比全是错的"
        />
        <div className="mt-3 grid grid-cols-1 gap-3 text-2xs leading-relaxed text-ink-2 sm:grid-cols-3">
          <div className="rounded-ctl border border-line px-3 py-2">
            <div className="mb-1 text-xs font-medium text-ink-1">① 计算式唯一</div>
            每个指标只有一个计算式，写在 DWS 建表语句里，前端只做格式化，不做二次计算。
          </div>
          <div className="rounded-ctl border border-line px-3 py-2">
            <div className="mb-1 text-xs font-medium text-ink-1">② 口径差异显式化</div>
            有差异不可怕，可怕的是不说。每条指标都标注「与平台后台的差异及原因」。
          </div>
          <div className="rounded-ctl border border-line px-3 py-2">
            <div className="mb-1 text-xs font-medium text-ink-1">③ 可回溯</div>
            指标异常时能追到具体表、具体字段、具体哪一行，而不是「数据好像不对」。
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {METRIC_DEFS.map((m) => (
          <Card key={m.key} className="!p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink-1">{m.name}</span>
                  <span className="text-2xs text-ink-3">{m.en}</span>
                  <Badge tone="gray">{m.unit}</Badge>
                </div>
                <div className="mt-1.5 rounded-ctl bg-[#F9FAFB] px-2.5 py-1.5 font-mono text-2xs text-ink-2">
                  {m.formula}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-2xs text-ink-3">本月</div>
                <div className="num text-sm font-semibold text-primary">{VALUES[m.key] ?? '—'}</div>
              </div>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-2">{m.desc}</p>
            <div className="mt-2 space-y-1 text-2xs leading-relaxed">
              <div className="flex gap-1.5">
                <span className="shrink-0 text-ink-3">口径：</span>
                <span className="text-ink-2">{m.caliber}</span>
              </div>
              <div className="flex gap-1.5">
                <span className="shrink-0 text-ink-3">差异：</span>
                <span className="text-ink-2">{m.diff}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
