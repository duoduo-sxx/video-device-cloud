import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Segmented } from 'antd';
import { ArrowRight, Bug, CalendarClock, CheckCircle2, FileText, Inbox, Timer } from 'lucide-react';
import type { Task } from '@/types/models';
import { BUG_SEVERITY, BUG_STATUS, TASK_STATUS, TICKET_LEVEL, TICKET_STATUS } from '@/types/enums';
import { PageHeader, SectionCard } from '@/components/layout';
import { EmptyState, StatusTag } from '@/components/ui';
import { bugs, builds, projectName, tickets } from '@/mock';
import { useAuthStore } from '@/stores/authStore';
import { formatDate, formatMinutes, fromNow } from '@/utils/format';
import { tasks } from '@/mock';

export default function WorkPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [scope, setScope] = useState<'open' | 'today'>('open');

  const me = user?.id ?? 'U-002';

  const myTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.assigneeId === me)
        .filter((t) => (scope === 'open' ? t.status !== 'done' : t.dueDate <= '2026-10-19'))
        .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1)),
    [me, scope],
  );

  const myBugs = useMemo(() => bugs.filter((b) => b.assigneeId === me && !['closed', 'verified', 'rejected'].includes(b.status)), [me]);
  const myTickets = useMemo(
    () => tickets.filter((t) => t.assigneeId === me && !['closed', 'resolved'].includes(t.status)),
    [me],
  );
  const myBuilds = useMemo(() => builds.filter((b) => b.author === me).slice(0, 5), [me]);

  const overdue = myTasks.filter((t) => t.dueDate < '2026-10-19');
  const doneToday = tasks.filter((t) => t.assigneeId === me && t.status === 'done' && t.dueDate === '2026-10-19');
  const sprintPoints = myTasks.reduce((s, t) => s + t.storyPoints, 0);

  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>();
    myTasks.forEach((t) => {
      const arr = map.get(t.projectId) ?? [];
      arr.push(t);
      map.set(t.projectId, arr);
    });
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [myTasks]);

  return (
    <div className="np-page">
      <PageHeader
        title={`${greeting()}，${user?.name ?? '邓斯远'}`}
        desc={`${user?.title ?? ''} · 今天是 2026-10-19 周一 · 你有 ${myTasks.length} 项待处理任务、${myBugs.length} 个缺陷待修复`}
        actions={
          <>
            <Button icon={<FileText size={13} />}>写日报</Button>
            <Button type="primary" onClick={() => navigate('/projects/PRJ-2026-006/board')}>
              进入看板
            </Button>
          </>
        }
      />

      <div className="np-grid-4" style={{ marginBottom: 16 }}>
        <div className="np-stat">
          <div className="np-stat-label">待处理任务</div>
          <div className="np-stat-value">
            {myTasks.length}
            <small>项</small>
          </div>
          <div className="np-stat-foot">
            {overdue.length > 0 ? (
              <span style={{ color: 'var(--np-danger)' }}>其中 {overdue.length} 项已逾期</span>
            ) : (
              '全部在期内'
            )}
          </div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">今日完成</div>
          <div className="np-stat-value">{doneToday.length}</div>
          <div className="np-stat-foot">本周累计 {tasks.filter((t) => t.assigneeId === me && t.status === 'done').length} 项</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">待修复缺陷</div>
          <div className="np-stat-value" style={{ color: myBugs.length > 0 ? 'var(--np-warning)' : undefined }}>
            {myBugs.length}
          </div>
          <div className="np-stat-foot">
            {myBugs.filter((b) => ['blocker', 'critical'].includes(b.severity)).length} 个为致命及以上
          </div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">本期故事点</div>
          <div className="np-stat-value">{sprintPoints}</div>
          <div className="np-stat-foot">当前迭代剩余 4 天</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 336px', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <SectionCard
            title="我的任务"
            sub={`${myTasks.length} 项`}
            extra={
              <Segmented
                size="small"
                value={scope}
                onChange={(v) => setScope(v as 'open' | 'today')}
                options={[
                  { label: '全部待处理', value: 'open' },
                  { label: '今日到期', value: 'today' },
                ]}
              />
            }
            bodyStyle={{ paddingTop: 4 }}
          >
            {grouped.length === 0 ? (
              <EmptyState
                title="任务清空了"
                desc="当前没有指派给你的任务，可以去需求池认领"
                action={
                  <Button size="small" style={{ marginTop: 10 }} onClick={() => navigate('/projects')}>
                    浏览项目
                  </Button>
                }
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {grouped.map(([projectId, items]) => (
                  <div key={projectId} style={{ paddingTop: 10 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 11.5,
                        color: 'var(--np-text-tertiary)',
                        marginBottom: 4,
                        cursor: 'pointer',
                      }}
                      onClick={() => navigate(`/projects/${projectId}/board`)}
                    >
                      {projectName(projectId)}
                      <ArrowRight size={11} />
                    </div>
                    {items.map((t) => {
                      const late = t.dueDate < '2026-10-19' && t.status !== 'done';
                      return (
                        <div
                          key={t.id}
                          className="np-clickable"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '9px 10px',
                            borderRadius: 6,
                            cursor: 'pointer',
                          }}
                          onClick={() => navigate(`/projects/${projectId}/board`)}
                        >
                          <span
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: '50%',
                              flexShrink: 0,
                              background:
                                t.priority === 'P0'
                                  ? 'var(--np-danger)'
                                  : t.priority === 'P1'
                                    ? 'var(--np-warning)'
                                    : 'var(--np-border-strong)',
                            }}
                          />
                          <span style={{ flex: 1, minWidth: 0, fontSize: 12.5 }} className="np-truncate">
                            {t.title}
                          </span>
                          <StatusTag label={TASK_STATUS[t.status].label} tone={TASK_STATUS[t.status].tone} dot={false} />
                          <span
                            style={{
                              fontSize: 11,
                              color: late ? 'var(--np-danger)' : 'var(--np-text-tertiary)',
                              width: 62,
                              textAlign: 'right',
                            }}
                          >
                            {late ? `逾期 ${Math.round((new Date('2026-10-19').getTime() - new Date(t.dueDate).getTime()) / 86400000)} 天` : formatDate(t.dueDate, 'MM-DD')}
                          </span>
                          <span className="np-num" style={{ fontSize: 11, color: 'var(--np-text-tertiary)', width: 26, textAlign: 'right' }}>
                            {t.storyPoints}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="指派给我的缺陷" sub={`${myBugs.length} 个`} bodyStyle={{ paddingTop: 4 }}>
            {myBugs.length === 0 ? (
              <EmptyState title="没有待修复缺陷" desc="测试同事暂时没有指派新问题给你" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {myBugs.slice(0, 6).map((b) => (
                  <div
                    key={b.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 4px',
                      borderBottom: '1px solid var(--np-border)',
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate(`/projects/${b.projectId}/bugs`)}
                  >
                    <Bug size={14} style={{ color: 'var(--np-danger)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="np-truncate" style={{ fontSize: 12.5 }}>
                        {b.title}
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)' }}>
                        {projectName(b.projectId)} · {b.module} · {b.environment.device}
                      </div>
                    </div>
                    <StatusTag label={BUG_SEVERITY[b.severity].label} tone={BUG_SEVERITY[b.severity].tone} dot={false} />
                    <StatusTag label={BUG_STATUS[b.status].label} tone={BUG_STATUS[b.status].tone} dot={false} />
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionCard title="今日日程">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { t: '10:00', n: '每日站会', d: '15 分钟 · 会议室 A', tone: 'var(--np-primary-500)' },
                { t: '14:00', n: '深海迷航 渠道包验收', d: '60 分钟 · 与客户对齐', tone: 'var(--np-warning)' },
                { t: '16:30', n: '分包方案评审', d: '45 分钟 · 技术评审', tone: 'var(--np-info)' },
                { t: '19:00', n: '灰度数据复盘', d: '30 分钟 · 线上', tone: 'var(--np-text-tertiary)' },
              ].map((x) => (
                <div key={x.t} style={{ display: 'flex', gap: 10 }}>
                  <div style={{ width: 38, fontSize: 11.5, color: 'var(--np-text-tertiary)', flexShrink: 0, paddingTop: 1 }}>{x.t}</div>
                  <div style={{ width: 2, borderRadius: 1, background: x.tone, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5 }}>{x.n}</div>
                    <div style={{ fontSize: 11, color: 'var(--np-text-tertiary)' }}>{x.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="待响应工单" extra={<span style={{ fontSize: 11, color: 'var(--np-text-tertiary)' }}>{myTickets.length} 个</span>}>
            {myTickets.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--np-text-tertiary)', padding: '10px 0' }}>暂无指派给你的工单</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {myTickets.slice(0, 4).map((t) => (
                  <div
                    key={t.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/support/tickets/${t.id}`)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <StatusTag label={t.level} tone={TICKET_LEVEL[t.level].tone} dot={false} />
                      <span style={{ marginLeft: 'auto', fontSize: 10.5, color: t.sla.breached ? 'var(--np-danger)' : 'var(--np-text-tertiary)' }}>
                        {t.sla.breached ? 'SLA 超时' : `剩余 ${formatMinutes(Math.max(0, (new Date(t.sla.respondDeadline).getTime() - new Date('2026-10-19T10:32:00').getTime()) / 60000))}`}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, lineHeight: 1.5 }}>{t.title}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)', marginTop: 2 }}>
                      {TICKET_STATUS[t.status].label} · {fromNow(t.updatedAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="最近构建" extra={<Button type="link" size="small" onClick={() => navigate('/builds')}>全部</Button>}>
            {myBuilds.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--np-text-tertiary)', padding: '10px 0' }}>还没有触发过构建</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {myBuilds.map((b) => (
                  <div
                    key={b.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, cursor: 'pointer' }}
                    onClick={() => navigate(`/builds/${b.id}`)}
                  >
                    <CheckCircle2
                      size={12}
                      style={{ color: b.status === 'success' ? 'var(--np-success)' : b.status === 'failed' ? 'var(--np-danger)' : 'var(--np-info)' }}
                    />
                    <span className="np-mono-sm">#{b.buildNumber}</span>
                    <span className="np-truncate" style={{ flex: 1, color: 'var(--np-text-secondary)' }}>
                      {b.branch}
                    </span>
                    <span style={{ color: 'var(--np-text-tertiary)' }}>{fromNow(b.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="快捷入口">
            <div className="np-grid-2" style={{ gap: 8 }}>
              {[
                { l: '提交缺陷', i: <Bug size={13} />, p: '/quality/crashes' },
                { l: '查看性能', i: <Timer size={13} />, p: '/quality/performance' },
                { l: '发布日历', i: <CalendarClock size={13} />, p: '/releases/calendar' },
                { l: '工单队列', i: <Inbox size={13} />, p: '/support/tickets' },
              ].map((x) => (
                <div
                  key={x.l}
                  className="np-clickable"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                    color: 'var(--np-text-secondary)',
                  }}
                  onClick={() => navigate(x.p)}
                >
                  {x.i}
                  {x.l}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function greeting(): string {
  const h = new Date(2026, 9, 19, 10, 32).getHours();
  if (h < 6) return '凌晨好';
  if (h < 12) return '上午好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
}
