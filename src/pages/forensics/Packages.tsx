import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Boxes, CheckCircle2, Download, FolderOpen, Gavel, Share2 } from 'lucide-react';
import { Button, HashText, StatusPill, Tag } from '@/components/ui/core';
import { PageHeader, SectionCard } from '@/components/ui/page';
import { mockApi } from '@/mock/api';
import { fmtSize, fmtTime } from '@/utils/format';
import type { EvidencePackage } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';

export default function ForensicsPackages() {
  const nav = useNavigate();
  const [list, setList] = useState<EvidencePackage[]>([]);
  const [active, setActive] = useState<EvidencePackage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mockApi.forensics.packageList(1, 20).then((r) => {
      setList(r.list);
      setActive(r.list[0] ?? null);
      setLoading(false);
    });
  }, []);

  const groups = active
    ? active.items.reduce<Record<string, typeof active.items>>((acc, it) => {
        (acc[it.type] ??= []).push(it);
        return acc;
      }, {})
    : {};

  return (
    <div className="page">
      <PageHeader
        title="证据包"
        desc="将存证、取证、合同与权属证明打包成完整证据链，用于维权或司法出证"
        actions={
          <>
            <Button icon={<Share2 size={14} />} onClick={() => toast.success('证据包分享链接已复制，有效期 7 天')}>分享</Button>
            <Button variant="primary" icon={<Download size={14} />} onClick={() => toast.success('正在打包，完成后可下载 ZIP')}>打包下载</Button>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11.5px] text-[var(--text-3)]">全部证据包（{list.length}）</span>
          </div>
          {loading && <div className="h-[520px] skel" />}
          <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
            {list.map((p) => (
              <button
                key={p.id}
                onClick={() => setActive(p)}
                className={cn(
                  'w-full rounded-[9px] border px-3.5 py-3 text-left transition-all',
                  active?.id === p.id
                    ? 'border-[rgba(61,125,255,.45)] bg-[rgba(61,125,255,.08)]'
                    : 'border-[var(--stroke)] bg-[var(--bg-card)] hover:border-[var(--stroke-strong)]',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10.5px] text-[var(--text-3)]">{p.id}</span>
                  <Tag tone={p.status === 'sealed' ? 'green' : 'gray'}>{p.status === 'sealed' ? '已封存' : '草稿'}</Tag>
                </div>
                <div className="mt-1 line-clamp-2 text-[12px] text-[var(--text-1)]">{p.name}</div>
                <div className="mt-1.5 flex items-center gap-2 text-[10.5px] text-[var(--text-3)]">
                  <span>{p.itemCount} 项证据</span>
                  <span>·</span>
                  <span>{fmtSize(p.totalSize)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-3 space-y-4">
          {!active ? (
            <div className="card flex h-[400px] flex-col items-center justify-center">
              <Boxes size={34} className="text-[var(--text-3)]" />
              <div className="mt-3 text-[13px] text-[var(--text-2)]">请选择左侧证据包</div>
            </div>
          ) : (
            <>
              <SectionCard
                title={active.name}
                desc={`${active.id} · 创建于 ${fmtTime(active.createdAt)} · 创建人 ${active.createdBy}`}
                extra={<StatusPill label={active.integrityOk ? '完整性校验通过' : '校验异常'} tone={active.integrityOk ? 'green' : 'red'} />}
              >
                <div className="grid grid-cols-4 gap-3">
                  {[
                    ['证据总数', `${active.itemCount} 项`],
                    ['总大小', fmtSize(active.totalSize)],
                    ['封存状态', active.status === 'sealed' ? '已封存上链' : '草稿'],
                    ['完整性', active.integrityOk ? '校验通过' : '校验失败'],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-[8px] border border-[var(--stroke)] bg-[var(--bg-card-2)] px-3.5 py-2.5">
                      <div className="text-[10.5px] text-[var(--text-3)]">{k}</div>
                      <div className="mt-0.5 text-[12.5px] text-[var(--text-1)]">{v}</div>
                    </div>
                  ))}
                </div>
                {active.integrityOk && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-[rgba(45,212,167,.28)] bg-[rgba(45,212,167,.06)] px-3.5 py-2.5">
                    <CheckCircle2 size={14} className="text-[var(--ok)]" />
                    <span className="text-[11.5px] text-[var(--text-2)]">
                      全部 {active.itemCount} 项证据的哈希与链上记录一致，证据包自封存后未被篡改。
                    </span>
                  </div>
                )}
              </SectionCard>

              <SectionCard title="证据目录" desc="按类型分组，展开可查看每项证据的哈希">
                <div className="space-y-3">
                  {Object.entries(groups).map(([type, items]) => (
                    <div key={type} className="rounded-[9px] border border-[var(--stroke)]">
                      <div className="flex items-center gap-2 border-b border-[var(--stroke)] bg-[var(--bg-card-2)] px-3.5 py-2.5">
                        <FolderOpen size={13} className="text-[var(--brand-2)]" />
                        <span className="text-[12px] text-[var(--text-1)]">{type}</span>
                        <span className="text-[10.5px] text-[var(--text-3)]">（{items.length}）</span>
                      </div>
                      <div className="divide-y divide-white/[0.04]">
                        {items.map((it) => (
                          <div key={it.refId} className="flex items-center gap-3 px-3.5 py-2.5">
                            <span className="h-1 w-1 flex-none rounded-full bg-[var(--text-3)]" />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[11.5px] text-[var(--text-1)]">{it.name}</div>
                              <div className="mt-0.5 font-mono text-[10px] text-[var(--text-3)]">{it.refId}</div>
                            </div>
                            <HashText value={it.hash} head={8} tail={6} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <div className="grid grid-cols-2 gap-4">
                <SectionCard title="可执行操作">
                  <div className="space-y-2">
                    <Button className="w-full justify-start" icon={<Download size={13} />} onClick={() => toast.success('正在生成证据包压缩文件…')}>
                      打包下载（ZIP）
                    </Button>
                    <Button className="w-full justify-start" icon={<Gavel size={13} />} onClick={() => nav('/forensics/judicial')}>
                      申请司法出证
                    </Button>
                    <Button className="w-full justify-start" icon={<Share2 size={13} />} onClick={() => toast.success('分享链接已复制')}>
                      生成只读分享链接
                    </Button>
                  </div>
                </SectionCard>
                <SectionCard title="出证记录">
                  <div className="space-y-2">
                    {[
                      ['JD-2026-0018', '公证书', '已出具'],
                      ['JD-2026-0012', '存证报告', '已寄送'],
                    ].map(([id, type, st]) => (
                      <button key={id} onClick={() => nav('/forensics/judicial')} className="flex w-full items-center justify-between rounded-lg border border-[var(--stroke)] bg-[var(--bg-card-2)] px-3 py-2.5">
                        <div className="text-left">
                          <div className="font-mono text-[11.5px] text-[var(--text-1)]">{id}</div>
                          <div className="text-[10.5px] text-[var(--text-3)]">{type}</div>
                        </div>
                        <Tag tone="green">{st}</Tag>
                      </button>
                    ))}
                  </div>
                </SectionCard>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
