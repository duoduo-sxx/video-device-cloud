import { useMemo, useState } from 'react';
import { Button, Segmented, Select, Tooltip } from 'antd';
import { AlertTriangle, CalendarRange } from 'lucide-react';
import { ROLES } from '@/types/enums';
import type { RoleId } from '@/types/enums';
import { PageHeader, SectionCard } from '@/components/layout';
import { BaseChart } from '@/components/BaseChart';
import { Avatar, Progress, StatusTag } from '@/components/ui';
import { users } from '@/mock';

const WEEKS = ['W40', 'W41', 'W42', 'W43', 'W44', 'W45', 'W46', 'W47'];
const CAPACITY = 40;

function hoursOf(userId: string, weekIndex: number): number {
  const seed = userId.charCodeAt(userId.length - 1) * 13 + weekIndex * 7 + userId.length * 3;
  const v = Math.abs(Math.sin(seed) * 1000) % 1;
  return Math.round((0.62 + v * 0.62) * CAPACITY * 10) / 10;
}

export default function WorkloadPage() {
  const [role, setRole] = useState<RoleId | 'all'>('all');
  const [view, setView] = useState<'hours' | 'percent'>('hours');

  const members = useMemo(() => (role === 'all' ? users : users.filter((u) => u.role === role)), [role]);

  const matrix = useMemo(
    () =>
      members.map((u) => {
        const cells = WEEKS.map((w, i) => ({ week: w, hours: hoursOf(u.id, i) }));
        const total = cells.reduce((s, c) => s + c.hours, 0);
        const overloadWeeks = cells.filter((c) => c.hours > CAPACITY).length;
        return { ...u, cells, total, overloadWeeks, avg: total / WEEKS.length };
      }),
    [members],
  );

  const totalHours = matrix.reduce((s, m) => s + m.total, 0);
  const capacity = matrix.length * WEEKS.length * CAPACITY;
  const utilization = totalHours / Math.max(1, capacity);
  const overloaded = matrix.filter((m) => m.overloadWeeks > 0);

  const cellColor = (hours: number) => {
    const ratio = hours / CAPACITY;
    if (ratio > 1.15) return { bg: 'rgba(240,68,56,.82)', fg: '#fff' };
    if (ratio > 1) return { bg: 'rgba(247,144,9,.78)', fg: '#fff' };
    if (ratio > 0.85) return { bg: 'rgba(76,141,255,.6)', fg: '#fff' };
    if (ratio > 0.6) return { bg: 'rgba(76,141,255,.32)', fg: 'var(--np-text-primary)' };
    return { bg: 'var(--np-bg-subtle)', fg: 'var(--np-text-tertiary)' };
  };

  const weekTotals = WEEKS.map((w, i) => ({
    week: w,
    hours: matrix.reduce((s, m) => s + (m.cells[i]?.hours ?? 0), 0),
  }));

  const chartOption = useMemo(
    () => ({
      grid: { left: 4, right: 12, top: 24, bottom: 4, containLabel: true },
      tooltip: { trigger: 'axis' as const, valueFormatter: (v: unknown) => `${Math.round(Number(v))} h` },
      xAxis: { type: 'category' as const, data: WEEKS },
      yAxis: { type: 'value' as const, name: '总工时', nameTextStyle: { fontSize: 10 } },
      series: [
        {
          type: 'bar' as const,
          data: weekTotals.map((w) => w.hours),
          barWidth: '46%',
          itemStyle: { color: '#4C8DFF', borderRadius: [4, 4, 0, 0] },
          markLine: {
            silent: true,
            symbol: 'none',
            data: [{ yAxis: matrix.length * CAPACITY, label: { formatter: '可用产能', fontSize: 10 } }],
            lineStyle: { color: '#F04438', type: 'dashed' as const },
          },
        },
      ],
    }),
    [weekTotals, matrix.length],
  );

  return (
    <div className="np-page">
      <PageHeader
        title="工时与产能"
        desc={`未来 8 周总可用产能 ${Math.round(capacity)}h · 已排 ${Math.round(totalHours)}h · 利用率 ${Math.round(utilization * 100)}%`}
        actions={
          <>
            <Select
              size="small"
              value={role}
              onChange={setRole}
              style={{ width: 140 }}
              options={[{ value: 'all', label: '全部角色' }, ...Object.entries(ROLES).map(([k, v]) => ({ value: k, label: v.label }))]}
            />
            <Segmented
              size="small"
              value={view}
              onChange={(v) => setView(v as 'hours' | 'percent')}
              options={[
                { label: '工时', value: 'hours' },
                { label: '负载率', value: 'percent' },
              ]}
            />
            <Button icon={<CalendarRange size={13} />}>调整排期</Button>
          </>
        }
      />

      <div className="np-grid-4" style={{ marginBottom: 16 }}>
        <div className="np-stat">
          <div className="np-stat-label">总排期工时</div>
          <div className="np-stat-value" style={{ fontSize: 22 }}>{Math.round(totalHours)}<small>h</small></div>
          <div className="np-stat-foot">{matrix.length} 人 × 8 周</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">产能利用率</div>
          <div className="np-stat-value">{Math.round(utilization * 100)}%</div>
          <div className="np-stat-foot">健康区间 80% ~ 95%</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">超载成员</div>
          <div className="np-stat-value" style={{ color: overloaded.length > 0 ? 'var(--np-danger)' : undefined }}>
            {overloaded.length}
          </div>
          <div className="np-stat-foot">至少一周超过 40h</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">峰值周</div>
          <div className="np-stat-value" style={{ fontSize: 20 }}>
            {[...weekTotals].sort((a, b) => b.hours - a.hours)[0]?.week}
          </div>
          <div className="np-stat-foot">
            {Math.round([...weekTotals].sort((a, b) => b.hours - a.hours)[0]?.hours ?? 0)}h 已排
          </div>
        </div>
      </div>

      <SectionCard title="周产能分布" sub="虚线为可用产能上限" style={{ marginBottom: 16 }}>
        <BaseChart option={chartOption} height={220} />
      </SectionCard>

      <SectionCard
        title="排期热力图"
        sub="颜色越深负载越高，红色为超载"
        extra={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 10.5, color: 'var(--np-text-tertiary)' }}>
            <span>低</span>
            <div style={{ display: 'flex', gap: 2 }}>
              {[0.4, 0.7, 0.9, 1.05, 1.2].map((r) => (
                <span key={r} style={{ width: 16, height: 10, borderRadius: 2, background: cellColor(r * CAPACITY).bg }} />
              ))}
            </div>
            <span>高</span>
          </div>
        }
        bodyStyle={{ overflowX: 'auto' }}
      >
        <table className="np-matrix" style={{ minWidth: 780 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', minWidth: 170 }}>成员</th>
              {WEEKS.map((w) => (
                <th key={w} style={{ minWidth: 62 }} className="np-mono-sm">
                  {w}
                </th>
              ))}
              <th style={{ minWidth: 96 }}>合计</th>
            </tr>
          </thead>
          <tbody>
            {matrix.map((m) => (
              <tr key={m.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Avatar name={m.name} size={22} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5 }}>{m.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--np-text-tertiary)' }}>{ROLES[m.role].label}</div>
                    </div>
                  </div>
                </td>
                {m.cells.map((c) => {
                  const col = cellColor(c.hours);
                  return (
                    <td key={c.week} style={{ padding: 2 }}>
                      <Tooltip title={`${m.name} · ${c.week} · ${c.hours}h（${Math.round((c.hours / CAPACITY) * 100)}%）`}>
                        <div
                          style={{
                            height: 30,
                            borderRadius: 4,
                            background: col.bg,
                            color: col.fg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10.5,
                          }}
                        >
                          {view === 'hours' ? c.hours : `${Math.round((c.hours / CAPACITY) * 100)}%`}
                        </div>
                      </Tooltip>
                    </td>
                  );
                })}
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 44 }}>
                      <Progress value={(m.total / (WEEKS.length * CAPACITY)) * 100} height={4} />
                    </div>
                    <span className="np-num" style={{ fontSize: 11 }}>{Math.round(m.total)}h</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>

      <div style={{ marginTop: 16 }} className="np-grid-2">
        <SectionCard title="超载预警" extra={<StatusTag label={`${overloaded.length} 人`} tone={overloaded.length > 0 ? 'danger' : 'default'} />}>
          {overloaded.length === 0 ? (
            <div style={{ fontSize: 12.5, color: 'var(--np-text-tertiary)', padding: '12px 0' }}>当前筛选下没有超载成员</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {overloaded.slice(0, 6).map((m) => (
                <div key={m.id} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                  <AlertTriangle size={14} style={{ color: 'var(--np-danger)', marginTop: 2, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5 }}>
                      {m.name} · {ROLES[m.role].label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--np-text-tertiary)' }}>
                      {m.overloadWeeks} 周超过 40h，峰值 {Math.round(Math.max(...m.cells.map((c) => c.hours)))}h
                    </div>
                  </div>
                  <Button size="small">调配</Button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="可承接能力" sub="周均剩余工时">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...matrix]
              .sort((a, b) => a.avg - b.avg)
              .slice(0, 6)
              .map((m) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <Avatar name={m.name} size={20} />
                  <span style={{ width: 62 }} className="np-truncate">
                    {m.name}
                  </span>
                  <div style={{ flex: 1 }}>
                    <Progress value={(m.avg / CAPACITY) * 100} height={4} />
                  </div>
                  <span className="np-num" style={{ width: 56, textAlign: 'right', color: 'var(--np-text-tertiary)', fontSize: 11 }}>
                    余 {Math.max(0, Math.round(CAPACITY - m.avg))}h
                  </span>
                </div>
              ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
