import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Download, FileStack, Filter, Plus, RotateCcw } from 'lucide-react';
import { Button, Checkbox, HashText, StatusPill, Tag } from '@/components/ui/core';
import { FilterBar, PageHeader, SearchInput } from '@/components/ui/page';
import { DataTable, Pagination, Segmented, type Column } from '@/components/ui/data';
import { Select } from '@/components/ui/core';
import { mockApi } from '@/mock/api';
import { EVIDENCE_STATUS, EVIDENCE_TYPE } from '@/utils/constants';
import { fmtSize, fmtTime, shortHash } from '@/utils/format';
import type { Evidence, EvidenceStatus, EvidenceType } from '@/types';
import { toast } from 'sonner';
import { downloadCsv } from '@/utils/download';

const RANGE_LABEL: Record<string, string> = { '7d': '近 7 天', '30d': '近 30 天', '90d': '近 90 天', all: '全部时间' };

export default function EvidenceList() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [keyword, setKeyword] = useState(params.get('kw') ?? '');
  const [type, setType] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [source, setSource] = useState<string>('all');
  const [range, setRange] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [rows, setRows] = useState<Evidence[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);

  const load = async () => {
    setLoading(true);
    const res = await mockApi.evidence.list({
      page,
      pageSize,
      keyword,
      types: type === 'all' ? [] : [type as EvidenceType],
      status: status === 'all' ? [] : [status as EvidenceStatus],
      source: source === 'all' ? '' : source,
      range: range as '7d' | '30d' | '90d' | 'all',
    });
    setRows(res.list);
    setTotal(res.total);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, keyword, type, status, source, range]);

  const allChecked = rows.length > 0 && rows.every((r) => selected.includes(r.id));

  const columns: Column<Evidence>[] = useMemo(
    () => [
      {
        key: 'sel',
        title: (
          <Checkbox
            checked={allChecked}
            onChange={(v) => setSelected(v ? rows.map((r) => r.id) : [])}
          />
        ),
        width: 44,
        render: (r) => (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={selected.includes(r.id)}
              onChange={(v) => setSelected(v ? [...selected, r.id] : selected.filter((x) => x !== r.id))}
            />
          </div>
        ),
      },
      {
        key: 'id',
        title: '存证编号',
        width: 172,
        render: (r) => <span className="font-mono text-[11.5px] text-[var(--text-2)]">{r.id}</span>,
      },
      {
        key: 'title',
        title: '标题 / 文件',
        render: (r) => (
          <div className="min-w-0 py-2">
            <div className="truncate text-[12.5px] text-[var(--text-1)]">{r.title}</div>
            <div className="mt-0.5 truncate text-[11px] text-[var(--text-3)]">{r.fileName} · {fmtSize(r.fileSize)}</div>
          </div>
        ),
      },
      {
        key: 'type',
        title: '类型',
        width: 84,
        render: (r) => <Tag tone={EVIDENCE_TYPE[r.type].tone}>{EVIDENCE_TYPE[r.type].label}</Tag>,
      },
      {
        key: 'hash',
        title: '数字指纹',
        width: 156,
        render: (r) => <HashText value={r.hash} />,
      },
      {
        key: 'status',
        title: '状态',
        width: 96,
        render: (r) => <StatusPill label={EVIDENCE_STATUS[r.status].label} tone={EVIDENCE_STATUS[r.status].tone} />,
      },
      {
        key: 'height',
        title: '区块高度',
        width: 108,
        render: (r) => (
          <span className="font-mono text-[11.5px] text-[var(--brand-2)]">#{r.blockHeight.toLocaleString()}</span>
        ),
      },
      {
        key: 'createdAt',
        title: '创建时间',
        width: 152,
        render: (r) => <span className="font-mono text-[11.5px]">{fmtTime(r.createdAt)}</span>,
      },
      {
        key: 'op',
        title: '操作',
        width: 100,
        render: (r) => (
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <button className="text-[11.5px] text-[var(--brand-2)] hover:underline" onClick={() => nav(`/evidence/${r.id}`)}>
              详情
            </button>
            <button
              className="text-[11.5px] text-[var(--text-3)] hover:text-[var(--text-1)]"
              onClick={() => toast.success(`证书 ${r.certificateNo ?? r.id} 已下载`)}
            >
              证书
            </button>
          </div>
        ),
      },
    ],
    [rows, selected, allChecked, nav],
  );

  const reset = () => {
    setKeyword('');
    setType('all');
    setStatus('all');
    setSource('all');
    setRange('all');
    setPage(1);
  };

  return (
    <div className="page">
      <PageHeader
        title="存证记录"
        desc="全部已上链的电子数据存证，可按类型、状态与时间检索，支持导出与批量下载证书"
        actions={
          <>
            <Button
              icon={<Download size={14} />}
              onClick={() => {
                downloadCsv(
                  '存证记录',
                  ['存证编号', '标题', '类型', '文件名', '哈希', '状态', '区块高度', '创建时间'],
                  rows.map((r) => [r.id, r.title, EVIDENCE_TYPE[r.type].label, r.fileName, r.hash, EVIDENCE_STATUS[r.status].label, r.blockHeight, fmtTime(r.createdAt)]),
                );
                toast.success('已导出当前页记录');
              }}
            >
              导出
            </Button>
            <Button variant="primary" icon={<Plus size={14} />} onClick={() => nav('/evidence/create')}>
              快速存证
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-4 gap-3">
        {[
          { k: '全部存证', v: total, s: '条', c: '#3D7DFF' },
          { k: '本月新增', v: 1204, s: '条', c: '#22D3EE' },
          { k: '上链确认率', v: '99.2', s: '%', c: '#2DD4A7' },
          { k: '失败待重试', v: 19, s: '条', c: '#FF5C7A' },
        ].map((i) => (
          <div key={i.k} className="card flex items-center justify-between px-5 py-4">
            <div>
              <div className="text-[11.5px] text-[var(--text-3)]">{i.k}</div>
              <div className="num mt-1 text-[22px] font-semibold leading-none">
                {typeof i.v === 'number' ? i.v.toLocaleString() : i.v}
                <span className="ml-1 text-[11px] font-normal text-[var(--text-3)]">{i.s}</span>
              </div>
            </div>
            <span className="h-8 w-[3px] rounded-full" style={{ background: i.c }} />
          </div>
        ))}
      </div>

      <div className="card">
        <div className="border-b border-[var(--stroke)] px-5 py-4">
          <FilterBar>
            <SearchInput value={keyword} onChange={(v) => { setKeyword(v); setPage(1); }} placeholder="搜索标题 / 编号 / 哈希 / 文件名" className="w-[300px]" />
            <Select
              value={type}
              onChange={(v) => { setType(v); setPage(1); }}
              className="w-[122px]"
              options={[{ value: 'all', label: '全部类型' }, ...Object.entries(EVIDENCE_TYPE).map(([k, v]) => ({ value: k, label: v.label }))]}
            />
            <Select
              value={status}
              onChange={(v) => { setStatus(v); setPage(1); }}
              className="w-[122px]"
              options={[{ value: 'all', label: '全部状态' }, ...Object.entries(EVIDENCE_STATUS).map(([k, v]) => ({ value: k, label: v.label }))]}
            />
            <Select
              value={source}
              onChange={(v) => { setSource(v); setPage(1); }}
              className="w-[118px]"
              options={[
                { value: 'all', label: '全部来源' },
                { value: 'web', label: '网页端' },
                { value: 'api', label: 'API 接口' },
                { value: 'batch', label: '批量上传' },
                { value: 'cli', label: '命令行' },
              ]}
            />
            <Segmented
              value={range}
              onChange={(v) => { setRange(v); setPage(1); }}
              items={[
                { key: '7d', label: '7 天' },
                { key: '30d', label: '30 天' },
                { key: '90d', label: '90 天' },
                { key: 'all', label: '全部' },
              ]}
            />
            <Button size="sm" icon={<RotateCcw size={12} />} onClick={reset}>
              重置
            </Button>
            <div className="ml-auto flex items-center gap-1.5 text-[11.5px] text-[var(--text-3)]">
              <Filter size={12} />
              {RANGE_LABEL[range]} · 共 {total} 条
            </div>
          </FilterBar>

          {selected.length > 0 && (
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-[rgba(61,125,255,.28)] bg-[rgba(61,125,255,.07)] px-3.5 py-2">
              <span className="text-[12px] text-[var(--text-1)]">已选择 {selected.length} 条</span>
              <div className="ml-auto flex gap-2">
                <Button size="xs" onClick={() => nav('/forensics/packages')}>加入证据包</Button>
                <Button size="xs" onClick={() => toast.success(`已开始打包下载 ${selected.length} 份证书`)}>批量下载证书</Button>
                <Button size="xs" onClick={() => setSelected([])}>取消选择</Button>
              </div>
            </div>
          )}
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          rowKey={(r) => r.id}
          onRowClick={(r) => nav(`/evidence/${r.id}`)}
          empty={
            <div className="py-16 text-center">
              <FileStack size={30} className="mx-auto text-[var(--text-3)]" />
              <div className="mt-3 text-[13px] text-[var(--text-2)]">没有符合条件的存证记录</div>
              <div className="mt-1 text-[11.5px] text-[var(--text-3)]">调整筛选条件，或立即为你的作品创建第一条存证</div>
              <Button variant="primary" size="sm" className="mt-4" onClick={() => nav('/evidence/create')}>
                立即存证
              </Button>
            </div>
          }
          footer={<Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} onPageSize={(s) => { setPageSize(s); setPage(1); }} />}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="card card-pad">
          <div className="card-title mb-2">存证编号规则</div>
          <p className="text-[11.5px] leading-relaxed text-[var(--text-3)]">
            格式为 <span className="font-mono text-[var(--brand-2)]">EV-YYYYMMDD-NNNN</span>，其中日期为存证创建日期，
            后四位为当日流水号。凭此编号可在「哈希核验」中查询链上记录。
          </p>
        </div>
        <div className="card card-pad">
          <div className="card-title mb-2">哈希与时间戳</div>
          <p className="text-[11.5px] leading-relaxed text-[var(--text-3)]">
            文件哈希采用 SHA-256 计算，示例 <span className="font-mono text-[var(--brand-2)]">{shortHash('0x7f3a9c2e41b8d05a6c9e2f7b3d8a1c4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c', 10, 6)}</span>。
            上链时间以区块时间戳为准，精确到秒。
          </p>
        </div>
      </div>
    </div>
  );
}
