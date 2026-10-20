import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Segmented, Table, Tabs } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ArrowDown, ArrowUp, Download, Sparkles } from 'lucide-react';
import { PageHeader, SectionCard } from '@/components/layout';
import { Avatar, Progress, StatusTag } from '@/components/ui';
import { StatCard } from '@/components/StatCard';
import { BaseChart } from '@/components/BaseChart';
import { HEALTH, RELEASE_STATUS, TICKET_LEVEL, CHANNELS } from '@/types/enums';
import type { Project } from '@/types/models';
import {
  breachedTickets,
  builds,
  byChannel,
  lastNDays,
  openTickets,
  projects,
  releases,
  tickets,
  todayMetrics,
  userName,
} from '@/mock';
import { formatMoney, formatNumber, formatPercent, fromNow } from '@/utils/format';
import { useAuthStore } from '@/stores/authStore';

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [range, setRange] = useState<number>(30);

  const days = lastNDays(range);
  const today = todayMetrics();
  const monthRevenue = useMemo(() => {
    const oct = days.filter((d) => d.date >= '2026-10-01');
    return oct.reduce((s, d) => s + d.revenue, 0);
  }, [days]);

  const inProgress = projects.filter((p) => p.status === 'in_progress').length;
  const risky = projects.filter((p) => p.health !== 'healthy').length;
  const monthReleases = releases.filter((r) => r.publishAt && r.publishAt >= '2026-10-01').length;
  const slaRate = 1 - breachedTickets.length / Math.max(1, tickets.length);

  const sparkDau = days.slice(-14).map((d) => d.dau);
  const sparkRevenue = days.slice(-14).map((d) => d.revenue);

  const channelData = useMemo(() => {
    const list = byChannel(7).slice(0, 6);
    const rest = byChannel(7).slice(6).reduce((s, c) => s + c.dau, 0);
    const data: { name: string; value: number }[] = list.map((c) => ({ name: CHANNELS[c.channel].short, value: c.dau }));
    if (rest > 0) data.push({ name: '其他', value: rest });
    return data;
  }, []);

  const comboOption = useMemo(
    () => ({
      legend: { data: ['流水', 'DAU'] },
      grid: { left: 8, right: 8, top: 32, bottom: 4, containLabel: true },
      tooltip: {
        trigger: 'axis' as const,
        formatter: (params: unknown) => {
          const arr = params as { axisValue: string; seriesName: string; value: number; color: string }[];
          const head = `<div style="font-weight:500;margin-bottom:4px">${arr[0]?.axisValue ?? ''}</div>`;
          const rows = arr
            .map(
              (p) =>
                `<div style="display:flex;align-items:center;gap:6px;line-height:20px"><span style="width:6px;height:6px;border-radius:50%;background:${p.color}"></span><span style="color:#8A94A6">${p.seriesName}</span><span style="margin-left:auto;font-variant-numeric:tabular-nums">${
                  p.seriesName === '流水' ? formatMoney(p.value) : formatNumber(p.value)
                }</span></div>`,
            )
            .join('');
          return head + rows;
        },
      },
      xAxis: {
        type: 'category' as const,
        data: days.map((d) => d.date.slice(5)),
        axisLabel: { interval: Math.max(1, Math.floor(days.length / 8)) },
      },
      yAxis: [
        { type: 'value' as const, name: '', axisLabel: { formatter: (v: number) => `${(v / 10000).toFixed(0)}万` } },
        { type: 'value' as const, axisLabel: { formatter: (v: number) => `${(v / 10000).toFixed(0)}万` }, splitLine: { show: false } },
      ],
      series: [
        {
          name: '流水',
          type: 'bar' as const,
          data: days.map((d) => d.revenue),
          barMaxWidth: 14,
          itemStyle: { color: '#4B5BF5', borderRadius: [3, 3, 0, 0] },
        },
        {
          name: 'DAU',
          type: 'line' as const,
          yAxisIndex: 1,
          data: days.map((d) => d.dau),
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2, color: '#0BA5EC' },
          areaStyle: {
            color: {
              type: 'linear' as const,
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(11,165,236,.18)' },
                { offset: 1, color: 'rgba(11,165,236,0)' },
              ],
            },
          },
        },
      ],
    }),
    [days],
  );

  const donutOption = useMemo(
    () => ({
      tooltip: { trigger: 'item' as const, formatter: '{b}: {c} ({d}%)' },
      legend: {
        orient: 'vertical' as const,
        right: 0,
        top: 'middle',
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { fontSize: 11, color: 'var(--np-text-secondary)' },
      },
      series: [
        {
          type: 'pie' as const,
          radius: ['58%', '80%'],
          center: ['34%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: 'var(--np-bg-surface)', borderWidth: 2, borderRadius: 4 },
          label: { show: false },
          data: channelData,
          color: ['#4B5BF5', '#0BA5EC', '#17B26A', '#F79009', '#7A5AF8', '#F04438', '#8A94A6'],
        },
      ],
      graphic: {
        type: 'text' as const,
        left: '29%',
        top: '46%',
        style: {
          text: formatNumber(today.dau),
          fontSize: 18,
          fontWeight: 600,
          fill: 'var(--np-text-primary)',
        },
      },
    }),
    [channelData, today.dau],
  );

  const healthRows = useMemo(
    () =>
      projects
        .filter((p) => p.status !== 'archived')
        .sort((a, b) => a.healthScore - b.healthScore)
        .slice(0, 8),
    [],
  );

  const columns: ColumnsType<Project> = [
    {
      title: '项目',
      dataIndex: 'name',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: `linear-gradient(135deg, var(--np-primary-400), var(--np-primary-700))`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 10,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {r.code.slice(0, 2)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>{r.name}</div>
            <div style={{ fontSize: 11, color: 'var(--np-text-tertiary)' }}>{r.id}</div>
          </div>
        </div>
      ),
    },
    {
      title: '负责人',
      dataIndex: 'managerId',
      width: 96,
      render: (v: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Avatar name={userName(v)} size={20} />
          <span style={{ fontSize: 12 }}>{userName(v)}</span>
        </div>
      ),
    },
    {
      title: '进度',
      dataIndex: 'progress',
      width: 120,
      render: (v: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Progress value={v} height={4} />
          <span className="np-num" style={{ fontSize: 11.5, width: 30, textAlign: 'right' }}>
            {v}%
          </span>
        </div>
      ),
    },
    {
      title: '健康度',
      dataIndex: 'health',
      width: 80,
      render: (v: Project['health']) => <StatusTag label={HEALTH[v].label} tone={HEALTH[v].tone} />,
    },
    {
      title: '交付',
      dataIndex: 'daysLeft',
      width: 88,
      align: 'right',
      render: (v: number, r) => {
        if (r.status === 'online' || r.status === 'maintenance') return <span className="np-muted" style={{ fontSize: 12 }}>—</span>;
        if (v < 0) return <span style={{ color: 'var(--np-danger)', fontSize: 12 }}>逾期 {Math.abs(v)} 天</span>;
        return (
          <span style={{ color: v <= 7 ? 'var(--np-warning)' : 'var(--np-text-secondary)', fontSize: 12 }}>
            {v} 天
          </span>
        );
      },
    },
  ];

  const pendingItems = useMemo(() => {
    const list = openTickets.slice(0, 5).map((t) => ({
      id: t.id,
      title: t.title,
      meta: `${t.creatorName} · ${TICKET_LEVEL[t.level].label}`,
      level: t.level,
      link: `/support/tickets/${t.id}`,
    }));
    return list;
  }, []);

  const riskItems = useMemo(
    () =>
      projects
        .filter((p) => p.riskNote)
        .slice(0, 5)
        .map((p) => ({ id: p.id, title: p.riskNote as string, meta: p.name, link: `/projects/${p.id}` })),
    [],
  );

  const recentBuilds = useMemo(() => builds.slice(0, 8), []);
  const greeting = new Date().getHours() < 12 ? '上午好' : new Date().getHours() < 18 ? '下午好' : '晚上好';

  return (
    <div className="np-page">
      <PageHeader
        title={
          <>
            {greeting}，{user?.name}
            <span
              style={{
                fontSize: 11,
                fontWeight: 400,
                padding: '2px 8px',
                borderRadius: 20,
                background: 'var(--np-primary-50)',
                color: 'var(--np-primary-600)',
              }}
            >
              2026 年 10 月 19 日 · 周一
            </span>
          </>
        }
        desc={
          <>
            本周有 <b style={{ color: 'var(--np-text-primary)' }}>3 个项目</b> 临近交付节点，
            另有 <b style={{ color: 'var(--np-danger)' }}>2 个 P0 工单</b> 待处理。
          </>
        }
        actions={
          <>
            <Segmented
              value={range}
              onChange={(v) => setRange(v as number)}
              options={[
                { label: '近 7 天', value: 7 },
                { label: '近 30 天', value: 30 },
                { label: '本季度', value: 90 },
              ]}
            />
            <Button icon={<Download size={14} />}>导出</Button>
          </>
        }
      />

      <div className="np-grid-6" style={{ marginBottom: 16 }}>
        <StatCard
          label="在研项目"
          value={inProgress}
          unit="个"
          foot={<span style={{ marginLeft: 2 }}>其中 {risky} 个风险</span>}
          spark={[10, 11, 11, 12, 12, 13, 13, 13, 14, 14, 14, 14]}
          sparkColor="var(--np-primary-500)"
        />
        <StatCard
          label="本月交付版本"
          value={monthReleases}
          unit="个"
          delta={0.18}
          foot={<span style={{ marginLeft: 4 }}>较上月</span>}
          spark={[4, 6, 5, 7, 6, 8, 7, 9, 8, 9, 10, monthReleases]}
          sparkColor="var(--np-success)"
        />
        <StatCard
          label="全渠道 DAU"
          value={formatNumber(today.dau)}
          delta={today.dauDelta}
          foot={<span style={{ marginLeft: 4 }}>较昨日</span>}
          spark={sparkDau}
        />
        <StatCard
          label="本月流水"
          value={formatMoney(monthRevenue)}
          delta={today.revenueDelta}
          foot={<span style={{ marginLeft: 4 }}>日环比</span>}
          spark={sparkRevenue}
          sparkColor="var(--np-purple)"
        />
        <StatCard
          label="SLA 达标率"
          value={formatPercent(slaRate, 1)}
          foot={<span style={{ marginLeft: 2 }}>目标 95% · {breachedTickets.length} 单超时</span>}
          spark={[0.94, 0.95, 0.96, 0.95, 0.97, 0.96, 0.96, 0.95, 0.96, 0.97, 0.96, slaRate]}
          sparkColor="var(--np-success)"
        />
        <StatCard
          label="待处理工单"
          value={openTickets.length}
          unit="单"
          foot={
            <span style={{ marginLeft: 2 }}>
              <span style={{ color: 'var(--np-danger)' }}>
                P0 {openTickets.filter((t) => t.level === 'P0').length}
              </span>{' '}
              个紧急
            </span>
          }
          spark={[18, 20, 22, 19, 24, 23, 25, 26, 24, 27, 26, openTickets.length]}
          sparkColor="var(--np-warning)"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <SectionCard
          title="流量与流水"
          sub={`近 ${range} 天`}
          extra={<span style={{ fontSize: 11.5, color: 'var(--np-text-tertiary)' }}>单位：元 / 人</span>}
        >
          <BaseChart option={comboOption} height={252} />
        </SectionCard>
        <SectionCard title="渠道分布" sub="近 7 天 DAU">
          <BaseChart option={donutOption} height={252} />
        </SectionCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <SectionCard
          title="项目健康度"
          sub="按评分升序，优先关注风险项"
          extra={
            <Button type="link" size="small" onClick={() => navigate('/projects')}>
              查看全部
            </Button>
          }
          flush
        >
          <Table
            rowKey="id"
            size="small"
            columns={columns}
            dataSource={healthRows}
            pagination={false}
            onRow={(r) => ({ onClick: () => navigate(`/projects/${r.id}`), style: { cursor: 'pointer' } })}
          />
        </SectionCard>

        <SectionCard title="风险与待办" flush>
          <Tabs
            size="small"
            style={{ padding: '0 16px' }}
            items={[
              {
                key: 'risk',
                label: `风险 ${riskItems.length}`,
                children: (
                  <div style={{ paddingBottom: 12 }}>
                    {riskItems.map((item) => (
                      <div
                        key={item.id}
                        className="np-clickable"
                        style={{ padding: '10px 2px', borderBottom: '1px solid var(--np-border)', cursor: 'pointer' }}
                        onClick={() => navigate(item.link)}
                      >
                        <div style={{ display: 'flex', gap: 8 }}>
                          <span style={{ color: 'var(--np-danger)', marginTop: 2, flexShrink: 0 }}>
                            <ArrowDown size={13} />
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--np-text-primary)' }}>
                              {item.title}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--np-text-tertiary)', marginTop: 3 }}>
                              {item.meta}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                key: 'ticket',
                label: `工单 ${pendingItems.length}`,
                children: (
                  <div style={{ paddingBottom: 12 }}>
                    {pendingItems.map((item) => (
                      <div
                        key={item.id}
                        style={{ padding: '10px 2px', borderBottom: '1px solid var(--np-border)', cursor: 'pointer' }}
                        onClick={() => navigate(item.link)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <StatusTag label={TICKET_LEVEL[item.level].label} tone={TICKET_LEVEL[item.level].tone} dot={false} />
                          <span style={{ fontSize: 11, color: 'var(--np-text-tertiary)' }}>{item.id}</span>
                        </div>
                        <div style={{ fontSize: 12.5, lineHeight: 1.55 }}>{item.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--np-text-tertiary)', marginTop: 3 }}>{item.meta}</div>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                key: 'approval',
                label: '审批 2',
                children: (
                  <div style={{ paddingBottom: 12 }}>
                    {[
                      { t: '「深海迷航：无尽海域」v1.4.2 发布单', m: '微信小游戏、抖音小游戏 · 林知远 提交', l: '/releases' },
                      { t: '「塔防纪元」3 项数值变更确认', m: '超出合同范围 · 方旬 提交', l: '/projects/PRJ-2026-021/requirements' },
                    ].map((x) => (
                      <div
                        key={x.t}
                        style={{ padding: '10px 2px', borderBottom: '1px solid var(--np-border)', cursor: 'pointer' }}
                        onClick={() => navigate(x.l)}
                      >
                        <div style={{ display: 'flex', gap: 8 }}>
                          <span style={{ color: 'var(--np-warning)', marginTop: 2 }}>
                            <ArrowUp size={13} />
                          </span>
                          <div>
                            <div style={{ fontSize: 12.5 }}>{x.t}</div>
                            <div style={{ fontSize: 11, color: 'var(--np-text-tertiary)', marginTop: 3 }}>{x.m}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ),
              },
            ]}
          />
        </SectionCard>
      </div>

      <SectionCard
        title="最近构建与发布"
        extra={<Button type="link" size="small" onClick={() => navigate('/builds')}>构建中心</Button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {recentBuilds.map((b, i) => {
            const proj = projects.find((p) => p.id === b.projectId);
            const rel = releases.find((r) => r.buildId === b.id && r.status === 'online');
            return (
              <div
                key={b.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 0',
                  borderBottom: i === recentBuilds.length - 1 ? 'none' : '1px solid var(--np-border)',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/builds/${b.id}`)}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background:
                      b.status === 'success'
                        ? 'var(--np-success)'
                        : b.status === 'failed'
                          ? 'var(--np-danger)'
                          : 'var(--np-info)',
                  }}
                />
                <span style={{ fontSize: 12.5, fontWeight: 500, width: 210, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {proj?.name}
                </span>
                <span className="np-mono-sm">#{b.buildNumber}</span>
                <span style={{ fontSize: 12, color: 'var(--np-text-secondary)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {b.commitMessage}
                </span>
                {rel ? (
                  <StatusTag
                    label={`${CHANNELS[rel.channel].short} ${rel.version} 已上线`}
                    tone={RELEASE_STATUS.online.tone}
                  />
                ) : (
                  <StatusTag
                    label={
                      b.status === 'success' ? '构建成功' : b.status === 'failed' ? '构建失败' : '构建运行中'
                    }
                    tone={b.status === 'success' ? 'success' : b.status === 'failed' ? 'danger' : 'info'}
                  />
                )}
                <span style={{ fontSize: 11, color: 'var(--np-text-tertiary)', width: 66, textAlign: 'right' }}>
                  {fromNow(b.createdAt)}
                </span>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <div
        style={{
          marginTop: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 11.5,
          color: 'var(--np-text-tertiary)',
        }}
      >
        <Sparkles size={13} />
        数据每日 02:00 全量更新，实时指标延迟约 5 分钟。所有数值均为本地模拟数据。
      </div>
    </div>
  );
}
