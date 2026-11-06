import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileWarning, Gavel, MessagesSquare, ShieldX } from 'lucide-react';
import { Button, HashText, StatusPill, Tag, Textarea } from '@/components/ui/core';
import { PageHeader } from '@/components/ui/page';
import { DataTable, Timeline, type Column } from '@/components/ui/data';
import { Drawer, Empty } from '@/components/ui/overlay';
import { mockApi } from '@/mock/api';
import { fmtSize, fmtTime } from '@/utils/format';
import type { DisputeCase } from '@/types';
import type { Tone } from '@/utils/constants';
import { toast } from 'sonner';

const ST: Record<DisputeCase['status'], { label: string; tone: Tone }> = {
  pending: { label: '待受理', tone: 'gray' },
  hearing: { label: '审理中', tone: 'amber' },
  mediated: { label: '已调解', tone: 'green' },
  rejected: { label: '已驳回', tone: 'red' },
  judged: { label: '已裁决', tone: 'violet' },
};

export default function RightsDisputes() {
  const nav = useNavigate();
  const [rows, setRows] = useState<DisputeCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<DisputeCase | null>(null);
  const [opinion, setOpinion] = useState('');

  useEffect(() => {
    mockApi.org.disputes().then((r) => {
      setRows(r);
      setLoading(false);
    });
  }, []);

  const columns: Column<DisputeCase>[] = [
    { key: 'id', title: '异议编号', width: 132, render: (r) => <span className="font-mono text-[11.5px] text-[var(--text-2)]">{r.id}</span> },
    {
      key: 'title',
      title: '被异议权属',
      render: (r) => (
        <div className="py-2">
          <div className="truncate text-[12.5px] text-[var(--text-1)]">{r.rightsTitle}</div>
          <div className="mt-0.5 font-mono text-[10.5px] text-[var(--text-3)]">{r.rightsId}</div>
        </div>
      ),
    },
    { key: 'claimant', title: '异议人', width: 190, render: (r) => <span className="text-[12px]">{r.claimant}</span> },
    {
      key: 'reason',
      title: '异议理由',
      render: (r) => <span className="line-clamp-1 text-[11.5px] text-[var(--text-3)]">{r.reason}</span>,
    },
    { key: 'status', title: '状态', width: 96, render: (r) => <StatusPill label={ST[r.status].label} tone={ST[r.status].tone} /> },
    { key: 'time', title: '提起时间', width: 152, render: (r) => <span className="font-mono text-[11.5px]">{fmtTime(r.createdAt)}</span> },
    {
      key: 'op',
      title: '操作',
      width: 92,
      render: (r) => (
        <button className="text-[11.5px] text-[var(--brand-2)] hover:underline" onClick={(e) => { e.stopPropagation(); setOpen(r); }}>
          处理
        </button>
      ),
    },
  ];

  const stats = [
    { k: '异议总数', v: rows.length, c: '#3D7DFF', icon: FileWarning },
    { k: '审理中', v: rows.filter((r) => r.status === 'hearing').length, c: '#F5B544', icon: MessagesSquare },
    { k: '已调解', v: rows.filter((r) => r.status === 'mediated').length, c: '#2DD4A7', icon: Gavel },
    { k: '已驳回', v: rows.filter((r) => r.status === 'rejected').length, c: '#FF5C7A', icon: ShieldX },
  ];

  return (
    <div className="page">
      <PageHeader
        title="异议处理"
        desc="处理第三方针对已登记权属提起的异议，审核举证材料并作出裁定"
        actions={<Button onClick={() => nav('/rights')}>权属管理</Button>}
      />

      <div className="mb-4 grid grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.k} className="card flex items-center gap-3 px-5 py-4">
              <Icon size={17} style={{ color: s.c }} />
              <div>
                <div className="text-[11.5px] text-[var(--text-3)]">{s.k}</div>
                <div className="num mt-0.5 text-[20px] font-semibold leading-none">{s.v}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          rowKey={(r) => r.id}
          onRowClick={setOpen}
          empty={<Empty title="暂无异议记录" desc="当前所有权属登记均无第三方异议" compact />}
        />
      </div>

      <Drawer
        open={!!open}
        onClose={() => setOpen(null)}
        title={open ? `异议处理 · ${open.id}` : ''}
        desc={open?.rightsTitle}
        width={520}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => { toast.success('已要求异议人补充举证材料'); setOpen(null); }}>要求补充举证</Button>
            <Button variant="danger" onClick={() => { toast.success('异议已驳回'); setOpen(null); }}>驳回异议</Button>
            <Button variant="primary" onClick={() => { toast.success('已受理并进入审理流程'); setOpen(null); }}>受理</Button>
          </div>
        }
      >
        {open && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <StatusPill label={ST[open.status].label} tone={ST[open.status].tone} />
              <span className="text-[11.5px] text-[var(--text-3)]">提起于 {fmtTime(open.createdAt)}</span>
            </div>

            <div>
              <div className="mb-1.5 text-[11.5px] text-[var(--text-3)]">异议人</div>
              <div className="text-[13px] text-[var(--text-1)]">{open.claimant}</div>
            </div>

            <div>
              <div className="mb-1.5 text-[11.5px] text-[var(--text-3)]">异议理由</div>
              <p className="rounded-lg border border-[var(--stroke)] bg-[var(--bg-card-2)] px-3.5 py-3 text-[12px] leading-relaxed text-[var(--text-2)]">
                {open.reason}
              </p>
            </div>

            <div>
              <div className="mb-2 text-[11.5px] text-[var(--text-3)]">反证材料（{open.proofs.length}）</div>
              <div className="space-y-2">
                {open.proofs.map((p) => (
                  <div key={p.name} className="flex items-center gap-3 rounded-lg border border-[var(--stroke)] bg-[var(--bg-card-2)] px-3 py-2.5">
                    <span className="h-7 w-7 flex-none rounded-[6px] bg-white/5 text-center text-[9px] leading-7 text-[var(--text-3)]">
                      {p.name.split('.').pop()?.toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] text-[var(--text-1)]">{p.name}</div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-[10.5px] text-[var(--text-3)]">{fmtSize(p.size)}</span>
                        <HashText value={p.hash} head={8} tail={4} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-[11.5px] text-[var(--text-3)]">处理时间线</div>
              <Timeline items={open.timeline.map((t) => ({ title: t.title, time: t.time ? fmtTime(t.time) : undefined, done: t.done }))} />
            </div>

            <div>
              <div className="mb-1.5 text-[11.5px] text-[var(--text-3)]">审核意见</div>
              <Textarea rows={3} value={opinion} onChange={(e) => setOpinion(e.target.value)} placeholder="填写处理意见，将同步给异议双方并上链留痕" />
            </div>

            <div className="rounded-lg border border-[rgba(245,181,68,.25)] bg-[rgba(245,181,68,.06)] px-3.5 py-2.5 text-[11.5px] leading-relaxed text-[var(--text-2)]">
              异议处理期间，被异议权属的转让与授权操作将被冻结，直至作出裁定。
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
