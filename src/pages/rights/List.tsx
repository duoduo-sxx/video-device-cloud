import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ShieldCheck } from 'lucide-react';
import { Avatar, Button, HashText, StatusPill, Tag } from '@/components/ui/core';
import { PageHeader, SearchInput } from '@/components/ui/page';
import { DataTable, Pagination, Tabs, type Column } from '@/components/ui/data';
import { mockApi } from '@/mock/api';
import { RIGHTS_CATEGORY, RIGHTS_STATUS } from '@/utils/constants';
import { daysLeft, fmtDate } from '@/utils/format';
import type { RightsCategory, RightsRecord } from '@/types';
import { cn } from '@/utils/cn';

export default function RightsList() {
  const nav = useNavigate();
  const [tab, setTab] = useState<string>('all');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [rows, setRows] = useState<RightsRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [all, setAll] = useState<RightsRecord[]>([]);

  useEffect(() => {
    mockApi.rights.list({ page: 1, pageSize: 1000 }).then((r) => setAll(r.list));
  }, []);

  useEffect(() => {
    setLoading(true);
    mockApi
      .rights.list({ page, pageSize, keyword, category: tab as RightsCategory | 'all' })
      .then((r) => {
        setRows(r.list);
        setTotal(r.total);
        setLoading(false);
      });
  }, [page, pageSize, keyword, tab]);

  const countOf = (k: string) => (k === 'all' ? all.length : all.filter((r) => r.category === k).length);

  const columns: Column<RightsRecord>[] = useMemo(
    () => [
      {
        key: 'id',
        title: '登记号',
        width: 148,
        render: (r) => <span className="font-mono text-[11.5px] text-[var(--text-2)]">{r.id}</span>,
      },
      {
        key: 'title',
        title: '作品名称',
        render: (r) => (
          <div className="py-2">
            <div className="truncate text-[12.5px] text-[var(--text-1)]">{r.title}</div>
            <div className="mt-0.5 text-[11px] text-[var(--text-3)]">{r.subCategory} · {r.rightScope.slice(0, 2).join('、')}</div>
          </div>
        ),
      },
      {
        key: 'cat',
        title: '类型',
        width: 92,
        render: (r) => <Tag tone={RIGHTS_CATEGORY[r.category].tone}>{RIGHTS_CATEGORY[r.category].short}</Tag>,
      },
      {
        key: 'owner',
        title: '权利人',
        width: 172,
        render: (r) => (
          <div className="flex items-center gap-2">
            <Avatar name={r.owner.name} color={r.owner.type === 'org' ? '#8B5CF6' : '#22D3EE'} size={22} />
            <div className="min-w-0">
              <div className="truncate text-[12px] text-[var(--text-1)]">{r.owner.name}</div>
              <div className="text-[10.5px] text-[var(--text-3)]">{r.coOwners.length ? `${r.coOwners.length} 名共有人` : '独有'}</div>
            </div>
          </div>
        ),
      },
      {
        key: 'ev',
        title: '关联存证',
        width: 88,
        align: 'center',
        render: (r) => <span className="num text-[12px] text-[var(--text-2)]">{r.evidenceIds.length}</span>,
      },
      {
        key: 'status',
        title: '状态',
        width: 96,
        render: (r) => <StatusPill label={RIGHTS_STATUS[r.status].label} tone={RIGHTS_STATUS[r.status].tone} />,
      },
      {
        key: 'reg',
        title: '登记日期',
        width: 110,
        render: (r) => <span className="font-mono text-[11.5px]">{r.registeredAt ? fmtDate(r.registeredAt) : '—'}</span>,
      },
      {
        key: 'valid',
        title: '有效期至',
        width: 116,
        render: (r) => {
          const d = daysLeft(r.validTo);
          return (
            <span className={cn('font-mono text-[11.5px]', d < 90 && d > 0 ? 'text-[var(--warn)]' : 'text-[var(--text-2)]')}>
              {r.validTo}
            </span>
          );
        },
      },
      {
        key: 'op',
        title: '操作',
        width: 84,
        render: (r) => (
          <button
            className="text-[11.5px] text-[var(--brand-2)] hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              nav(`/rights/${r.id}`);
            }}
          >
            查看
          </button>
        ),
      },
    ],
    [nav],
  );

  return (
    <div className="page">
      <PageHeader
        title="权属管理"
        desc="全部作品的权属登记记录，支持按类型筛选、查看证书与发起转让"
        actions={
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => nav('/rights/register')}>
            权属登记
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-4 gap-3">
        {[
          { k: '已登记', v: 3172, c: '#22D3EE', d: '本月新增 46 项' },
          { k: '审核中', v: 12, c: '#F5B544', d: '平均 1 个工作日' },
          { k: '有异议', v: 3, c: '#FF5C7A', d: '需补充举证材料' },
          { k: '即将到期', v: 8, c: '#8B5CF6', d: '90 天内到期' },
        ].map((i) => (
          <div key={i.k} className="card flex items-center gap-3 px-5 py-4">
            <ShieldCheck size={18} style={{ color: i.c }} />
            <div>
              <div className="text-[11.5px] text-[var(--text-3)]">{i.k}</div>
              <div className="num mt-0.5 text-[20px] font-semibold leading-none">{i.v.toLocaleString()}</div>
            </div>
            <span className="ml-auto text-[10.5px] text-[var(--text-3)]">{i.d}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="px-5 pt-4">
          <Tabs
            active={tab}
            onChange={(k) => { setTab(k); setPage(1); }}
            items={[
              { key: 'all', label: '全部', count: countOf('all') },
              ...(Object.keys(RIGHTS_CATEGORY) as RightsCategory[]).map((k) => ({
                key: k,
                label: RIGHTS_CATEGORY[k].label,
                count: countOf(k),
              })),
            ]}
          />
          <div className="py-4">
            <SearchInput value={keyword} onChange={(v) => { setKeyword(v); setPage(1); }} placeholder="搜索作品名称 / 登记号 / 权利人" className="w-[300px]" />
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          rowKey={(r) => r.id}
          onRowClick={(r) => nav(`/rights/${r.id}`)}
          footer={<Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} onPageSize={(s) => { setPageSize(s); setPage(1); }} />}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="card card-pad">
          <div className="card-title mb-2">权属类型分布</div>
          <div className="space-y-2">
            {(Object.keys(RIGHTS_CATEGORY) as RightsCategory[]).map((k) => {
              const c = all.filter((r) => r.category === k).length;
              return (
                <div key={k} className="flex items-center gap-3">
                  <span className="w-[72px] text-[11.5px] text-[var(--text-3)]">{RIGHTS_CATEGORY[k].label}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/6">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#3D7DFF] to-[#22D3EE]" style={{ width: `${(c / Math.max(1, all.length)) * 100}%` }} />
                  </div>
                  <span className="num w-8 text-right text-[11px] text-[var(--text-2)]">{c}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card card-pad col-span-2">
          <div className="card-title mb-2">登记号与证书</div>
          <p className="text-[11.5px] leading-relaxed text-[var(--text-3)]">
            权属登记号格式为 <span className="font-mono text-[var(--brand-2)]">RR-YYYY-NNNNNN</span>，例如 {all[0]?.id}；证书编号格式为{' '}
            <span className="font-mono text-[var(--brand-2)]">XH-RR-YYYY-NNNNNN</span>，例如 {all[0]?.certificateNo ?? 'XH-RR-2026-003200'}。
            两者均可在链上通过 <HashText value={all[0]?.txHash ?? '0x0000'} head={8} tail={6} /> 查询。
          </p>
        </div>
      </div>
    </div>
  );
}
