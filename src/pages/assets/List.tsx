import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Plus } from 'lucide-react';
import { Button, Progress, StatusPill, Tag } from '@/components/ui/core';
import { PageHeader, SearchInput } from '@/components/ui/page';
import { DataTable, Pagination, type Column } from '@/components/ui/data';
import { mockApi } from '@/mock/api';
import { fmtDate } from '@/utils/format';
import type { DataAsset } from '@/types';
import type { Tone } from '@/utils/constants';

const CAT: Record<DataAsset['category'], string> = {
  text: '文本',
  image: '图像',
  audio: '音频',
  video: '视频',
  structured: '结构化数据',
};

const RS: Record<DataAsset['rightStatus'], { label: string; tone: Tone }> = {
  registered: { label: '已确权', tone: 'green' },
  reviewing: { label: '审核中', tone: 'amber' },
  unregistered: { label: '未登记', tone: 'gray' },
};

export default function AssetsList() {
  const nav = useNavigate();
  const [rows, setRows] = useState<DataAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [kw, setKw] = useState('');

  useEffect(() => {
    setLoading(true);
    mockApi.assets.list(page, pageSize).then((r) => {
      setRows(kw ? r.list.filter((x) => x.name.includes(kw) || x.id.includes(kw)) : r.list);
      setTotal(r.total);
      setLoading(false);
    });
  }, [page, pageSize, kw]);

  const columns: Column<DataAsset>[] = useMemo(
    () => [
      { key: 'id', title: '资产编号', width: 118, render: (r) => <span className="font-mono text-[11.5px] text-[var(--text-2)]">{r.id}</span> },
      {
        key: 'name',
        title: '资产名称',
        render: (r) => (
          <div className="py-2">
            <div className="truncate text-[12.5px] text-[var(--text-1)]">{r.name}</div>
            <div className="mt-0.5 truncate text-[10.5px] text-[var(--text-3)]">{r.source}</div>
          </div>
        ),
      },
      { key: 'cat', title: '类型', width: 100, render: (r) => <Tag tone="blue">{CAT[r.category]}</Tag> },
      { key: 'scale', title: '规模', width: 112, align: 'right', render: (r) => <span className="num text-[11.5px]">{r.scale}</span> },
      { key: 'vol', title: '存储量', width: 92, align: 'right', render: (r) => <span className="num text-[11.5px] text-[var(--text-3)]">{r.volume}</span> },
      { key: 'freq', title: '更新频率', width: 104, render: (r) => <span className="text-[11.5px]">{r.updateFreq}</span> },
      { key: 'rs', title: '权属状态', width: 96, render: (r) => <StatusPill label={RS[r.rightStatus].label} tone={RS[r.rightStatus].tone} /> },
      { key: 'cert', title: '登记编号', width: 148, render: (r) => <span className="font-mono text-[11px] text-[var(--brand-2)]">{r.certNo ?? '—'}</span> },
      { key: 'time', title: '登记时间', width: 108, render: (r) => <span className="font-mono text-[11.5px]">{fmtDate(r.createdAt)}</span> },
    ],
    [],
  );

  return (
    <div className="page">
      <PageHeader
        title="数据资产台账"
        desc="已登记的数据资产、权属状态与授权使用情况一目了然"
        actions={
          <>
            <Button onClick={() => nav('/data-assets/licenses')}>授权管理</Button>
            <Button variant="primary" icon={<Plus size={14} />} onClick={() => nav('/data-assets/register')}>资产登记</Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-4 gap-3">
        {[
          { k: '资产总数', v: total, c: '#3D7DFF', i: Database },
          { k: '已确权', v: 29, c: '#2DD4A7', i: Database },
          { k: '授权进行中', v: 18, c: '#22D3EE', i: Database },
          { k: '本月调用', v: 12846, c: '#8B5CF6', i: Database },
        ].map((i) => (
          <div key={i.k} className="card px-5 py-4">
            <div className="text-[11.5px] text-[var(--text-3)]">{i.k}</div>
            <div className="num mt-1 text-[22px] font-semibold leading-none" style={{ color: i.c }}>
              {i.v.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="border-b border-[var(--stroke)] px-5 py-4">
          <div className="flex items-center gap-3">
            <SearchInput value={kw} onChange={setKw} placeholder="搜索资产名称 / 编号" className="w-[300px]" />
            <div className="ml-auto flex items-center gap-3 text-[11px] text-[var(--text-3)]">
              <span>数据来源合法性声明已归档</span>
              <div className="w-[120px]"><Progress value={78} height={4} /></div>
              <span>授权覆盖率 78%</span>
            </div>
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          rowKey={(r) => r.id}
          onRowClick={(r) => nav(`/data-assets/${r.id}`)}
          footer={<Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} onPageSize={(s) => { setPageSize(s); setPage(1); }} />}
        />
      </div>
    </div>
  );
}
