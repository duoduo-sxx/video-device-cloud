import { useMemo } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { Button, Tooltip } from 'antd';
import { AlertTriangle, ArrowRight, CheckCircle2, Circle, Clock } from 'lucide-react';
import type { Project } from '@/types/models';
import { SectionCard } from '@/components/layout';
import { Avatar, Progress, StatusTag } from '@/components/ui';
import { BaseChart } from '@/components/BaseChart';
import { TICKET_LEVEL, TICKET_STATUS } from '@/types/enums';
import { bugs, builds, projects, tickets, userName } from '@/mock';
import { formatMoney, formatPercent, fromNow } from '@/utils/format';

export default function ProjectOverview() {
  const { project } = useOutletContext<{ project: Project }>();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const pTasks = useMemo(() => builds.filter((b) => b.projectId === project.id), [project.id]);
  const pBugs = useMemo(() => bugs.filter((b) => b.projectId === project.id), [project.id]);
  const openBugs = pBugs.filter((b) => !['closed', 'rejected'].includes(b.status));
  const pTickets = useMemo(() => tickets.filter((t) => t.projectId === project.id), [project.id]);
  const openTickets = pTickets.filter((t) => !['closed', 'resolved'].includes(t.status));

  const doneMilestones = project.milestones.filter((m) => m.status === 'completed').length;
  const delayed = project.milestones.filter((m) => m.status === 'delayed').length;

  const usedDays = Math.max(
    1,
    Math.round((new Date('2026-10-19').getTime() - new Date(project.startDate).getTime()) / 86400000),
  );
  const totalDays = Math.max(
    usedDays,
    Math.round((new Date(project.plannedEndDate).getTime() - new Date(project.startDate).getTime()) / 86400000),
  );

  const severityCount = {
    blocker: pBugs.filter((b) => b.severity === 'blocker').length,
    critical: pBugs.filter((b) => b.severity === 'critical').length,
    major: pBugs.filter((b) => b.severity === 'major').length,
    other: pBugs.filter((b) => !['blocker', 'critical', 'major'].includes(b.severity)).length,
  };

  const successRate = pTasks.length
    ? pTasks.filter((b) => b.status === 'success').length / pTasks.filter((b) => b.status !== 'running').length
    : 0;

  const buildTrend = useMemo(() => {
    const recent = pTasks.slice(0, 14).reverse();
    return {
      xAxis: { type: 'category' as const, data: recent.map((b) => `#${b.buildNumber}`) },
      yAxis: { type: 'value' as const, min: 0, max: 100, axisLabel: { formatter: '{value}%' } },
      grid: { left: 4, right: 8, top: 16, bottom: 4, containLabel: true },
      series: [
        {
          type: 'line' as const,
          data: recent.map((b) => (b.status === 'success' ? 100 : b.status === 'failed' ? 0 : b.progress)),
          smooth: false,
          step: 'middle' as const,
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: { width: 1.6, color: '#17B26A' },
          itemStyle: { color: '#17B26A' },
          areaStyle: {
            color: {
              type: 'linear' as const,
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(23,178,106,.16)' },
                { offset: 1, color: 'rgba(23,178,106,0)' },
              ],
            },
          },
        },
      ],
    };
  }, [pTasks]);

  const bugTrend = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => i);
    let open = openBugs.length + 18;
    const openSeries: number[] = [];
    const closeSeries: number[] = [];
    days.forEach((i) => {
      open = Math.max(4, open - (i % 4 === 0 ? 3 : 1) + (i % 5 === 0 ? 4 : 0));
      openSeries.push(open);
      closeSeries.push(Math.max(0, 34 - i * 2 + (i % 3)));
    });
    return {
      legend: { data: ['未关闭', '已关闭'] },
      grid: { left: 4, right: 8, top: 28, bottom: 4, containLabel: true },
      xAxis: { type: 'category' as const, data: days.map((d) => `${d + 6}日`) },
      yAxis: { type: 'value' as const },
      series: [
        { name: '未关闭', type: 'line' as const, data: openSeries, smooth: true, symbol: 'none', lineStyle: { width: 2, color: '#F04438' } },
        { name: '已关闭', type: 'line' as const, data: closeSeries, smooth: true, symbol: 'none', lineStyle: { width: 2, color: '#17B26A' } },
      ],
    };
  }, [openBugs.length]);

  const activities = useMemo(() => {
    const items: { time: string; who: string; text: string; tone: 'info' | 'success' | 'warning' | 'danger' }[] = [];
    pTasks.slice(0, 3).forEach((b) => {
      items.push({
        time: b.createdAt,
        who: userName(b.author),
        text: `触发了构建 #${b.buildNumber}，${b.status === 'success' ? '构建成功' : b.status === 'failed' ? '构建失败' : '正在运行'}`,
        tone: b.status === 'failed' ? 'danger' : 'info',
      });
    });
    pBugs.slice(0, 3).forEach((b) => {
      items.push({
        time: b.createdAt,
        who: userName(b.reporterId),
        text: `提交缺陷「${b.title.slice(0, 28)}…」`,
        tone: b.severity === 'blocker' ? 'danger' : 'warning',
      });
    });
    return items.sort((a, b) => (a.time < b.time ? 1 : -1)).slice(0, 6);
  }, [pTasks, pBugs]);

  const scoreDims = [
    { k: '进度', v: Math.min(100, Math.round(project.progress * 1.05)) },
    { k: '质量', v: Math.max(30, 100 - openBugs.length * 1.6) },
    { k: '风险', v: project.health === 'healthy' ? 88 : project.health === 'at_risk' ? 62 : 34 },
    { k: '客户满意度', v: 88 },
  ];

  return (
    <div className="np-page">
      <div className="np-grid-4" style={{ marginBottom: 16 }}>
        <div className="np-stat" style={{ minHeight: 96 }}>
          <div className="np-stat-label">项目进度</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 2 }}>
            <div style={{ position: 'relative', width: 52, height: 52 }}>
              <svg width="52" height="52" viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="22" fill="none" stroke="var(--np-bg-subtle)" strokeWidth="5" />
                <circle
                  cx="26"
                  cy="26"
                  r="22"
                  fill="none"
                  stroke="var(--np-primary-500)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${(project.progress / 100) * 138.2} 138.2`}
                  transform="rotate(-90 26 26)"
                />
              </svg>
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {project.progress}%
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--np-text-tertiary)', lineHeight: 1.7 }}>
              <div>
                里程碑 {doneMilestones}/{project.milestones.length}
              </div>
              <div>延期 {delayed} 个</div>
            </div>
          </div>
        </div>

        <div className="np-stat" style={{ minHeight: 96 }}>
          <div className="np-stat-label">工期</div>
          <div className="np-stat-value" style={{ fontSize: 24 }}>
            {usedDays}
            <small>/ {totalDays} 天</small>
          </div>
          <div className="np-stat-foot">
            <Progress value={(usedDays / totalDays) * 100} height={4} />
            <span style={{ marginLeft: 6, whiteSpace: 'nowrap' }}>
              {project.daysLeft < 0 ? `逾期 ${Math.abs(project.daysLeft)} 天` : `剩 ${project.daysLeft} 天`}
            </span>
          </div>
        </div>

        <div className="np-stat" style={{ minHeight: 96 }}>
          <div className="np-stat-label">未关闭缺陷</div>
          <div className="np-stat-value" style={{ fontSize: 24 }}>
            {openBugs.length}
            <small>个</small>
          </div>
          <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
            {[
              { k: '阻断', v: severityCount.blocker, c: 'var(--np-danger)' },
              { k: '致命', v: severityCount.critical, c: '#F97066' },
              { k: '严重', v: severityCount.major, c: 'var(--np-warning)' },
              { k: '其他', v: severityCount.other, c: 'var(--np-text-disabled)' },
            ].map((x) => (
              <Tooltip key={x.k} title={`${x.k} ${x.v} 个`}>
                <div style={{ flex: x.v || 0.2, height: 4, borderRadius: 2, background: x.c, minWidth: 4 }} />
              </Tooltip>
            ))}
          </div>
          <div className="np-stat-foot">共 {pBugs.length} 条缺陷记录</div>
        </div>

        <div className="np-stat" style={{ minHeight: 96 }}>
          <div className="np-stat-label">构建成功率</div>
          <div className="np-stat-value" style={{ fontSize: 24 }}>
            {formatPercent(successRate, 1)}
          </div>
          <div className="np-stat-foot">近 90 天 {pTasks.length} 次构建 · 平均 {Math.round(pTasks.reduce((s, b) => s + b.durationSec, 0) / Math.max(1, pTasks.length) / 60)} 分钟</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <SectionCard
            title="里程碑"
            sub={`${doneMilestones}/${project.milestones.length} 已完成`}
            extra={
              <Button type="link" size="small" onClick={() => navigate(`/projects/${id}/milestones`)}>
                查看甘特
              </Button>
            }
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, overflowX: 'auto', paddingBottom: 4 }}>
              {project.milestones.map((m, i) => {
                const tone =
                  m.status === 'completed'
                    ? 'var(--np-success)'
                    : m.status === 'delayed'
                      ? 'var(--np-danger)'
                      : m.status === 'in_progress'
                        ? 'var(--np-primary-500)'
                        : 'var(--np-border-strong)';
                return (
                  <div key={m.id} style={{ flex: 1, minWidth: 118, position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: m.status === 'completed' ? 'var(--np-success)' : 'var(--np-bg-surface)',
                          border: `2px solid ${tone}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          zIndex: 1,
                        }}
                      >
                        {m.status === 'completed' ? (
                          <CheckCircle2 size={12} color="#fff" />
                        ) : m.status === 'delayed' ? (
                          <AlertTriangle size={10} color="var(--np-danger)" />
                        ) : m.status === 'in_progress' ? (
                          <Clock size={10} color="var(--np-primary-500)" />
                        ) : (
                          <Circle size={6} color="var(--np-border-strong)" />
                        )}
                      </div>
                      {i < project.milestones.length - 1 && (
                        <div
                          style={{
                            flex: 1,
                            height: 2,
                            background: m.status === 'completed' ? 'var(--np-success)' : 'var(--np-border)',
                            opacity: 0.35,
                          }}
                        />
                      )}
                    </div>
                    <div style={{ marginTop: 8, paddingRight: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.4, minHeight: 34 }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: m.status === 'delayed' ? 'var(--np-danger)' : 'var(--np-text-tertiary)', marginTop: 2 }}>
                        {m.plannedDate.slice(5)}
                        {m.status === 'delayed' && ' · 逾期'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <div className="np-grid-2">
            <SectionCard title="构建成功率" sub="近 14 次">
              <BaseChart option={buildTrend} height={176} />
            </SectionCard>
            <SectionCard title="缺陷收敛" sub="近 14 天">
              <BaseChart option={bugTrend} height={176} />
            </SectionCard>
          </div>

          <SectionCard title="近期动态" flush>
            <div style={{ padding: '6px 18px 14px' }}>
              {activities.map((a, i) => (
                <div
                  key={`${a.time}-${i}`}
                  style={{
                    display: 'flex',
                    gap: 10,
                    padding: '11px 0',
                    borderBottom: i === activities.length - 1 ? 'none' : '1px solid var(--np-border)',
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      marginTop: 6,
                      flexShrink: 0,
                      background:
                        a.tone === 'danger'
                          ? 'var(--np-danger)'
                          : a.tone === 'warning'
                            ? 'var(--np-warning)'
                            : 'var(--np-info)',
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>
                      <b style={{ fontWeight: 500 }}>{a.who}</b> {a.text}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--np-text-tertiary)', marginTop: 2 }}>{fromNow(a.time)}</div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {project.riskNote && (
            <SectionCard title="风险与问题" extra={<StatusTag label="需要关注" tone="danger" />}>
              <div style={{ display: 'flex', gap: 10 }}>
                <AlertTriangle size={16} color="var(--np-warning)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 12.5, lineHeight: 1.85, color: 'var(--np-text-secondary)' }}>{project.riskNote}</div>
              </div>
            </SectionCard>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionCard title="健康度评分">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
                <svg width="72" height="72" viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r="30" fill="none" stroke="var(--np-bg-subtle)" strokeWidth="6" />
                  <circle
                    cx="36"
                    cy="36"
                    r="30"
                    fill="none"
                    stroke={
                      project.healthScore >= 75
                        ? 'var(--np-success)'
                        : project.healthScore >= 55
                          ? 'var(--np-warning)'
                          : 'var(--np-danger)'
                    }
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${(project.healthScore / 100) * 188.5} 188.5`}
                    transform="rotate(-90 36 36)"
                  />
                </svg>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: 18, fontWeight: 600, lineHeight: 1 }}>{project.healthScore}</span>
                  <span style={{ fontSize: 10, color: 'var(--np-text-tertiary)' }}>分</span>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {scoreDims.map((d) => (
                  <div key={d.k}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                      <span style={{ color: 'var(--np-text-tertiary)' }}>{d.k}</span>
                      <span className="np-num">{d.v}</span>
                    </div>
                    <Progress value={d.v} height={3} />
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="关键成员" extra={<Button type="link" size="small" onClick={() => navigate(`/projects/${id}/members`)}>全部</Button>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {project.memberIds.slice(0, 6).map((uid) => (
                <div key={uid} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar name={userName(uid)} size={24} />
                  <span style={{ fontSize: 12.5, flex: 1 }}>{userName(uid)}</span>
                  {uid === project.managerId && <StatusTag label="PM" tone="info" dot={false} />}
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="关联工单"
            extra={<Button type="link" size="small" onClick={() => navigate('/support/tickets')}>全部</Button>}
          >
            {openTickets.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--np-text-tertiary)', textAlign: 'center', padding: '12px 0' }}>
                暂无进行中的工单
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {openTickets.slice(0, 4).map((t) => (
                  <div
                    key={t.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/support/tickets/${t.id}`)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <StatusTag label={t.level} tone={TICKET_LEVEL[t.level].tone} dot={false} />
                      <span style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)' }}>{t.id}</span>
                      <span style={{ marginLeft: 'auto' }}>
                        <StatusTag label={TICKET_STATUS[t.status].label} tone={TICKET_STATUS[t.status].tone} dot={false} />
                      </span>
                    </div>
                    <div style={{ fontSize: 12, lineHeight: 1.5 }}>{t.title}</div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="快捷操作">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { l: '查看需求池', p: `/projects/${id}/requirements` },
                { l: '进入任务看板', p: `/projects/${id}/board` },
                { l: '查看发布矩阵', p: `/projects/${id}/releases` },
                { l: '管理项目成员', p: `/projects/${id}/members` },
              ].map((x) => (
                <div
                  key={x.l}
                  className="np-clickable"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 6,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    color: 'var(--np-text-secondary)',
                  }}
                  onClick={() => navigate(x.p)}
                >
                  {x.l}
                  <ArrowRight size={13} style={{ color: 'var(--np-text-disabled)' }} />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 11.5, color: 'var(--np-text-tertiary)' }}>
        合同金额 {formatMoney(project.contractAmount)} · 项目创建于 {projects.find((p) => p.id === id)?.startDate}
      </div>
    </div>
  );
}
