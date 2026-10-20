import { useMemo, useState } from 'react';
import { Button, Segmented, Select, Tooltip } from 'antd';
import { AlertTriangle, CheckCircle2, HelpCircle, MinusCircle, Smartphone } from 'lucide-react';
import type { CompatCell } from '@/mock';
import { PageHeader, SectionCard } from '@/components/layout';
import { Progress, StatusTag } from '@/components/ui';
import { compatCases, compatDevices, compatMatrix, projects } from '@/mock';

const CELL_STYLE: Record<CompatCell['status'], { bg: string; color: string; label: string }> = {
  pass: { bg: 'rgba(23,178,106,.14)', color: 'var(--np-success)', label: '通过' },
  partial: { bg: 'rgba(247,144,9,.14)', color: 'var(--np-warning)', label: '部分通过' },
  fail: { bg: 'rgba(240,68,56,.14)', color: 'var(--np-danger)', label: '失败' },
  untested: { bg: 'var(--np-bg-subtle)', color: 'var(--np-text-disabled)', label: '未测' },
};

export default function CompatibilityPage() {
  const [tier, setTier] = useState<'all' | 'high' | 'mid' | 'low'>('all');
  const [projectId, setProjectId] = useState<string>('PRJ-2026-006');
  const [active, setActive] = useState<{ deviceId: string; caseKey: string } | null>(null);

  const devices = useMemo(() => (tier === 'all' ? compatDevices : compatDevices.filter((d) => d.tier === tier)), [tier]);

  const cellOf = (deviceId: string, caseKey: string) =>
    compatMatrix.find((c) => c.deviceId === deviceId && c.caseKey === caseKey);

  const stats = useMemo(() => {
    const cells = compatMatrix.filter((c) => devices.some((d) => d.id === c.deviceId));
    const total = cells.length;
    return {
      total,
      pass: cells.filter((c) => c.status === 'pass').length,
      partial: cells.filter((c) => c.status === 'partial').length,
      fail: cells.filter((c) => c.status === 'fail').length,
      untested: cells.filter((c) => c.status === 'untested').length,
      rate: cells.filter((c) => c.status === 'pass').length / Math.max(1, total),
    };
  }, [devices]);

  const failures = useMemo(
    () => compatMatrix.filter((c) => c.status === 'fail' && devices.some((d) => d.id === c.deviceId)),
    [devices],
  );

  const activeCell = active ? cellOf(active.deviceId, active.caseKey) : undefined;
  const activeDevice = active ? compatDevices.find((d) => d.id === active.deviceId) : undefined;
  const activeCase = active ? compatCases.find((c) => c.key === active.caseKey) : undefined;

  return (
    <div className="np-page">
      <PageHeader
        title="兼容性矩阵"
        desc={`${devices.length} 款机型 × ${compatCases.length} 个关键用例 · 覆盖率 ${Math.round(((stats.total - stats.untested) / Math.max(1, stats.total)) * 100)}%`}
        actions={
          <>
            <Select
              size="small"
              showSearch
              optionFilterProp="label"
              value={projectId}
              onChange={setProjectId}
              style={{ width: 168 }}
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
            />
            <Segmented
              size="small"
              value={tier}
              onChange={(v) => setTier(v as 'all' | 'high' | 'mid' | 'low')}
              options={[
                { label: '全部', value: 'all' },
                { label: '高端', value: 'high' },
                { label: '中端', value: 'mid' },
                { label: '低端', value: 'low' },
              ]}
            />
            <Button>导出报告</Button>
          </>
        }
      />

      <div className="np-grid-4" style={{ marginBottom: 16 }}>
        <div className="np-stat">
          <div className="np-stat-label">通过率</div>
          <div className="np-stat-value">{(stats.rate * 100).toFixed(1)}%</div>
          <div className="np-stat-foot">
            {stats.pass} / {stats.total} 组合
          </div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">失败用例</div>
          <div className="np-stat-value" style={{ color: stats.fail > 0 ? 'var(--np-danger)' : undefined }}>
            {stats.fail}
          </div>
          <div className="np-stat-foot">全部已关联缺陷单</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">部分通过</div>
          <div className="np-stat-value" style={{ color: 'var(--np-warning)' }}>{stats.partial}</div>
          <div className="np-stat-foot">存在降级但可用</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">未覆盖</div>
          <div className="np-stat-value">{stats.untested}</div>
          <div className="np-stat-foot">需在本轮补齐</div>
        </div>
      </div>

      <SectionCard title="测试矩阵" sub="点击格子查看详情" bodyStyle={{ overflowX: 'auto' }}>
        <table className="np-matrix" style={{ minWidth: 940 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', minWidth: 190 }}>机型</th>
              {compatCases.map((c) => (
                <th key={c.key} style={{ minWidth: 62 }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.id}>
                <td>
                  <div style={{ fontSize: 12.5 }}>{d.name}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)' }}>
                    {d.os} · {d.chip} · {d.share}%
                  </div>
                </td>
                {compatCases.map((c) => {
                  const cell = cellOf(d.id, c.key);
                  const s = CELL_STYLE[cell?.status ?? 'untested'];
                  const isActive = active?.deviceId === d.id && active?.caseKey === c.key;
                  return (
                    <td
                      key={c.key}
                      onClick={() => setActive({ deviceId: d.id, caseKey: c.key })}
                      style={{ padding: 3 }}
                    >
                      <Tooltip title={cell?.note ?? `${d.name} · ${c.label} · ${s.label}`}>
                        <div
                          style={{
                            height: 30,
                            borderRadius: 4,
                            background: s.bg,
                            color: s.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            outline: isActive ? `1.5px solid ${s.color}` : 'none',
                          }}
                        >
                          {cell?.status === 'pass' ? (
                            <CheckCircle2 size={13} />
                          ) : cell?.status === 'fail' ? (
                            <AlertTriangle size={13} />
                          ) : cell?.status === 'partial' ? (
                            <MinusCircle size={13} />
                          ) : (
                            <HelpCircle size={12} style={{ opacity: 0.5 }} />
                          )}
                        </div>
                      </Tooltip>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', gap: 16, marginTop: 14, fontSize: 11.5, color: 'var(--np-text-tertiary)' }}>
          {(['pass', 'partial', 'fail', 'untested'] as CompatCell['status'][]).map((k) => (
            <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: CELL_STYLE[k].bg, border: `1px solid ${CELL_STYLE[k].color}` }} />
              {CELL_STYLE[k].label}
            </span>
          ))}
        </div>
      </SectionCard>

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <SectionCard
          title="选中项详情"
          sub={activeDevice && activeCase ? `${activeDevice.name} · ${activeCase.label}` : '点击矩阵中的格子'}
        >
          {active && activeCell ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 12,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: CELL_STYLE[activeCell.status].bg,
                    color: CELL_STYLE[activeCell.status].color,
                  }}
                >
                  {CELL_STYLE[activeCell.status].label}
                </span>
                {activeCell.bugId && <span className="np-mono-sm" style={{ fontSize: 11.5 }}>{activeCell.bugId}</span>}
              </div>
              <div style={{ fontSize: 12.5, lineHeight: 1.8, color: 'var(--np-text-secondary)' }}>
                {activeCell.note ?? '该组合测试通过，无异常记录。'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 11.5 }}>
                <div>
                  <div style={{ color: 'var(--np-text-tertiary)' }}>系统 / 芯片</div>
                  <div>
                    {activeDevice?.os} · {activeDevice?.chip}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--np-text-tertiary)' }}>分辨率 / 档位</div>
                  <div>
                    {activeDevice?.resolution} · {activeDevice?.tier}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 12.5, color: 'var(--np-text-tertiary)', padding: '18px 0', textAlign: 'center' }}>
              点击上方矩阵任意格子查看用例详情与关联缺陷
            </div>
          )}
        </SectionCard>

        <SectionCard title="失败用例" sub={`${failures.length} 个`}>
          {failures.length === 0 ? (
            <div style={{ fontSize: 12.5, color: 'var(--np-text-tertiary)', padding: '18px 0', textAlign: 'center' }}>
              当前筛选下没有失败用例
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {failures.slice(0, 6).map((f) => {
                const d = compatDevices.find((x) => x.id === f.deviceId);
                const c = compatCases.find((x) => x.key === f.caseKey);
                return (
                  <div key={`${f.deviceId}-${f.caseKey}`} style={{ display: 'flex', gap: 8 }}>
                    <Smartphone size={13} style={{ color: 'var(--np-danger)', marginTop: 3, flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5 }}>
                        {d?.name} · {c?.label}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--np-text-tertiary)' }}>{f.note}</div>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                      <StatusTag label={f.bugId?.replace('BUG-', 'B-') ?? ''} tone="danger" dot={false} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      <div style={{ marginTop: 16 }}>
        <SectionCard title="机型覆盖度" sub="按市场占比排序">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px 28px' }}>
            {compatDevices.map((d) => {
              const cells = compatMatrix.filter((c) => c.deviceId === d.id);
              const pass = cells.filter((c) => c.status === 'pass').length;
              return (
                <div key={d.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 3 }}>
                    <span>
                      {d.name}
                      <span style={{ color: 'var(--np-text-tertiary)' }}> · 市占 {d.share}%</span>
                    </span>
                    <span className="np-num" style={{ color: 'var(--np-text-tertiary)' }}>
                      {pass}/{cells.length}
                    </span>
                  </div>
                  <Progress value={(pass / Math.max(1, cells.length)) * 100} height={4} />
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
