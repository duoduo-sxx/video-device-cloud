import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Segmented, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight, Flag, Rocket } from 'lucide-react';
import { CHANNELS, RELEASE_STATUS } from '@/types/enums';
import { PageHeader, SectionCard } from '@/components/layout';
import { StatusTag } from '@/components/ui';
import { projects, projectName, releases } from '@/mock';

type Kind = 'release' | 'milestone';

interface CalEvent {
  id: string;
  date: string;
  kind: Kind;
  title: string;
  sub: string;
  projectId: string;
  tone: string;
}

const WEEK = ['一', '二', '三', '四', '五', '六', '日'];

export default function CalendarPage() {
  const navigate = useNavigate();
  const [month, setMonth] = useState(dayjs('2026-10-01'));
  const [kind, setKind] = useState<'all' | Kind>('all');
  const [selected, setSelected] = useState('2026-10-19');

  const events = useMemo<CalEvent[]>(() => {
    const list: CalEvent[] = [];
    releases.forEach((r) => {
      const d = r.publishAt ?? r.submitAt;
      if (!d) return;
      list.push({
        id: `${r.id}-rel`,
        date: d.slice(0, 10),
        kind: 'release',
        title: `${projectName(r.projectId)} ${r.version}`,
        sub: `${CHANNELS[r.channel].short} · ${RELEASE_STATUS[r.status].label}`,
        projectId: r.projectId,
        tone:
          r.status === 'online'
            ? 'var(--np-success)'
            : r.status === 'rejected'
              ? 'var(--np-danger)'
              : r.status === 'reviewing'
                ? 'var(--np-info)'
                : 'var(--np-warning)',
      });
    });
    projects.forEach((p) => {
      p.milestones.forEach((m) => {
        list.push({
          id: `${m.id}-ms`,
          date: m.plannedDate,
          kind: 'milestone',
          title: `${p.name} · ${m.name}`,
          sub: m.status === 'completed' ? '已完成' : m.status === 'delayed' ? '已延期' : '计划节点',
          projectId: p.id,
          tone: m.status === 'completed' ? 'var(--np-success)' : m.status === 'delayed' ? 'var(--np-danger)' : 'var(--np-primary-500)',
        });
      });
    });
    return list;
  }, []);

  const filtered = useMemo(() => (kind === 'all' ? events : events.filter((e) => e.kind === kind)), [events, kind]);

  const grid = useMemo(() => {
    const first = month.startOf('month');
    const offset = (first.day() + 6) % 7;
    const start = first.subtract(offset, 'day');
    return Array.from({ length: 42 }, (_, i) => start.add(i, 'day'));
  }, [month]);

  const eventsOf = (d: dayjs.Dayjs) => filtered.filter((e) => e.date === d.format('YYYY-MM-DD'));
  const selectedEvents = eventsOf(dayjs(selected));

  const monthReleaseCount = filtered.filter((e) => e.kind === 'release' && e.date.startsWith(month.format('YYYY-MM'))).length;
  const monthMilestoneCount = filtered.filter((e) => e.kind === 'milestone' && e.date.startsWith(month.format('YYYY-MM'))).length;

  return (
    <div className="np-page">
      <PageHeader
        title="发布日历"
        desc={`${month.format('YYYY 年 M 月')} · 发布 ${monthReleaseCount} 次 · 里程碑 ${monthMilestoneCount} 个`}
        actions={
          <>
            <Segmented
              size="small"
              value={kind}
              onChange={(v) => setKind(v as 'all' | Kind)}
              options={[
                { label: '全部', value: 'all' },
                { label: '发布', value: 'release' },
                { label: '里程碑', value: 'milestone' },
              ]}
            />
            <Button icon={<ChevronLeft size={14} />} onClick={() => setMonth(month.subtract(1, 'month'))} />
            <Button icon={<ChevronRight size={14} />} onClick={() => setMonth(month.add(1, 'month'))} />
            <Button onClick={() => { setMonth(dayjs('2026-10-01')); setSelected('2026-10-19'); }}>回到今天</Button>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
        <SectionCard title={month.format('YYYY 年 M 月')} sub="点击日期查看当天安排" bodyStyle={{ padding: '14px 16px 18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, marginBottom: 6 }}>
            {WEEK.map((w) => (
              <div key={w} style={{ textAlign: 'center', fontSize: 11, color: 'var(--np-text-tertiary)', padding: '4px 0' }}>
                {w}
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: 'var(--np-border)', borderRadius: 6, overflow: 'hidden' }}>
            {grid.map((d) => {
              const key = d.format('YYYY-MM-DD');
              const inMonth = d.month() === month.month();
              const isToday = key === '2026-10-19';
              const isSelected = key === selected;
              const evts = eventsOf(d);
              return (
                <div
                  key={key}
                  onClick={() => setSelected(key)}
                  style={{
                    minHeight: 84,
                    padding: '6px 7px',
                    background: isSelected ? 'var(--np-primary-50)' : 'var(--np-bg-surface)',
                    cursor: 'pointer',
                    opacity: inMonth ? 1 : 0.4,
                    outline: isToday ? '1.5px solid var(--np-primary-500)' : 'none',
                    outlineOffset: -1.5,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11.5,
                      fontWeight: isToday ? 600 : 400,
                      color: isToday ? 'var(--np-primary-600, var(--np-primary-500))' : 'var(--np-text-secondary)',
                      marginBottom: 4,
                    }}
                  >
                    {d.date()}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {evts.slice(0, 2).map((e) => (
                      <Tooltip key={e.id} title={`${e.title} · ${e.sub}`}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            fontSize: 10,
                            lineHeight: 1.5,
                            color: 'var(--np-text-secondary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          <span style={{ width: 4, height: 4, borderRadius: '50%', background: e.tone, flexShrink: 0 }} />
                          <span className="np-truncate">{e.title.replace(/^.*? · /, '')}</span>
                        </div>
                      </Tooltip>
                    ))}
                    {evts.length > 2 && (
                      <span style={{ fontSize: 9.5, color: 'var(--np-text-tertiary)', paddingLeft: 7 }}>+{evts.length - 2}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionCard
            title={`${dayjs(selected).format('M 月 D 日')} 安排`}
            sub={`${selectedEvents.length} 项`}
          >
            {selectedEvents.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--np-text-tertiary)', padding: '12px 0' }}>当天没有发布或里程碑节点</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {selectedEvents.map((e) => (
                  <div
                    key={e.id}
                    style={{ display: 'flex', gap: 8, cursor: 'pointer' }}
                    onClick={() => navigate(e.kind === 'release' ? `/projects/${e.projectId}/releases` : `/projects/${e.projectId}/milestones`)}
                  >
                    {e.kind === 'release' ? (
                      <Rocket size={13} style={{ color: e.tone, marginTop: 2, flexShrink: 0 }} />
                    ) : (
                      <Flag size={13} style={{ color: e.tone, marginTop: 2, flexShrink: 0 }} />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>{e.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--np-text-tertiary)' }}>{e.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="近期发布" sub="未来 7 天">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered
                .filter((e) => e.kind === 'release' && e.date >= '2026-10-19' && e.date <= '2026-10-26')
                .slice(0, 6)
                .map((e) => (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5 }}>
                    <span className="np-mono-sm" style={{ color: 'var(--np-text-tertiary)', width: 44 }}>
                      {e.date.slice(5)}
                    </span>
                    <span className="np-truncate" style={{ flex: 1 }}>
                      {e.title}
                    </span>
                    <StatusTag label={e.sub.split(' · ')[1] ?? ''} tone="info" dot={false} />
                  </div>
                ))}
              {filtered.filter((e) => e.kind === 'release' && e.date >= '2026-10-19').length === 0 && (
                <div style={{ fontSize: 12, color: 'var(--np-text-tertiary)' }}>未来 7 天没有排期发布</div>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
