import { useEffect, useState } from 'react';
import { Activity, CheckCircle2, TrendingUp, Zap } from 'lucide-react';
import { PageHeader, SectionCard, StatCard } from '@/components/ui/page';
import { Segmented } from '@/components/ui/data';
import { BarRankChart, DonutChart, TrendAreaChart } from '@/components/charts';
import { mockApi } from '@/mock/api';

interface UsageData {
  days: { date: string; calls: number; errors: number }[];
  total: number;
  successRate: number;
  errorCodes: { code: string; count: number; label: string }[];
  topEndpoints: { path: string; name: string; calls: number }[];
}

export default function ServiceUsage() {
  const [data, setData] = useState<UsageData | null>(null);
  const [range, setRange] = useState('30d');

  useEffect(() => {
    mockApi.service.usage().then((d) => setData(d as UsageData));
  }, []);

  if (!data) return <div className="page"><div className="h-[420px] skel" /></div>;

  const chartData = range === '7d' ? data.days.slice(-7) : range === '14d' ? data.days.slice(-14) : data.days;

  return (
    <div className="page">
      <PageHeader title="调用统计" desc="开放 API 的调用量、成功率与错误分布，数据每小时更新一次" />

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="本月调用量" value={data.total.toLocaleString()} unit="次" delta="+18.6%" up icon={<Activity size={14} />} spark={[12, 16, 14, 20, 18, 24, 22, 28]} />
        <StatCard label="成功率" value={`${data.successRate}%`} delta="-0.04%" tone="green" icon={<CheckCircle2 size={14} />} spark={[26, 25, 27, 26, 25, 26, 27, 26]} />
        <StatCard label="平均响应" value="86" unit="ms" delta="-12ms" tone="cyan" icon={<Zap size={14} />} spark={[18, 16, 17, 14, 15, 13, 14, 12]} />
        <StatCard label="峰值 QPS" value="42" unit="次/秒" hint="限额 50" tone="violet" icon={<TrendingUp size={14} />} spark={[8, 12, 18, 22, 30, 36, 40, 42]} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <SectionCard
          title="调用趋势"
          desc="每日成功调用与失败次数"
          className="col-span-2"
          extra={<Segmented value={range} onChange={setRange} items={[{ key: '7d', label: '7 天' }, { key: '14d', label: '14 天' }, { key: '30d', label: '30 天' }]} />}
        >
          <TrendAreaChart
            data={chartData as unknown as Record<string, string | number>[]}
            keys={[
              { key: 'calls', name: '调用量', color: '#3D7DFF' },
              { key: 'errors', name: '失败数', color: '#FF5C7A' },
            ]}
            height={260}
          />
        </SectionCard>

        <SectionCard title="错误码分布" desc="本月失败请求">
          <DonutChart
            data={data.errorCodes.map((e, i) => ({
              name: `${e.code} ${e.label}`,
              value: e.count,
              color: ['#FF5C7A', '#F5B544', '#8B5CF6', '#63718A'][i % 4],
            }))}
            height={260}
            centerValue={data.errorCodes.reduce((s, e) => s + e.count, 0).toString()}
            centerLabel="失败请求"
          />
        </SectionCard>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <SectionCard title="Top 接口" desc="按调用量排序">
          <BarRankChart
            data={data.topEndpoints.map((e) => ({ name: e.name, value: e.calls }))}
            height={230}
            color="#22D3EE"
          />
        </SectionCard>

        <SectionCard title="错误明细" desc="按错误码汇总">
          <div className="overflow-hidden rounded-[9px] border border-[var(--stroke)]">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 88 }}>错误码</th>
                  <th>说明</th>
                  <th style={{ width: 100 }}>次数</th>
                  <th style={{ width: 100 }}>占比</th>
                </tr>
              </thead>
              <tbody>
                {data.errorCodes.map((e) => {
                  const total = data.errorCodes.reduce((s, x) => s + x.count, 0);
                  return (
                    <tr key={e.code}>
                      <td><span className="font-mono text-[11.5px] text-[var(--danger)]">{e.code}</span></td>
                      <td><span className="text-[11.5px]">{e.label}</span></td>
                      <td><span className="num text-[11.5px]">{e.count}</span></td>
                      <td><span className="num text-[11.5px] text-[var(--text-3)]">{((e.count / total) * 100).toFixed(1)}%</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-[11px] leading-relaxed text-[var(--text-3)]">
            429 错误主要由瞬时并发超过 QPS 限制引起，建议接入方实现指数退避重试。
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
