import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button, Segmented, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { AlertTriangle, CheckCircle2, Circle, Clock, Flag } from 'lucide-react';
import type { Milestone, Project } from '@/types/models';
import { SectionCard } from '@/components/layout';
import { Avatar, Progress, StatusTag } from '@/components/ui';
import { userName } from '@/mock';
import { formatDate } from '@/utils/format';
import type { Tone } from '@/types/enums';

const MS_STATUS: Record<Milestone['status'], { label: string; tone: Tone }> = {
  not_started: { label: '未开始', tone: 'default' },
  in_progress: { label: '进行中', tone: 'info' },
  completed: { label: '已完成', tone: 'success' },
  delayed: { label: '已延期', tone: 'danger' },
};

export default function MilestonesPage() {
  const { project } = useOutletContext<{ project: Project }>();
  const [view, setView] = useState<'gantt' | 'table'>('gantt');
  const [onlyRisk, setOnlyRisk] = useState(false);

  const rows = useMemo(() => {
    const sorted = [...project.milestones].sort((a, b) => (a.plannedDate < b.plannedDate ? -1 : 1));
    const start = dayjs(project.startDate);
    const lastPlan = sorted.reduce((acc, m) => (m.plannedDate > acc ? m.plannedDate : acc), project.plannedEndDate);
    const end = dayjs(lastPlan).add(7, 'day');
    const total = Math.max(1, end.diff(start, 'day'));

    return sorted.map((m, i) => {
      const from = i === 0 ? start : dayjs(sorted[i - 1].plannedDate);
      const to = dayjs(m.plannedDate);
      const left = (from.diff(start, 'day') / total) * 100;
      const width = Math.max(3, (Math.max(4, to.diff(from, 'day')) / total) * 100);
      return { ...m, left, width, from: from.format('YYYY-MM-DD') };
    });
  }, [project]);

  const ticks = useMemo(() => {
    const start = dayjs(project.startDate);
    const lastPlan = project.milestones.reduce((acc, m) => (m.plannedDate > acc ? m.plannedDate : acc), project.plannedEndDate);
    const days = Math.max(1, dayjs(lastPlan).add(7, 'day').diff(start, 'day'));
    return Array.from({ length: 7 }, (_, i) => {
      const d = start.add(Math.round((days / 6) * i), 'day');
      return { label: d.format('MM/DD'), left: (i / 6) * 100 };
    });
  }, [project]);

  const completed = rows.filter((m) => m.status === 'completed').length;
  const delayed = rows.filter((m) => m.status === 'delayed').length;
  const inProgress = rows.filter((m) => m.status === 'in_progress').length;
  const shown = onlyRisk ? rows.filter((m) => m.status === 'delayed' || m.status === 'in_progress') : rows;

  const columns: ColumnsType<Milestone> = [
    {
      title: '里程碑',
      dataIndex: 'name',
      width: 240,
      render: (v: string, r) => (
        <div>
          <div style={{ fontWeight: 500 }}>{v}</div>
          <div style={{ fontSize: 11, color: 'var(--np-text-tertiary)' }}>{r.deliverable}</div>
        </div>
      ),
    },
    {
      title: '负责人',
      dataIndex: 'ownerId',
      width: 120,
      render: (v: string) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Avatar name={userName(v)} size={20} />
          {userName(v)}
        </span>
      ),
    },
    { title: '计划日期', dataIndex: 'plannedDate', width: 110, render: (v: string) => <span className="np-num">{v}</span> },
    {
      title: '实际完成',
      dataIndex: 'actualDate',
      width: 110,
      render: (v: string | null, r) => {
        if (!v) return <span style={{ color: 'var(--np-text-disabled)' }}>—</span>;
        const late = v > r.plannedDate;
        return (
          <span className="np-num" style={{ color: late ? 'var(--np-danger)' : 'var(--np-text-secondary)' }}>
            {v}
            {late && ` +${dayjs(v).diff(dayjs(r.plannedDate), 'day')}d`}
          </span>
        );
      },
    },
    {
      title: '进度',
      dataIndex: 'progress',
      width: 140,
      render: (v: number, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 66 }}>
            <Progress value={v} height={5} color={r.status === 'delayed' ? 'var(--np-danger)' : undefined} />
          </div>
          <span className="np-num" style={{ fontSize: 11.5 }}>
            {v}%
          </span>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 96,
      render: (v: Milestone['status']) => <StatusTag label={MS_STATUS[v].label} tone={MS_STATUS[v].tone} />,
    },
  ];

  return (
    <div className="np-page" style={{ paddingTop: 16 }}>
      <div className="np-grid-4" style={{ marginBottom: 16 }}>
        <div className="np-stat">
          <div className="np-stat-label">里程碑总数</div>
          <div className="np-stat-value">
            {rows.length}
            <small>个</small>
          </div>
          <div className="np-stat-foot">已完成 {completed} 个</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">进行中</div>
          <div className="np-stat-value">{inProgress}</div>
          <div className="np-stat-foot">按计划推进</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">已延期</div>
          <div className="np-stat-value" style={{ color: delayed > 0 ? 'var(--np-danger)' : undefined }}>
            {delayed}
          </div>
          <div className="np-stat-foot" style={{ color: delayed > 0 ? 'var(--np-danger)' : undefined }}>
            {delayed > 0 ? '需在周会说明原因' : '暂无延期'}
          </div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">计划完成率</div>
          <div className="np-stat-value">{Math.round((completed / Math.max(1, rows.length)) * 100)}%</div>
          <div className="np-stat-foot">截至 {formatDate('2026-10-19')}</div>
        </div>
      </div>

      <SectionCard
        title="里程碑计划"
        sub={`${project.startDate} → ${project.plannedEndDate}`}
        extra={
          <>
            <Segmented
              size="small"
              value={onlyRisk ? 'risk' : 'all'}
              onChange={(v) => setOnlyRisk(v === 'risk')}
              options={[
                { label: '全部', value: 'all' },
                { label: '进行中与延期', value: 'risk' },
              ]}
            />
            <Segmented
              size="small"
              value={view}
              onChange={(v) => setView(v as 'gantt' | 'table')}
              options={[
                { label: '甘特图', value: 'gantt' },
                { label: '列表', value: 'table' },
              ]}
            />
          </>
        }
        flush={view === 'table'}
      >
        {view === 'gantt' ? (
          <div>
            <div style={{ position: 'relative', height: 22, marginLeft: 260, marginBottom: 4 }}>
              {ticks.map((t) => (
                <span
                  key={t.label}
                  style={{
                    position: 'absolute',
                    left: `${t.left}%`,
                    transform: 'translateX(-50%)',
                    fontSize: 10.5,
                    color: 'var(--np-text-tertiary)',
                  }}
                >
                  {t.label}
                </span>
              ))}
            </div>

            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: 260,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  display: 'flex',
                  pointerEvents: 'none',
                }}
              >
                {ticks.map((t) => (
                  <div key={t.label} style={{ flex: 1, borderLeft: '1px dashed var(--np-border)' }} />
                ))}
              </div>

              {shown.map((m) => {
                const color =
                  m.status === 'completed'
                    ? 'var(--np-success)'
                    : m.status === 'delayed'
                      ? 'var(--np-danger)'
                      : m.status === 'in_progress'
                        ? 'var(--np-primary-500)'
                        : 'var(--np-border-strong)';
                return (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', height: 46, position: 'relative' }}>
                    <div style={{ width: 260, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, paddingRight: 16 }}>
                      <span
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 4,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: m.status === 'completed' ? 'var(--np-success)' : 'transparent',
                          border: m.status === 'completed' ? 'none' : `1.5px solid ${color}`,
                          flexShrink: 0,
                        }}
                      >
                        {m.status === 'completed' ? (
                          <CheckCircle2 size={11} color="#fff" />
                        ) : m.status === 'delayed' ? (
                          <AlertTriangle size={9} color={color} />
                        ) : m.status === 'in_progress' ? (
                          <Clock size={9} color={color} />
                        ) : (
                          <Circle size={5} color={color} />
                        )}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div className="np-truncate" style={{ fontSize: 12.5, fontWeight: 500 }} title={m.name}>
                          {m.name}
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)' }}>
                          {userName(m.ownerId)} · {m.plannedDate}
                        </div>
                      </div>
                    </div>

                    <div style={{ flex: 1, position: 'relative', height: '100%' }}>
                      <Tooltip
                        title={
                          <div style={{ fontSize: 11.5, lineHeight: 1.7 }}>
                            <div>{m.name}</div>
                            <div>交付物：{m.deliverable}</div>
                            <div>
                              {m.from} → {m.plannedDate}
                            </div>
                            <div>进度 {m.progress}%</div>
                          </div>
                        }
                      >
                        <div
                          style={{
                            position: 'absolute',
                            left: `${m.left}%`,
                            width: `${m.width}%`,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            height: 20,
                            borderRadius: 5,
                            background: `color-mix(in srgb, ${color} 16%, transparent)`,
                            border: `1px solid color-mix(in srgb, ${color} 45%, transparent)`,
                            overflow: 'hidden',
                            cursor: 'default',
                          }}
                        >
                          <div
                            style={{
                              width: `${m.progress}%`,
                              height: '100%',
                              background: `color-mix(in srgb, ${color} 55%, transparent)`,
                            }}
                          />
                          <span
                            style={{
                              position: 'absolute',
                              left: 6,
                              top: 0,
                              lineHeight: '20px',
                              fontSize: 10.5,
                              color: 'var(--np-text-primary)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {m.progress}%
                          </span>
                        </div>
                      </Tooltip>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <Table
            rowKey="id"
            size="middle"
            columns={columns}
            dataSource={shown}
            pagination={false}
            scroll={{ x: 780 }}
          />
        )}
      </SectionCard>

      {delayed > 0 && (
        <div style={{ marginTop: 16 }}>
          <SectionCard title="延期说明" extra={<StatusTag label={`${delayed} 个里程碑延期`} tone="danger" />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {rows
                .filter((m) => m.status === 'delayed')
                .map((m) => (
                  <div key={m.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <Flag size={14} color="var(--np-danger)" style={{ marginTop: 3, flexShrink: 0 }} />
                    <div style={{ fontSize: 12.5, lineHeight: 1.75, color: 'var(--np-text-secondary)' }}>
                      <b style={{ fontWeight: 500 }}>{m.name}</b> 计划 {m.plannedDate} 完成，当前进度 {m.progress}%。
                      主要卡点为{project.engine === 'unity' ? ' WebGL 包体压缩后仍超出首包限制' : ' 分包加载与首屏渲染竞态'}，
                      已与客户对齐顺延 {Math.max(3, 10 - m.progress / 10).toFixed(0)} 天，不影响整体上线窗口。
                    </div>
                  </div>
                ))}
            </div>
          </SectionCard>
        </div>
      )}

      <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
        <Button size="small">导出计划</Button>
        <Button size="small">同步到客户门户</Button>
      </div>
    </div>
  );
}
