import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Segmented, Select, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { LayoutGrid, List, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Avatar, Progress, StatusTag } from '@/components/ui';
import { ENGINES, HEALTH, PROJECT_STATUS, CHANNELS, CHANNEL_IDS } from '@/types/enums';
import type { Project } from '@/types/models';
import { projects, userName } from '@/mock';
import { formatMoney } from '@/utils/format';

const STATUS_OPTIONS = Object.entries(PROJECT_STATUS).map(([k, v]) => ({ value: k, label: v.label }));
const ENGINE_OPTIONS = Object.entries(ENGINES).map(([k, v]) => ({ value: k, label: v.label }));
const HEALTH_OPTIONS = Object.entries(HEALTH).map(([k, v]) => ({ value: k, label: v.label }));
const PLATFORM_OPTIONS = CHANNEL_IDS.map((c) => ({ value: c, label: CHANNELS[c].name }));

function Thumb({ project, height = 108 }: { project: Project; height?: number }) {
  const seed = project.code.charCodeAt(0) + project.code.length * 7;
  const hue = seed % 360;
  return (
    <div
      style={{
        height,
        background: `linear-gradient(135deg, hsl(${hue} 52% 92%), hsl(${(hue + 48) % 360} 58% 84%))`,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 20% 80%, rgba(255,255,255,.6) 0%, transparent 42%), radial-gradient(circle at 82% 22%, rgba(255,255,255,.45) 0%, transparent 38%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(16,24,40,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(16,24,40,.05) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      <span
        style={{
          position: 'relative',
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: '0.06em',
          color: `hsl(${hue} 42% 32%)`,
          opacity: 0.72,
        }}
      >
        {project.code.replace(/_/g, ' ')}
      </span>
    </div>
  );
}

export default function ProjectListPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<'table' | 'card'>('table');
  const [kw, setKw] = useState('');
  const [statuses, setStatuses] = useState<string[]>([]);
  const [engines, setEngines] = useState<string[]>([]);
  const [healths, setHealths] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const filtered = useMemo(
    () =>
      projects.filter((p) => {
        if (kw && !`${p.name}${p.id}${p.code}`.toLowerCase().includes(kw.toLowerCase())) return false;
        if (statuses.length && !statuses.includes(p.status)) return false;
        if (engines.length && !engines.includes(p.engine)) return false;
        if (healths.length && !healths.includes(p.health)) return false;
        if (platforms.length && !p.platforms.some((x) => platforms.includes(x))) return false;
        return true;
      }),
    [kw, statuses, engines, healths, platforms],
  );

  const columns: ColumnsType<Project> = [
    {
      title: '项目',
      dataIndex: 'name',
      width: 260,
      fixed: 'left',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: 'linear-gradient(135deg, var(--np-primary-400), var(--np-primary-700))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 11,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {r.code.slice(0, 2)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>{r.name}</div>
            <div style={{ fontSize: 11, color: 'var(--np-text-tertiary)', display: 'flex', gap: 6 }}>
              <span>{r.id}</span>
              <span>·</span>
              <span>{ENGINES[r.engine].label}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '客户',
      dataIndex: 'clientId',
      width: 120,
      render: (v: string) => <span style={{ fontSize: 12.5 }}>{clientShort(v)}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 96,
      render: (v: Project['status']) => <StatusTag label={PROJECT_STATUS[v].label} tone={PROJECT_STATUS[v].tone} />,
    },
    {
      title: '健康度',
      dataIndex: 'health',
      width: 82,
      render: (v: Project['health']) => <StatusTag label={HEALTH[v].label} tone={HEALTH[v].tone} />,
    },
    {
      title: '当前里程碑',
      dataIndex: 'milestones',
      width: 170,
      render: (_, r) => {
        const cur = r.milestones.find((m) => m.status === 'in_progress' || m.status === 'delayed') ?? r.milestones[r.milestones.length - 1];
        if (!cur) return '—';
        return (
          <div style={{ fontSize: 12, lineHeight: 1.4 }}>
            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>
              {cur.name}
            </div>
            <div style={{ fontSize: 11, color: cur.status === 'delayed' ? 'var(--np-danger)' : 'var(--np-text-tertiary)' }}>
              {cur.status === 'delayed' ? '已逾期' : `计划 ${cur.plannedDate.slice(5)}`}
            </div>
          </div>
        );
      },
    },
    {
      title: '进度',
      dataIndex: 'progress',
      width: 128,
      render: (v: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Progress value={v} height={4} />
          <span className="np-num" style={{ fontSize: 11.5, width: 32, textAlign: 'right' }}>
            {v}%
          </span>
        </div>
      ),
    },
    {
      title: '目标平台',
      dataIndex: 'platforms',
      width: 130,
      render: (v: Project['platforms']) => (
        <div style={{ display: 'flex', gap: 3 }}>
          {v.slice(0, 3).map((c) => (
            <Tooltip key={c} title={CHANNELS[c].name}>
              <span
                style={{
                  fontSize: 10,
                  padding: '1px 5px',
                  borderRadius: 3,
                  background: 'var(--np-bg-subtle)',
                  color: 'var(--np-text-secondary)',
                  whiteSpace: 'nowrap',
                }}
              >
                {CHANNELS[c].short}
              </span>
            </Tooltip>
          ))}
          {v.length > 3 && (
            <span style={{ fontSize: 10, color: 'var(--np-text-tertiary)', alignSelf: 'center' }}>+{v.length - 3}</span>
          )}
        </div>
      ),
    },
    {
      title: '负责人',
      dataIndex: 'managerId',
      width: 100,
      render: (v: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Avatar name={userName(v)} size={20} />
          <span style={{ fontSize: 12 }}>{userName(v)}</span>
        </div>
      ),
    },
    {
      title: '合同额',
      dataIndex: 'contractAmount',
      width: 110,
      align: 'right',
      render: (v: number) => <span className="np-num" style={{ fontSize: 12.5 }}>{formatMoney(v)}</span>,
    },
    {
      title: '交付日期',
      dataIndex: 'plannedEndDate',
      width: 108,
      render: (v: string, r) => {
        const d = r.daysLeft;
        const color =
          r.status === 'online' || r.status === 'maintenance'
            ? 'var(--np-text-tertiary)'
            : d < 0
              ? 'var(--np-danger)'
              : d <= 7
                ? 'var(--np-warning)'
                : 'var(--np-text-secondary)';
        return (
          <div style={{ fontSize: 12, color }}>
            <div className="np-num">{v}</div>
            {d < 0 && <div style={{ fontSize: 10.5 }}>逾期 {Math.abs(d)} 天</div>}
            {d >= 0 && d <= 7 && <div style={{ fontSize: 10.5 }}>剩 {d} 天</div>}
          </div>
        );
      },
    },
  ];

  return (
    <div className="np-page">
      <PageHeader
        title="项目列表"
        desc={`共 ${projects.length} 个项目，${projects.filter((p) => p.status === 'in_progress').length} 个在研、${projects.filter((p) => p.health !== 'healthy').length} 个需要关注`}
        actions={
          <>
            <Segmented
              value={view}
              onChange={(v) => setView(v as 'table' | 'card')}
              options={[
                { value: 'table', icon: <List size={13} /> },
                { value: 'card', icon: <LayoutGrid size={13} /> },
              ]}
            />
            <Button type="primary" icon={<Plus size={14} />}>
              新建项目
            </Button>
          </>
        }
      />

      <div
        style={{
          background: 'var(--np-bg-surface)',
          border: '1px solid var(--np-border)',
          borderRadius: 12,
          padding: '14px 16px',
          marginBottom: 16,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <Input
          allowClear
          value={kw}
          onChange={(e) => setKw(e.target.value)}
          placeholder="搜索项目名、编号、代号"
          prefix={<Search size={14} style={{ color: 'var(--np-text-tertiary)' }} />}
          style={{ width: 240 }}
        />
        <Select
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="状态"
          value={statuses}
          onChange={setStatuses}
          options={STATUS_OPTIONS}
          style={{ minWidth: 140 }}
        />
        <Select
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="引擎"
          value={engines}
          onChange={setEngines}
          options={ENGINE_OPTIONS}
          style={{ minWidth: 140 }}
        />
        <Select
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="健康度"
          value={healths}
          onChange={setHealths}
          options={HEALTH_OPTIONS}
          style={{ minWidth: 120 }}
        />
        <Select
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="目标平台"
          value={platforms}
          onChange={setPlatforms}
          options={PLATFORM_OPTIONS}
          style={{ minWidth: 150 }}
        />
        <Button
          icon={<SlidersHorizontal size={13} />}
          onClick={() => {
            setKw('');
            setStatuses([]);
            setEngines([]);
            setHealths([]);
            setPlatforms([]);
          }}
        >
          重置
        </Button>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--np-text-tertiary)' }}>
          筛选出 {filtered.length} 个
        </div>
      </div>

      {view === 'table' ? (
        <div
          style={{
            background: 'var(--np-bg-surface)',
            border: '1px solid var(--np-border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <Table
            rowKey="id"
            size="middle"
            columns={columns}
            dataSource={filtered}
            scroll={{ x: 1360 }}
            onRow={(r) => ({ onClick: () => navigate(`/projects/${r.id}`), style: { cursor: 'pointer' } })}
            pagination={{
              current: page,
              pageSize,
              total: filtered.length,
              showSizeChanger: true,
              pageSizeOptions: [12, 20, 50],
              showTotal: (t) => `共 ${t} 个项目`,
              onChange: (p, s) => {
                setPage(p);
                setPageSize(s);
              },
            }}
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.slice((page - 1) * pageSize, page * pageSize).map((p) => (
            <div
              key={p.id}
              onClick={() => navigate(`/projects/${p.id}`)}
              style={{
                background: 'var(--np-bg-surface)',
                border: '1px solid var(--np-border)',
                borderRadius: 12,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'border-color .15s, transform .15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--np-primary-200)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--np-border)';
              }}
            >
              <div style={{ position: 'relative' }}>
                <Thumb project={p} />
                <div style={{ position: 'absolute', top: 10, left: 10 }}>
                  <StatusTag label={PROJECT_STATUS[p.status].label} tone={PROJECT_STATUS[p.status].tone} />
                </div>
                {p.health !== 'healthy' && (
                  <div style={{ position: 'absolute', top: 10, right: 10 }}>
                    <StatusTag label={HEALTH[p.health].label} tone={HEALTH[p.health].tone} />
                  </div>
                )}
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--np-text-tertiary)', marginTop: 2 }}>
                      {p.id} · {clientShort(p.clientId)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                  <Progress value={p.progress} height={4} />
                  <span className="np-num" style={{ fontSize: 11.5 }}>{p.progress}%</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {p.platforms.map((c) => (
                      <span
                        key={c}
                        style={{
                          fontSize: 10,
                          padding: '1px 5px',
                          borderRadius: 3,
                          background: 'var(--np-bg-subtle)',
                          color: 'var(--np-text-secondary)',
                        }}
                      >
                        {CHANNELS[c].short}
                      </span>
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: p.daysLeft < 0 ? 'var(--np-danger)' : 'var(--np-text-tertiary)' }}>
                    {p.status === 'online' || p.status === 'maintenance'
                      ? '已交付'
                      : p.daysLeft < 0
                        ? `逾期 ${Math.abs(p.daysLeft)} 天`
                        : `剩 ${p.daysLeft} 天`}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--np-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Avatar name={userName(p.managerId)} size={20} />
                    <span style={{ fontSize: 11.5, color: 'var(--np-text-secondary)' }}>{userName(p.managerId)}</span>
                  </div>
                  <span className="np-num" style={{ fontSize: 12, color: 'var(--np-text-secondary)' }}>
                    {formatMoney(p.contractAmount)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function clientShort(clientId: string): string {
  const map: Record<string, string> = {
    'CLI-001': '云跃网络',
    'CLI-002': '星合互动',
    'CLI-003': '趣游数字',
    'CLI-004': '幻境文化',
    'CLI-005': '天穹在线',
    'CLI-006': '熊猫互娱',
    'CLI-007': '海豚互娱',
    'CLI-008': '数感信息',
    'CLI-009': 'Rebecca Games',
    'CLI-010': 'Joybox',
    'CLI-011': '两点半',
    'CLI-012': '橘子洲头',
  };
  return map[clientId] ?? clientId;
}
