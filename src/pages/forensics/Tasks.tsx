import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MonitorPlay, Radio } from 'lucide-react';
import { Button, HashText, StatusPill, Tag } from '@/components/ui/core';
import { PageHeader, SearchInput } from '@/components/ui/page';
import { DataTable, Pagination, type Column } from '@/components/ui/data';
import { mockApi } from '@/mock/api';
import { fmtSize, fmtTime } from '@/utils/format';
import type { ForensicsTask } from '@/types';
import type { Tone } from '@/utils/constants';

const ST: Record<ForensicsTask['status'], { label: string; tone: Tone }> = {
  queued: { label: '排队中', tone: 'gray' },
  running: { label: '取证中', tone: 'amber' },
  success: { label: '已完成', tone: 'green' },
  failed: { label: '失败', tone: 'red' },
};

const TYPE_LABEL: Record<ForensicsTask['type'], string> = {
  webpage: '网页取证',
  screen: '录屏取证',
  mobile: '移动端取证',
  app: '应用取证',
};

export default function ForensicsTasks() {
  const nav = useNavigate();
  const [rows, setRows] = useState<ForensicsTask[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [kw, setKw] = useState('');

  useEffect(() => {
    setLoading(true);
    mockApi.forensics.tasks(page, pageSize).then((r) => {
      setRows(kw ? r.list.filter((t) => t.name.includes(kw) || t.target.includes(kw) || t.id.includes(kw)) : r.list);
      setTotal(r.total);
      setLoading(false);
    });
  }, [page, pageSize, kw]);

  const columns: Column<ForensicsTask>[] = [
    { key: 'id', title: '证据编号', width: 168, render: (r) => <span className="font-mono text-[11.5px] text-[var(--text-2)]">{r.id}</span> },
    {
      key: 'name',
      title: '取证名称 / 目标',
      render: (r) => (
        <div className="py-2">
          <div className="truncate text-[12.5px] text-[var(--text-1)]">{r.name}</div>
          <div className="mt-0.5 truncate font-mono text-[10.5px] text-[var(--text-3)]">{r.target}</div>
        </div>
      ),
    },
    { key: 'type', title: '类型', width: 104, render: (r) => <Tag tone="blue">{TYPE_LABEL[r.type]}</Tag> },
    { key: 'region', title: '区域 / 设备', width: 124, render: (r) => <span className="text-[11.5px]">{r.region} · {r.device === 'pc' ? 'PC' : '移动'}</span> },
    { key: 'status', title: '状态', width: 92, render: (r) => <StatusPill label={ST[r.status].label} tone={ST[r.status].tone} /> },
    { key: 'duration', title: '耗时', width: 76, align: 'right', render: (r) => <span className="num text-[11.5px]">{r.duration}s</span> },
    { key: 'size', title: '文件大小', width: 92, align: 'right', render: (r) => <span className="num text-[11.5px]">{fmtSize(r.fileSize)}</span> },
    { key: 'hash', title: '证据哈希', width: 150, render: (r) => <HashText value={r.evidenceHash} head={6} tail={4} /> },
    { key: 'time', title: '创建时间', width: 150, render: (r) => <span className="font-mono text-[11.5px]">{fmtTime(r.createdAt)}</span> },
  ];

  return (
    <div className="page">
      <PageHeader
        title="取证任务"
        desc="网页、录屏、移动端三类取证任务的执行记录，所有证据自动计算哈希并固化时间戳"
        actions={
          <>
            <Button icon={<MonitorPlay size={14} />} onClick={() => nav('/forensics/web')}>网页取证</Button>
            <Button variant="primary" icon={<Radio size={14} />} onClick={() => nav('/forensics/web')}>新建取证</Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-4 gap-3">
        {[
          { k: '取证总数', v: total, c: '#3D7DFF' },
          { k: '本月新增', v: 18, c: '#22D3EE' },
          { k: '平均耗时', v: '46s', c: '#2DD4A7' },
          { k: '成功率', v: '94.6%', c: '#F5B544' },
        ].map((i) => (
          <div key={i.k} className="card flex items-center justify-between px-5 py-4">
            <div>
              <div className="text-[11.5px] text-[var(--text-3)]">{i.k}</div>
              <div className="num mt-1 text-[20px] font-semibold leading-none">{typeof i.v === 'number' ? i.v.toLocaleString() : i.v}</div>
            </div>
            <span className="h-8 w-[3px] rounded-full" style={{ background: i.c }} />
          </div>
        ))}
      </div>

      <div className="card">
        <div className="border-b border-[var(--stroke)] px-5 py-4">
          <SearchInput value={kw} onChange={setKw} placeholder="搜索取证名称 / 目标地址 / 证据编号" className="w-[340px]" />
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          rowKey={(r) => r.id}
          footer={<Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} onPageSize={(s) => { setPageSize(s); setPage(1); }} />}
        />
      </div>
    </div>
  );
}
