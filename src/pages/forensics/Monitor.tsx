import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ExternalLink, Radar } from 'lucide-react';
import { Button, Progress, StatusPill, Tag } from '@/components/ui/core';
import { PageHeader, SectionCard } from '@/components/ui/page';
import { DataTable, type Column } from '@/components/ui/data';
import { Drawer } from '@/components/ui/overlay';
import { mockApi } from '@/mock/api';
import { fmtTime } from '@/utils/format';
import type { MonitorHit } from '@/types';
import type { Tone } from '@/utils/constants';
import { toast } from 'sonner';

const ST: Record<MonitorHit['status'], { label: string; tone: Tone }> = {
  new: { label: '待处置', tone: 'amber' },
  confirmed: { label: '已确认侵权', tone: 'red' },
  ignored: { label: '已忽略', tone: 'gray' },
};

export default function ForensicsMonitor() {
  const nav = useNavigate();
  const [rows, setRows] = useState<MonitorHit[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<MonitorHit | null>(null);

  useEffect(() => {
    mockApi.forensics.monitorHits().then((r) => {
      setRows(r);
      setLoading(false);
    });
  }, []);

  const columns: Column<MonitorHit>[] = [
    { key: 'platform', title: '来源平台', width: 110, render: (r) => <Tag tone="blue">{r.platform}</Tag> },
    {
      key: 'url',
      title: '疑似侵权链接',
      render: (r) => (
        <div className="py-2">
          <div className="truncate font-mono text-[11.5px] text-[var(--brand-2)]">{r.url}</div>
          <div className="mt-0.5 text-[10.5px] text-[var(--text-3)]">原作：{r.originalTitle}</div>
        </div>
      ),
    },
    {
      key: 'sim',
      title: '相似度',
      width: 148,
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-[70px]">
            <Progress value={r.similarity} height={5} tone={r.similarity > 90 ? 'danger' : 'brand'} />
          </div>
          <span className="num text-[11.5px] text-[var(--text-1)]">{r.similarity}%</span>
        </div>
      ),
    },
    { key: 'found', title: '发现时间', width: 150, render: (r) => <span className="font-mono text-[11.5px]">{fmtTime(r.foundAt)}</span> },
    { key: 'status', title: '状态', width: 110, render: (r) => <StatusPill label={ST[r.status].label} tone={ST[r.status].tone} /> },
    {
      key: 'op',
      title: '操作',
      width: 138,
      render: (r) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button className="text-[11.5px] text-[var(--brand-2)] hover:underline" onClick={() => setOpen(r)}>对比</button>
          <button className="text-[11.5px] text-[var(--text-3)] hover:text-[var(--text-1)]" onClick={() => nav('/forensics/web')}>取证</button>
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <PageHeader
        title="侵权监测"
        desc="基于图像相似度与文本指纹的自动监测，命中线索后可一键取证固证"
        actions={<Button variant="primary" onClick={() => toast.success('已创建监测任务，覆盖 8 个主流平台')}>新建监测任务</Button>}
      />

      <div className="mb-4 grid grid-cols-4 gap-3">
        {[
          { k: '监测中任务', v: 6, c: '#3D7DFF' },
          { k: '本月命中', v: 42, c: '#F5B544' },
          { k: '确认侵权', v: 17, c: '#FF5C7A' },
          { k: '已发起维权', v: 9, c: '#2DD4A7' },
        ].map((i) => (
          <div key={i.k} className="card flex items-center justify-between px-5 py-4">
            <div>
              <div className="text-[11.5px] text-[var(--text-3)]">{i.k}</div>
              <div className="num mt-1 text-[20px] font-semibold leading-none">{i.v}</div>
            </div>
            <span className="h-8 w-[3px] rounded-full" style={{ background: i.c }} />
          </div>
        ))}
      </div>

      <SectionCard title="监测任务" className="mb-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { n: '《山海拾遗·第三辑》插画集', p: 8, hit: 12, status: '运行中' },
            { n: '《青峦》系列风光摄影', p: 6, hit: 8, status: '运行中' },
            { n: '非遗纹样矢量图库', p: 8, hit: 22, status: '运行中' },
          ].map((t) => (
            <div key={t.n} className="rounded-[9px] border border-[var(--stroke)] bg-[var(--bg-card-2)] px-4 py-3.5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-[12px] text-[var(--text-1)]">
                  <Radar size={13} className="text-[var(--brand-2)]" />
                  {t.n}
                </div>
                <Tag tone="green">{t.status}</Tag>
              </div>
              <div className="mt-2 flex gap-4 text-[10.5px] text-[var(--text-3)]">
                <span>覆盖平台 {t.p} 个</span>
                <span>命中 {t.hit} 条</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="card">
        <div className="border-b border-[var(--stroke)] px-5 py-3.5">
          <div className="card-title">命中线索</div>
          <div className="mt-0.5 text-[11.5px] text-[var(--text-3)]">相似度 ≥ 72% 的疑似侵权内容，按发现时间倒序</div>
        </div>
        <DataTable columns={columns} rows={rows} loading={loading} rowKey={(r) => r.id} onRowClick={setOpen} />
      </div>

      <Drawer
        open={!!open}
        onClose={() => setOpen(null)}
        title="相似度对比"
        desc={open ? `${open.platform} · 相似度 ${open.similarity}%` : ''}
        width={620}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => { toast.success('已标记为忽略'); setOpen(null); }}>忽略线索</Button>
            <Button variant="primary" onClick={() => nav('/forensics/web')}>立即取证</Button>
          </div>
        }
      >
        {open && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-1.5 text-[11.5px] text-[var(--text-3)]">原作</div>
                <div className="flex h-[180px] flex-col items-center justify-center rounded-[9px] border border-[var(--stroke)] bg-gradient-to-br from-[rgba(61,125,255,.16)] to-[rgba(34,211,238,.05)]">
                  <span className="text-[12px] text-[var(--text-1)]">{open.originalTitle}</span>
                  <span className="mt-1 text-[10.5px] text-[var(--text-3)]">已存证 · 2026-06-18</span>
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-[11.5px] text-[var(--text-3)]">
                  疑似侵权
                  <AlertTriangle size={11} className="text-[var(--warn)]" />
                </div>
                <div className="flex h-[180px] flex-col items-center justify-center rounded-[9px] border border-[rgba(245,181,68,.3)] bg-gradient-to-br from-[rgba(245,181,68,.12)] to-transparent">
                  <span className="text-[12px] text-[var(--text-1)]">{open.platform} 商品图</span>
                  <span className="mt-1 text-[10.5px] text-[var(--text-3)]">{open.url.slice(0, 28)}…</span>
                </div>
              </div>
            </div>

            <div className="rounded-[9px] border border-[var(--stroke)] bg-[var(--bg-card-2)] px-4 py-3">
              <div className="flex items-baseline justify-between">
                <span className="text-[11.5px] text-[var(--text-3)]">综合相似度</span>
                <span className="num text-[20px] font-semibold text-[var(--warn)]">{open.similarity}%</span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-3 text-[10.5px] text-[var(--text-3)]">
                <div>图像特征 96%</div>
                <div>构图布局 91%</div>
                <div>文字描述 78%</div>
              </div>
            </div>

            <div className="space-y-2">
              {[
                ['线索编号', open.id],
                ['来源平台', open.platform],
                ['发现时间', fmtTime(open.foundAt)],
                ['链接地址', open.url],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline gap-3 border-b border-dashed border-white/[0.055] py-2">
                  <span className="w-[68px] flex-none text-[11.5px] text-[var(--text-3)]">{k}</span>
                  <span className="min-w-0 flex-1 break-all font-mono text-[11.5px] text-[var(--text-1)]">{v}</span>
                </div>
              ))}
            </div>

            <Button className="w-full" icon={<ExternalLink size={13} />} onClick={() => toast.info('已在系统浏览器中打开线索链接')}>
              打开原始链接
            </Button>
          </div>
        )}
      </Drawer>
    </div>
  );
}
