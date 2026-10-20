import { useMemo } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Dropdown, Tabs } from 'antd';
import { Download, MoreHorizontal, PauseCircle, Pencil, Rocket, TestTube2 } from 'lucide-react';
import { ENGINES, HEALTH, PROJECT_STATUS, CHANNELS } from '@/types/enums';
import { StatusTag } from '@/components/ui';
import { builds, projects, releases, userName } from '@/mock';
import { formatMoney } from '@/utils/format';

const TABS = [
  { key: '', label: '概览' },
  { key: 'milestones', label: '里程碑' },
  { key: 'requirements', label: '需求' },
  { key: 'board', label: '看板' },
  { key: 'bugs', label: '缺陷' },
  { key: 'builds', label: '构建' },
  { key: 'releases', label: '发布' },
  { key: 'members', label: '成员' },
  { key: 'docs', label: '文档' },
];

export default function ProjectLayout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const project = projects.find((p) => p.id === id);

  const activeKey = useMemo(() => {
    const seg = pathname.split('/')[3] ?? '';
    return TABS.some((t) => t.key === seg) ? seg : '';
  }, [pathname]);

  const stats = useMemo(() => {
    if (!project) return { builds: 0, online: 0, latest: '' };
    const b = builds.filter((x) => x.projectId === project.id);
    const online = releases.filter((r) => r.projectId === project.id && r.status === 'online');
    return { builds: b.length, online: new Set(online.map((r) => r.version)).size, latest: online[0]?.version ?? '—' };
  }, [project]);

  if (!project) {
    return (
      <div className="np-page">
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--np-text-tertiary)' }}>
          项目不存在或已被归档
          <div style={{ marginTop: 12 }}>
            <Button onClick={() => navigate('/projects')}>返回项目列表</Button>
          </div>
        </div>
      </div>
    );
  }

  const hue = (project.code.charCodeAt(0) + project.code.length * 7) % 360;

  return (
    <div>
      <div
        style={{
          background: 'var(--np-bg-surface)',
          borderBottom: '1px solid var(--np-border)',
          padding: '18px 24px 0',
        }}
      >
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              background: `linear-gradient(135deg, hsl(${hue} 52% 88%), hsl(${(hue + 48) % 360} 58% 78%))`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 600,
              color: `hsl(${hue} 42% 30%)`,
              flexShrink: 0,
              letterSpacing: '0.04em',
            }}
          >
            {project.code.slice(0, 3)}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 19, fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>{project.name}</h1>
              <StatusTag label={PROJECT_STATUS[project.status].label} tone={PROJECT_STATUS[project.status].tone} />
              <StatusTag label={HEALTH[project.health].label} tone={HEALTH[project.health].tone} />
              <span style={{ fontSize: 11.5, color: 'var(--np-text-tertiary)' }}>
                {project.id} · {ENGINES[project.engine].label} {project.engineVersion}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 18,
                marginTop: 9,
                fontSize: 12,
                color: 'var(--np-text-tertiary)',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <span>客户：{clientShort(project.clientId)}</span>
              <span>PM：{userName(project.managerId)}</span>
              <span>
                {project.startDate} → {project.plannedEndDate}
              </span>
              <span>合同额 {formatMoney(project.contractAmount)}</span>
              <span>当前版本 {project.currentVersion}</span>
              <span>{project.memberIds.length} 人参与</span>
              <span style={{ display: 'flex', gap: 3 }}>
                {project.platforms.map((c) => (
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
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <Button icon={<Pencil size={13} />}>编辑</Button>
            <Button icon={<TestTube2 size={13} />}>提测</Button>
            <Button type="primary" icon={<Rocket size={13} />}>
              发起发布
            </Button>
            <Dropdown
              menu={{
                items: [
                  { key: 'export', icon: <Download size={13} />, label: '导出周报' },
                  { key: 'pause', icon: <PauseCircle size={13} />, label: '暂停项目' },
                ],
              }}
            >
              <Button icon={<MoreHorizontal size={14} />} />
            </Dropdown>
          </div>
        </div>

        <Tabs
          activeKey={activeKey}
          onChange={(key) => navigate(key ? `/projects/${project.id}/${key}` : `/projects/${project.id}`)}
          items={TABS.map((t) => ({
            key: t.key,
            label:
              t.key === 'builds' ? (
                <span>{t.label} <span style={{ color: 'var(--np-text-tertiary)', fontSize: 11 }}>{stats.builds}</span></span>
              ) : t.key === 'releases' ? (
                <span>{t.label} <span style={{ color: 'var(--np-text-tertiary)', fontSize: 11 }}>{stats.online}</span></span>
              ) : (
                t.label
              ),
          }))}
          style={{ marginTop: 6, marginBottom: 0 }}
          tabBarStyle={{ marginBottom: 0 }}
        />
      </div>

      <Outlet context={{ project }} />
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
