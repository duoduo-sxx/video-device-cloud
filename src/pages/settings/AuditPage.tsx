import { useMemo, useState } from 'react';
import { Button, Input, Select, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Download, Search, ShieldCheck } from 'lucide-react';
import type { AuditLog } from '@/types/models';
import { PageHeader, SectionCard } from '@/components/layout';
import { Avatar, EmptyState, StatusTag } from '@/components/ui';
import { auditLogs, userName } from '@/mock';
import { formatFullDateTime, fromNow } from '@/utils/format';

const ACTION_TONE = (action: string) => {
  if (action.includes('删除')) return 'danger' as const;
  if (action.includes('发布') || action.includes('创建')) return 'success' as const;
  if (action.includes('修改') || action.includes('编辑')) return 'info' as const;
  return 'default' as const;
};

export default function AuditPage() {
  const [keyword, setKeyword] = useState('');
  const [result, setResult] = useState<string | undefined>();
  const [targetType, setTargetType] = useState<string | undefined>();

  const types = useMemo(() => [...new Set(auditLogs.map((l) => l.targetType))], []);

  const list = useMemo(
    () =>
      auditLogs
        .filter((l) => (result ? l.result === result : true))
        .filter((l) => (targetType ? l.targetType === targetType : true))
        .filter((l) => (keyword ? l.targetName.includes(keyword) || l.action.includes(keyword) || userName(l.userId).includes(keyword) : true))
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [keyword, result, targetType],
  );

  const failed = auditLogs.filter((l) => l.result === 'failed');
  const todayCount = auditLogs.filter((l) => l.createdAt >= '2026-10-19').length;

  const columns: ColumnsType<AuditLog> = [
    {
      title: '操作人',
      dataIndex: 'userId',
      width: 140,
      render: (v: string) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <Avatar name={userName(v)} size={22} />
          <span style={{ fontSize: 12 }}>{userName(v)}</span>
        </span>
      ),
    },
    {
      title: '操作',
      dataIndex: 'action',
      width: 168,
      render: (v: string) => <StatusTag label={v} tone={ACTION_TONE(v)} dot={false} />,
    },
    {
      title: '对象',
      dataIndex: 'targetName',
      render: (v: string, r) => (
        <div>
          <div style={{ fontSize: 12.5 }}>{v}</div>
          <div style={{ fontSize: 10.5, color: 'var(--np-text-tertiary)' }}>{r.targetType}</div>
        </div>
      ),
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      width: 128,
      render: (v: string) => <span className="np-mono-sm" style={{ fontSize: 11 }}>{v}</span>,
    },
    {
      title: '结果',
      dataIndex: 'result',
      width: 88,
      render: (v: AuditLog['result']) => (
        <StatusTag label={v === 'success' ? '成功' : '失败'} tone={v === 'success' ? 'success' : 'danger'} />
      ),
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 158,
      render: (v: string) => (
        <Tooltip title={fromNow(v)}>
          <span style={{ fontSize: 11.5, color: 'var(--np-text-tertiary)' }}>{formatFullDateTime(v)}</span>
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="np-page">
      <PageHeader
        title="操作日志"
        desc={`共 ${auditLogs.length} 条记录 · 今日 ${todayCount} 条 · 失败 ${failed.length} 条 · 保留 180 天`}
        actions={
          <>
            <Button icon={<ShieldCheck size={13} />}>合规导出</Button>
            <Button icon={<Download size={13} />}>下载 CSV</Button>
          </>
        }
      />

      <div className="np-grid-4" style={{ marginBottom: 16 }}>
        <div className="np-stat">
          <div className="np-stat-label">今日操作</div>
          <div className="np-stat-value">{todayCount}</div>
          <div className="np-stat-foot">涉及 {new Set(auditLogs.filter((l) => l.createdAt >= '2026-10-19').map((l) => l.userId)).size} 名成员</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">失败操作</div>
          <div className="np-stat-value" style={{ color: failed.length > 0 ? 'var(--np-warning)' : undefined }}>
            {failed.length}
          </div>
          <div className="np-stat-foot">多为权限不足</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">涉及对象类型</div>
          <div className="np-stat-value">{types.length}</div>
          <div className="np-stat-foot">{types.slice(0, 2).join('、')} 等</div>
        </div>
        <div className="np-stat">
          <div className="np-stat-label">保留策略</div>
          <div className="np-stat-value" style={{ fontSize: 20 }}>180<small>天</small></div>
          <div className="np-stat-foot">到期自动归档</div>
        </div>
      </div>

      <SectionCard
        title="日志明细"
        sub={`${list.length} 条`}
        extra={
          <>
            <Input
              size="small"
              allowClear
              prefix={<Search size={13} style={{ color: 'var(--np-text-tertiary)' }} />}
              placeholder="搜索操作人或对象"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ width: 190 }}
            />
            <Select
              size="small"
              allowClear
              placeholder="对象类型"
              value={targetType}
              onChange={setTargetType}
              style={{ width: 120 }}
              options={types.map((t) => ({ value: t, label: t }))}
            />
            <Select
              size="small"
              allowClear
              placeholder="结果"
              value={result}
              onChange={setResult}
              style={{ width: 96 }}
              options={[
                { value: 'success', label: '成功' },
                { value: 'failed', label: '失败' },
              ]}
            />
          </>
        }
        bodyStyle={{ paddingTop: 8 }}
      >
        {list.length === 0 ? (
          <EmptyState title="没有匹配的日志" desc="调整筛选条件后再试" />
        ) : (
          <Table
            rowKey="id"
            size="middle"
            columns={columns}
            dataSource={list}
            pagination={{ pageSize: 15, size: 'small', showTotal: (t) => `共 ${t} 条记录` }}
            scroll={{ x: 900 }}
          />
        )}
      </SectionCard>
    </div>
  );
}
