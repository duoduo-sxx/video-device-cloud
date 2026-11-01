import { ArrowDown, Info } from 'lucide-react';
import { Card, CardHeader, PageHeader, StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FUNNEL, funnelByPlatform } from '@/mocks/funnel';
import { PLATFORM_MAP } from '@/mocks/platforms';
import { num, pct } from '@/lib/format';

const PLATFORM_FUNNEL = funnelByPlatform();
const MAX = FUNNEL[0].count;

export default function Funnel() {
  const order = FUNNEL.find((s) => s.key === 'order')!;
  const addcart = FUNNEL.find((s) => s.key === 'addcart')!;
  const paid = FUNNEL.find((s) => s.key === 'paid')!;
  const weakest = [...FUNNEL]
    .filter((s) => s.benchmark > 0)
    .sort((a, b) => a.stepRate / a.benchmark - b.stepRate / b.benchmark)[0];

  return (
    <>
      <PageHeader
        title="转化漏斗"
        desc="从曝光到支付的七级漏斗，每一级都与行业基准对比；短板环节就是最值得优化的地方"
        breadcrumb="模型分析 / 转化漏斗"
        actions={<Badge tone="red">最大短板：{weakest.label}</Badge>}
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="曝光 → 点击" value={pct(FUNNEL[1].stepRate, 2)} hint={`行业 ${pct(FUNNEL[1].benchmark, 2)}`} />
        <StatCard label="点击 → 下单" value={pct(order.count / FUNNEL[1].count, 2)} hint={`行业 2.00%`} tone="primary" />
        <StatCard
          label="加购 → 下单"
          value={pct(order.stepRate, 1)}
          hint={`行业 ${pct(order.benchmark, 0)}，差距最大`}
          tone="warning"
        />
        <StatCard label="下单 → 支付" value={pct(paid.stepRate, 2)} hint={`行业 ${pct(paid.benchmark, 2)}`} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="全平台漏斗"
            desc="漏斗宽度按人数绝对值等比绘制；右侧为相对上一级的转化率与行业基准对比"
          />
          <div className="mt-4 space-y-1.5">
            {FUNNEL.map((s, i) => {
              const width = Math.max(8, (s.count / MAX) * 100);
              const below = s.benchmark > 0 && s.stepRate < s.benchmark;
              return (
                <div key={s.key}>
                  <div className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-2xs text-ink-2">{s.label}</span>
                    <div className="relative h-8 flex-1">
                      <div
                        className={`flex h-full items-center justify-end rounded-sm pr-2 text-2xs text-white transition-all ${
                          below ? 'bg-warning' : 'bg-primary'
                        }`}
                        style={{ width: `${width}%` }}
                      >
                        <span className="num font-medium">{num(s.count)}</span>
                      </div>
                    </div>
                    <div className="w-36 shrink-0 text-right">
                      {i === 0 ? (
                        <span className="text-2xs text-ink-3">起始环节</span>
                      ) : (
                        <span className="flex items-center justify-end gap-1.5">
                          <span className={`num text-xs font-medium ${below ? 'text-warning' : 'text-success'}`}>
                            {pct(s.stepRate, s.stepRate < 0.02 ? 2 : 1)}
                          </span>
                          <span className="num text-2xs text-ink-3">/ {pct(s.benchmark, s.benchmark < 0.02 ? 2 : 1)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  {i < FUNNEL.length - 1 && (
                    <div className="flex items-center gap-3 py-0.5">
                      <span className="w-24 shrink-0" />
                      <ArrowDown size={11} className="text-ink-3" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-3 border-t border-line pt-3 text-2xs text-ink-3">
            <span className="flex items-center gap-1">
              <span className="h-2 w-3 rounded-sm bg-primary" /> 达到或高于行业基准
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-3 rounded-sm bg-warning" /> 低于行业基准
            </span>
            <span className="ml-auto">口径：到达 = 点击 × 落地页到达率 91.35%</span>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="短板结论" desc="为什么加购多、下单少" />
            <div className="mt-3 space-y-2 text-xs leading-relaxed text-ink-2">
              <p>
                全链路最大短板在 <span className="font-medium text-ink-1">「加购 → 下单」</span>：
                加购人数 {num(addcart.count)}，但下单只有 {num(order.count)} 单，环节转化率 {pct(order.stepRate, 1)}，
                行业基准 {pct(order.benchmark, 0)}。
              </p>
              <p>
                这不是定向问题——前四层（曝光、点击、到达、详情）都达标，说明<span className="font-medium text-ink-1">流量是准的</span>；
                问题出在「临门一脚」：用户已把商品加入购物车，但没有立刻付款的理由。
              </p>
              <div className="rounded-ctl bg-warning-soft px-3 py-2 text-2xs text-warning">
                <span className="inline-flex items-center gap-1 font-medium">
                  <Info size={11} /> 时序因素
                </span>
                <div className="mt-1">
                  10/21 起进入双 11 预热期，用户普遍「加购等大促」。这类转化会在 11/1 开门红集中释放，
                  因此不能用平销期基准直接判定落地页有问题。
                </div>
              </div>
              <p className="text-2xs text-ink-3">
                建议：11/1 当天对加购未支付人群包做定向触达 + 限时权益，预计转化提升 6.4%（详见 SG-006）。
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader title="漏斗健康度" desc="各环节相对基准的达成率" />
            <div className="mt-3 space-y-2">
              {FUNNEL.filter((s) => s.benchmark > 0).map((s) => {
                const rate = s.stepRate / s.benchmark;
                return (
                  <div key={s.key}>
                    <div className="flex items-center justify-between text-2xs">
                      <span className="text-ink-2">{s.label}</span>
                      <span className={`num font-medium ${rate >= 1 ? 'text-success' : 'text-warning'}`}>
                        {(rate * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#F2F4F7]">
                      <div
                        className={`h-full ${rate >= 1 ? 'bg-success' : 'bg-warning'}`}
                        style={{ width: `${Math.min(100, rate * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader title="分平台漏斗对比" desc="不同平台的链路长短差异，决定预算应该往哪倾斜" />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-line text-left text-2xs text-ink-3">
                <th className="pb-2 font-normal">平台</th>
                <th className="pb-2 text-right font-normal">曝光</th>
                <th className="pb-2 text-right font-normal">点击</th>
                <th className="pb-2 text-right font-normal">加购</th>
                <th className="pb-2 text-right font-normal">下单</th>
                <th className="pb-2 text-right font-normal">支付</th>
                <th className="pb-2 text-right font-normal">点击→下单</th>
                <th className="pb-2 text-right font-normal">曝光→支付</th>
                <th className="pb-2 text-right font-normal">最弱环节</th>
              </tr>
            </thead>
            <tbody>
              {PLATFORM_FUNNEL.map((f) => {
                const get = (k: string) => f.stages.find((s) => s.key === k)?.count ?? 0;
                return (
                  <tr key={f.platform.code} className="border-b border-line/60 last:border-0">
                    <td className="py-2">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: f.platform.color }} />
                        <span className="text-ink-1">{f.platform.name}</span>
                      </div>
                    </td>
                    <td className="num py-2 text-right text-ink-2">{num(get('impression'))}</td>
                    <td className="num py-2 text-right text-ink-2">{num(get('click'))}</td>
                    <td className="num py-2 text-right text-ink-2">{num(get('addcart'))}</td>
                    <td className="num py-2 text-right text-ink-1">{num(get('order'))}</td>
                    <td className="num py-2 text-right text-ink-1">{num(get('paid'))}</td>
                    <td className="num py-2 text-right text-ink-2">{pct(f.clickToOrder, 2)}</td>
                    <td className="num py-2 text-right text-ink-2">{pct(f.endToEnd, 3)}</td>
                    <td className="py-2 text-right text-2xs text-warning">{f.bottleneck}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-2xs leading-relaxed text-ink-3">
          注：各平台加购率存在结构性差异（小红书内容种草加购率高、B站偏低），因此短板环节不同，优化动作也应区别对待。
        </div>
      </Card>
    </>
  );
}
