import { useMemo, useState } from 'react';
import { Button, Drawer, Input, Select, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { FileWarning, Layers, Search, Sparkles } from 'lucide-react';
import type { Asset } from '@/types/models';
import { ASSET_TYPE } from '@/types/enums';
import { PageHeader, SectionCard } from '@/components/layout';
import { EmptyState, Progress, StatusTag } from '@/components/ui';
import { assetGroups, assets, projectName, projects, unusedAssets } from '@/mock';
import { formatInt, formatSize, fromNow } from '@/utils/format';

const STATUS_MAP = {
  in_use: { label: '使用中', tone: 'success' as const },
  unused: { label: '未引用', tone: 'danger' as const },
  pending_opt: { label: '待优化', tone: 'warning' as const },
};

export default function AssetsPage() {
  const [keyword, setKeyword] = useState('');
  const [projectId, setProjectId] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [type, setType] = useState<string | undefined>();
  const [active, setActive] = useState<Asset | null>(null);

  const list = useMemo(
    () =>
      assets
        .filter((a) => (projectId ? a.projectId === projectId : true))
        .filter((a) => (status ? a.status === status : true))
        .filter((a) => (type ? a.type === type : true))
        .filter((a) => (keyword ? a.name.includes(keyword) || a.path.includes(keyword) : true))
        .sort((a, b) => b.size - a.size),
    [projectId, status, type, keyword],
  );

  const scope = useMemo(() => (projectId ? assets.filter((a) => a.projectId === projectId) : assets), [projectId]);
  const totalSize = scope.reduce((s, a) => s + a.size, 0);
  const rawSize = scope.reduce((s, a) => s + a.rawSize, 0);
  const unusedSize = scope.filter((a) => a.status === 'unused').reduce((s, a) => s + a.size, 0);

  const groupUsage = useMemo(
    () =>
      assetGroups.map((g) => {
        const items = scope.filter((a) => a.group === g.key);
        const sizeMB = items.reduce((s, a) => s + a.size, 0) / 1024 / 1024;
        return { ...g, sizeMB, count: items.length, ratio: sizeMB / g.budget };
      }),
    [scope],
  );

  const columns: ColumnsType<Asset> = [
    {
      title: '资源',
      dataIndex: 'name',
      render: (v: string, r) => (
        <div style={{ minWidth: 0 }}>
          <div className="np-truncate" style={{ fontSize: 12.5, cursor: 'pointer' }} onClick={() => setActive(r)}>
            {v}
          </div>
          <div className="np-mono-sm np-truncate" style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)' }}>
            {r.path}
          </div>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 84,
      render: (v: Asset['type']) => <StatusTag label={ASSET_TYPE[v].label} tone={ASSET_TYPE[v].tone} dot={false} />,
    },
    {
      title: '项目',
      dataIndex: 'projectId',
      width: 130,
      render: (v: string) => <span style={{ fontSize: 11.5 }}>{projectName(v)}</span>,
    },
    {
      title: '压缩',
      dataIndex: 'compression',
      width: 96,
      render: (v: string, r) => (
        <span className="np-mono-sm" style={{ fontSize: 11 }}>
          {v === 'none' ? <span style={{ color: 'var(--np-warning)' }}>未压缩</span> : `${v} · ${formatSize(r.size)}`}
        </span>
      ),
    },
    {
      title: '原始 → 实际',
      width: 148,
      render: (_: unknown, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="np-num" style={{ fontSize: 11, color: 'var(--np-text-tertiary)' }}>{formatSize(r.rawSize)}</span>
          <span style={{ color: 'var(--np-text-disabled)', fontSize: 10 }}>→</span>
          <span className="np-num" style={{ fontSize: 11.5 }}>{formatSize(r.size)}</span>
        </div>
      ),
    },
    {
      title: '引用',
      dataIndex: 'refCount',
      width: 76,
      align: 'right',
      render: (v: number) => (
        <span className="np-num" style={{ fontSize: 11.5, color: v === 0 ? 'var(--np-danger)' : undefined }}>
          {v}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 92,
      render: (v: Asset['status']) => <StatusTag label={STATUS_MAP[v].label} tone={STATUS_MAP[v].tone} />,
    },
    {
      title: '更新',
      dataIndex: 'updatedAt',
      width: 88,
      render: (v: string) => <span style={{ fontSize: 11, color: 'var(--np-text-tertiary)' }}>{fromNow(v)}</span>,
    },
  ];

  return (
    <div className="np-page">
      <PageHeader
        title="资源管理"
        desc={`${formatInt(scope.length)} 个资源 · 实际 ${formatSize(totalSize)} · 原始 ${formatSize(rawSize)}`}
        actions={
          <>
            <Button icon={<Sparkles size={13} />}>一键优化</Button>
            <Button type="primary">上传资源</Button>
          </>
        }
      />

      <div className="np-grid-4" style={{ marginBottom: 16 }}>
        <div className="np-stat">
          <div className="np-stat-label">资源总量</div>
          <div className="np-stat-value" style={{ fontSize: 22 }}>{formatSize(totalSize)}</div>
          <div className="np-stat-foot">压缩率 {((1 - totalSize / Math.max(1, rawSize)) * 100).toFixed(1)}%</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">未引用资源</div>
          <div className="np-stat-value" style={{ color: unusedSize > 0 ? 'var(--np-danger)' : undefined }}>
            {formatInt(scope.filter((a) => a.status === 'unused').length)}
          </div>
          <div className="np-stat-foot">可释放 {formatSize(unusedSize)}</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">待优化</div>
          <div className="np-stat-value">{formatInt(scope.filter((a) => a.status === 'pending_opt').length)}</div>
          <div className="np-stat-foot">未压缩或压缩率偏低</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">大图告警</div>
          <div className="np-stat-value">{scope.filter((a) => (a.width ?? 0) >= 2048).length}</div>
          <div className="np-stat-foot">≥ 2048px，建议降分辨率</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
        <SectionCard
          title="资源列表"
          sub={`${list.length} 个`}
          extra={
            <>
              <Input
                size="small"
                allowClear
                prefix={<Search size={13} style={{ color: 'var(--np-text-tertiary)' }} />}
                placeholder="搜索路径或文件名"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                style={{ width: 180 }}
              />
              <Select
                size="small"
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="项目"
                value={projectId}
                onChange={setProjectId}
                style={{ width: 148 }}
                options={projects.map((p) => ({ value: p.id, label: p.name }))}
              />
              <Select
                size="small"
                allowClear
                placeholder="类型"
                value={type}
                onChange={setType}
                style={{ width: 96 }}
                options={Object.entries(ASSET_TYPE).map(([k, v]) => ({ value: k, label: v.label }))}
              />
              <Select
                size="small"
                allowClear
                placeholder="状态"
                value={status}
                onChange={setStatus}
                style={{ width: 96 }}
                options={Object.entries(STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label }))}
              />
            </>
          }
          bodyStyle={{ paddingTop: 8 }}
        >
          {list.length === 0 ? (
            <EmptyState title="没有匹配的资源" desc="调整筛选条件后再试" />
          ) : (
            <Table
              rowKey="id"
              size="middle"
              columns={columns}
              dataSource={list}
              pagination={{ pageSize: 12, size: 'small', showTotal: (t) => `共 ${t} 个资源` }}
              scroll={{ x: 980 }}
              onRow={(r) => ({ onClick: () => setActive(r), style: { cursor: 'pointer' } })}
            />
          )}
        </SectionCard>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionCard title="分组占用" sub="对比预算">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {groupUsage.map((g) => (
                <div key={g.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
                    <span>
                      {g.label}
                      <span style={{ color: 'var(--np-text-tertiary)' }}> · {g.count}</span>
                    </span>
                    <span className="np-num" style={{ color: g.ratio > 1 ? 'var(--np-danger)' : 'var(--np-text-tertiary)' }}>
                      {g.sizeMB.toFixed(1)} / {g.budget} MB
                    </span>
                  </div>
                  <Progress value={Math.min(100, g.ratio * 100)} height={5} color={g.ratio > 1 ? 'var(--np-danger)' : undefined} />
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="可清理资源" sub={`${unusedAssets.length} 个`} extra={<FileWarning size={14} style={{ color: 'var(--np-warning)' }} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {unusedAssets.slice(0, 6).map((a) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5 }}>
                  <span className="np-truncate" style={{ flex: 1 }} title={a.path}>
                    {a.name}
                  </span>
                  <span className="np-num" style={{ color: 'var(--np-text-tertiary)' }}>{formatSize(a.size)}</span>
                </div>
              ))}
              {unusedAssets.length === 0 && (
                <div style={{ fontSize: 12, color: 'var(--np-text-tertiary)' }}>没有未引用资源，很干净</div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="纹理规范" extra={<Layers size={14} style={{ color: 'var(--np-text-tertiary)' }} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11.5, color: 'var(--np-text-secondary)' }}>
              <div>· UI 图集统一 2048，单图不超过 512</div>
              <div>· 场景背景使用 WEBP，质量 80</div>
              <div>· 角色贴图使用 ASTC 6×6</div>
              <div>· 音频统一 MP3 96kbps</div>
              <div>· 字体仅保留实际用到的字重</div>
            </div>
          </SectionCard>
        </div>
      </div>

      <Drawer
        open={!!active}
        width={520}
        onClose={() => setActive(null)}
        title={active && <span className="np-mono-sm">{active.name}</span>}
      >
        {active && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5 }}>
              <Meta k="路径" v={active.path} mono />
              <Meta k="所属项目" v={projectName(active.projectId)} />
              <Meta k="格式 / 类型" v={`${active.format} · ${ASSET_TYPE[active.type].label}`} />
              <Meta k="尺寸" v={active.width ? `${active.width}×${active.height}` : '—'} />
              <Meta k="原始大小" v={formatSize(active.rawSize)} />
              <Meta k="实际大小" v={formatSize(active.size)} />
              <Meta k="压缩方式" v={active.compression} />
              <Meta k="引用次数" v={String(active.refCount)} />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>引用位置</div>
              {active.refs.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--np-danger)' }}>该资源未被任何场景引用，可安全删除</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {active.refs.map((r, i) => (
                    <div key={i} className="np-mono-sm" style={{ fontSize: 11.5, color: 'var(--np-text-secondary)' }}>
                      {r.scene} · {r.node}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {active.license && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>授权信息</div>
                <div style={{ fontSize: 12, color: 'var(--np-text-secondary)' }}>
                  {active.license.type}
                  {active.license.expireAt && <span style={{ color: 'var(--np-warning)' }}> · 到期 {active.license.expireAt}</span>}
                </div>
              </div>
            )}

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>压缩效果</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <Progress value={(1 - active.size / Math.max(1, active.rawSize)) * 100} height={6} />
                </div>
                <span className="np-num" style={{ fontSize: 11.5 }}>
                  节省 {formatSize(active.rawSize - active.size)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function Meta({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 11, color: 'var(--np-text-tertiary)', marginBottom: 2 }}>{k}</div>
      <div className={mono ? 'np-mono-sm np-truncate' : undefined} style={{ fontSize: 12 }} title={v}>
        {v}
      </div>
    </div>
  );
}
