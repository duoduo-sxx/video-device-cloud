import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Check, FileUp, Play, RotateCcw, Square, Trash2 } from 'lucide-react';
import { Button, Progress } from '@/components/ui/core';
import { PageHeader, SectionCard } from '@/components/ui/page';
import { fmtSize } from '@/utils/format';
import { fileHash } from '@/utils/hash';
import { injectEvidence } from '@/mock/api';
import { useData } from '@/store/data';
import type { UploadItem } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';

const STAGE_LABEL: Record<UploadItem['stage'], string> = {
  waiting: '等待中',
  hashing: '计算哈希',
  broadcasting: '广播交易',
  confirming: '区块确认',
  success: '已存证',
  failed: '失败',
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function EvidenceBatch() {
  const nav = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const addEvidence = useData((s) => s.addEvidence);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [running, setRunning] = useState(false);
  const [dragging, setDragging] = useState(false);

  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files).slice(0, 20);
    const next: UploadItem[] = arr.map((f, i) => ({
      uid: `${Date.now()}-${i}`,
      file: f,
      name: f.name,
      size: f.size,
      hash: '',
      progress: 0,
      stage: 'waiting',
    }));
    setItems((prev) => [...prev, ...next]);
  };

  const patch = (uid: string, p: Partial<UploadItem>) =>
    setItems((prev) => prev.map((it) => (it.uid === uid ? { ...it, ...p } : it)));

  const processOne = async (item: UploadItem) => {
    patch(item.uid, { stage: 'hashing', progress: 8 });
    const h = await fileHash(item.file);
    for (let p = 12; p <= 40; p += 7) {
      patch(item.uid, { progress: p, hash: h });
      await sleep(60);
    }
    patch(item.uid, { stage: 'broadcasting', progress: 58 });
    await sleep(420);
    patch(item.uid, { stage: 'confirming', progress: 78 });
    await sleep(520);

    if (Math.random() < 0.1) {
      patch(item.uid, {
        stage: 'failed',
        progress: 100,
        error: 'ERR_NODE_TIMEOUT 节点响应超时，请重试',
      });
      return;
    }

    const now = new Date().toISOString();
    const id = `EV-${now.slice(0, 10).replace(/-/g, '')}-${String(1000 + Math.floor(Math.random() * 8999))}`;
    const ev = {
      id,
      title: item.name.replace(/\.[^.]+$/, ''),
      type: 'document' as const,
      fileName: item.name,
      fileSize: item.size,
      mimeType: item.file.type || 'application/octet-stream',
      hash: h,
      algorithm: 'SHA-256' as const,
      status: 'confirmed' as const,
      blockHeight: 2486921 + Math.floor(Math.random() * 3),
      blockHash: h,
      txHash: h,
      confirmations: 1,
      chainName: '星火联盟链',
      chainId: 'xh-mainnet',
      ownerId: 'u-2',
      ownerName: '陈默',
      orgId: 'org-1',
      orgName: '杭州拾光文创有限公司',
      tags: ['批量上传'],
      privacy: 'private' as const,
      source: 'batch' as const,
      certificateNo: `XH-EV-${now.slice(0, 7)}-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`,
      createdAt: now,
      confirmedAt: now,
      verifyCount: 0,
    };
    injectEvidence(ev);
    addEvidence(ev);
    patch(item.uid, { stage: 'success', progress: 100, evidenceId: id });
  };

  const start = async () => {
    if (!items.length) return toast.error('请先添加文件');
    setRunning(true);
    const queue = items.filter((i) => i.stage === 'waiting' || i.stage === 'failed');
    for (let i = 0; i < queue.length; i += 3) {
      await Promise.all(queue.slice(i, i + 3).map(processOne));
    }
    setRunning(false);
    toast.success('批量存证处理完成');
  };

  const success = items.filter((i) => i.stage === 'success').length;
  const failed = items.filter((i) => i.stage === 'failed').length;
  const totalSize = items.reduce((s, i) => s + i.size, 0);

  return (
    <div className="page">
      <PageHeader
        title="批量存证"
        desc="一次最多上传 20 个文件，并发 3 个上链，失败项可单独重试"
        actions={<Button onClick={() => nav('/evidence')}>存证记录</Button>}
      />

      <div className="grid grid-cols-4 gap-4">
        <SectionCard title="上传队列" className="col-span-3" bodyClass="p-0">
          <div className="p-5">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                addFiles(e.dataTransfer.files);
              }}
              onClick={() => inputRef.current?.click()}
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center rounded-[10px] border border-dashed py-10 transition-all',
                dragging
                  ? 'border-[rgba(34,211,238,.7)] bg-[rgba(34,211,238,.06)]'
                  : 'border-[var(--stroke-strong)] bg-[var(--bg-card-2)] hover:border-[rgba(61,125,255,.5)]',
              )}
            >
              <FileUp size={24} className="text-[var(--brand-2)]" />
              <div className="mt-2.5 text-[13px] text-[var(--text-1)]">拖拽多个文件到此处，或点击批量选择</div>
              <div className="mt-1 text-[11.5px] text-[var(--text-3)]">单次最多 20 个文件，单文件 ≤ 500MB</div>
            </div>
            <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && addFiles(e.target.files)} />

            <div className="mt-5 flex items-center gap-4 text-[11.5px]">
              <span className="text-[var(--text-3)]">
                共 <span className="text-[var(--text-1)]">{items.length}</span> 个文件
              </span>
              <span className="text-[var(--ok)]">成功 {success}</span>
              <span className="text-[var(--danger)]">失败 {failed}</span>
              <span className="text-[var(--text-3)]">总大小 {fmtSize(totalSize)}</span>
              <div className="ml-auto flex gap-2">
                <Button size="sm" icon={<Trash2 size={12} />} onClick={() => setItems([])} disabled={running}>
                  清空
                </Button>
                {running ? (
                  <Button size="sm" variant="danger" icon={<Square size={12} />} onClick={() => setRunning(false)}>
                    暂停
                  </Button>
                ) : (
                  <Button size="sm" variant="primary" icon={<Play size={12} />} onClick={start}>
                    开始存证
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="max-h-[520px] overflow-y-auto border-t border-[var(--stroke)]">
            {items.length === 0 ? (
              <div className="py-20 text-center text-[12px] text-[var(--text-3)]">队列为空，请先添加文件</div>
            ) : (
              items.map((it) => (
                <div key={it.uid} className="flex items-center gap-4 border-b border-[var(--stroke)] px-5 py-3 last:border-b-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[12.5px] text-[var(--text-1)]">{it.name}</span>
                      <span className="flex-none text-[10.5px] text-[var(--text-3)]">{fmtSize(it.size)}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2.5">
                      <div className="w-[240px]">
                        <Progress
                          value={it.progress}
                          height={5}
                          tone={it.stage === 'failed' ? 'danger' : it.stage === 'success' ? 'ok' : 'brand'}
                        />
                      </div>
                      {it.error && (
                        <span className="flex items-center gap-1 text-[10.5px] text-[var(--danger)]">
                          <AlertCircle size={10} /> {it.error}
                        </span>
                      )}
                      {it.evidenceId && <span className="font-mono text-[10.5px] text-[var(--brand-2)]">{it.evidenceId}</span>}
                    </div>
                  </div>
                  <span
                    className={cn(
                      'w-[68px] flex-none text-right text-[11.5px]',
                      it.stage === 'success' && 'text-[var(--ok)]',
                      it.stage === 'failed' && 'text-[var(--danger)]',
                      it.stage !== 'success' && it.stage !== 'failed' && 'text-[var(--text-3)]',
                    )}
                  >
                    {STAGE_LABEL[it.stage]}
                  </span>
                  {it.stage === 'failed' && (
                    <Button size="xs" icon={<RotateCcw size={10} />} onClick={() => processOne(it)}>
                      重试
                    </Button>
                  )}
                  {it.stage === 'waiting' && (
                    <button className="text-[var(--text-3)] hover:text-[var(--danger)]" onClick={() => setItems(items.filter((x) => x.uid !== it.uid))}>
                      <Trash2 size={13} />
                    </button>
                  )}
                  {it.stage === 'success' && <Check size={14} className="text-[var(--ok)]" />}
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="本次任务">
            <div className="space-y-3">
              {[
                ['文件总数', `${items.length} 个`],
                ['已成功', `${success} 个`],
                ['失败', `${failed} 个`],
                ['总大小', fmtSize(totalSize)],
                ['并发数', '3'],
                ['预计耗时', `${Math.max(1, Math.ceil(items.length * 1.4))} 秒`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-[12px]">
                  <span className="text-[var(--text-3)]">{k}</span>
                  <span className="text-[var(--text-1)]">{v}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="批量存证说明">
            <ul className="space-y-2 text-[11.5px] leading-relaxed text-[var(--text-2)]">
              <li>· 每个文件独立计算哈希并单独上链，互不影响。</li>
              <li>· 失败通常由节点超时或额度不足引起，可直接重试。</li>
              <li>· 批量存证默认使用「私有」隐私级别，可在记录详情中调整。</li>
              <li>· 需要更高并发或定时批量？可使用 <button className="text-[var(--brand-2)] hover:underline" onClick={() => nav('/service/api')}>开放 API</button>。</li>
            </ul>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
