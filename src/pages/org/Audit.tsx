import { useEffect, useState } from 'react';
import { Download, Filter } from 'lucide-react';
import { Avatar, Button, StatusPill, Tag } from '@/components/ui/core';
import { PageHeader, SearchInput } from '@/components/ui/page';
import { DataTable, Pagination, type Column } from '@/components/ui/data';
import { mockApi } from '@/mock/api';
import { ACTION_LABELS } from '@/utils/constants';
import { fmtTime } from '@/utils/format';
import type { AuditLog } from '@/types';
import { downloadCsv } from '@/utils/download';
import { toast } from 'sonner';

export default function Audit() {
  const [rows, setRows] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [loading, setLoading] = useState(true);
  const [kw, setKw] = useState('');

  useEffect(() => {
    setLoading(true);
    mockApi.org.audits(page, pageSize, kw).then((r) => {
      setRows(r.list);
      setTotal(r.total);
      setLoading(false);
    });
  }, [page, pageSize, kw]);

  const columns: Column<AuditLog>[] = [
    { key: 'time', title: '时间', width: 168, render: (r) => <span className="font-mono text-[11.5px]">{fmtTime(r.time)}</span> },
    {
      key: 'operator',
      title: '操作人',
      width: 148,
      render: (r) => (
        <div className="flex items-center gap-2">
          <Avatar name={r.operator} color="#3D7DFF" size={20} />
          <span className="text-[12px]">{r.operator}</span>
        </div>
      ),
    },
    { key: 'action', title: '操作', width: 128, render: (r) => <Tag tone="blue">{r.action}</Tag> },
    { key: 'target', title: '对象', render: (r) => <span className="font-mono text-[11px] text-[var(--text-2)]">{r.target}</span> },
    { key: 'ip', title: 'IP 地址', width: 132, render: (r) => <span className="font-mono text-[11px] text-[var(--text-3)]">{r.ip}</span> },
    { key: 'result', title: '结果', width: 88, render: (r) => <StatusPill label={r.result === 'success' ? '成功' : '失败'} tone={r.result === 'success' ? 'green' : 'red'} /> },
  ];

  return (
    <div className="page">
      <PageHeader
        title="审计日志"
        desc="记录组织内全部关键操作，日志不可删除，保留 3 年"
        actions={
          <Button
            icon={<Download size={14} />}
            onClick={() => {
              downloadCsv('审计日志', ['时间', '操作人', '操作', '对象', 'IP', '结果'], rows.map((r) => [fmtTime(r.time), r.operator, r.action, r.target, r.ip, r.result === 'success' ? '成功' : '失败']));
              toast.success('审计日志已导出');
            }}
          >
            导出
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-4 gap-3">
        {[
          ['日志总量', total.toLocaleString()],
          ['今日操作', '86'],
          ['失败操作', '12'],
          ['涉及成员', '24'],
        ].map(([k, v]) => (
          <div key={k} className="card px-5 py-4">
            <div className="text-[11.5px] text-[var(--text-3)]">{k}</div>
            <div className="num mt-1 text-[20px] font-semibold">{v}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="border-b border-[var(--stroke)] px-5 py-4">
          <div className="flex items-center gap-3">
            <SearchInput value={kw} onChange={(v) => { setKw(v); setPage(1); }} placeholder="搜索操作人 / 操作类型 / 对象编号" className="w-[340px]" />
            <div className="ml-auto flex items-center gap-1.5 text-[11px] text-[var(--text-3)]">
              <Filter size={12} /> 展示全部操作类型
            </div>
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          rowKey={(r) => r.id}
          footer={<Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} onPageSize={(s) => { setPageSize(s); setPage(1); }} />}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {Object.entries(ACTION_LABELS).slice(0, 8).map(([k, v]) => (
          <span key={k} className="tag">{v}</span>
        ))}
        <span className="tag">等 10 类操作</span>
      </div>
    </div>
  );
}
