import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, FileSearch, Fingerprint, Search, ShieldAlert, XCircle } from 'lucide-react';
import { Button, HashText, Input } from '@/components/ui/core';
import { PageHeader, SectionCard } from '@/components/ui/page';
import { Tabs } from '@/components/ui/data';
import { db } from '@/mock/api';
import { fileHash } from '@/utils/hash';
import { fmtSize, fmtTime } from '@/utils/format';
import { cn } from '@/utils/cn';

type Result =
  | { kind: 'idle' }
  | { kind: 'computing'; progress: number }
  | { kind: 'match'; hash: string; evidenceId: string; title: string; time: string; height: number; size: number }
  | { kind: 'notfound'; hash: string }
  | { kind: 'mismatch'; local: string; remote: string };

export default function EvidenceVerify() {
  const nav = useNavigate();
  const [tab, setTab] = useState('file');
  const [result, setResult] = useState<Result>({ kind: 'idle' });
  const [query, setQuery] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const runFile = async (f: File) => {
    setFileName(f.name);
    setFileSize(f.size);
    setResult({ kind: 'computing', progress: 0 });
    const h = await fileHash(f);
    for (let p = 0; p <= 100; p += 10) {
      setResult({ kind: 'computing', progress: p });
      await new Promise((r) => setTimeout(r, 40));
    }
    const hit = db.evidences.find((e) => e.hash === h);
    if (hit) {
      setResult({ kind: 'match', hash: h, evidenceId: hit.id, title: hit.title, time: hit.confirmedAt ?? hit.createdAt, height: hit.blockHeight, size: hit.fileSize });
    } else {
      setResult({ kind: 'notfound', hash: h });
    }
  };

  const demoMatch = () => {
    const e = db.evidences.find((x) => x.status === 'confirmed') ?? db.evidences[0];
    setFileName(e.fileName);
    setFileSize(e.fileSize);
    setResult({ kind: 'match', hash: e.hash, evidenceId: e.id, title: e.title, time: e.confirmedAt ?? e.createdAt, height: e.blockHeight, size: e.fileSize });
  };

  const demoMismatch = () => {
    const e = db.evidences[0];
    setFileName(e.fileName);
    setFileSize(e.fileSize);
    setResult({ kind: 'mismatch', local: e.hash, remote: '0x91c4f7a2e8b3d05c6a9e1f2b4d7c8a3e5f0b1d2c4a6e8f9b0c3d5e7a1f2b4c60' });
  };

  const queryHash = () => {
    const h = query.trim().toLowerCase();
    if (!/^0x[0-9a-f]{64}$/.test(h)) {
      setResult({ kind: 'idle' });
      return;
    }
    const hit = db.evidences.find((e) => e.hash.toLowerCase() === h);
    if (hit) {
      setResult({ kind: 'match', hash: hit.hash, evidenceId: hit.id, title: hit.title, time: hit.confirmedAt ?? hit.createdAt, height: hit.blockHeight, size: hit.fileSize });
    } else {
      setResult({ kind: 'notfound', hash: h });
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="哈希核验"
        desc="上传文件重新计算 SHA-256，与链上记录比对，快速判断文件是否被修改"
        actions={<Button onClick={() => nav('/evidence')}>存证记录</Button>}
      />

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <SectionCard title="选择核验方式">
            <Tabs
              active={tab}
              onChange={(k) => {
                setTab(k);
                setResult({ kind: 'idle' });
                setQuery('');
              }}
              items={[
                { key: 'file', label: '文件核验' },
                { key: 'hash', label: '哈希查询' },
              ]}
              className="mb-5"
            />

            {tab === 'file' ? (
              <>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) runFile(f);
                  }}
                  onClick={() => inputRef.current?.click()}
                  className={cn(
                    'flex cursor-pointer flex-col items-center justify-center rounded-[10px] border border-dashed py-12 transition-all',
                    dragging
                      ? 'border-[rgba(34,211,238,.7)] bg-[rgba(34,211,238,.06)]'
                      : 'border-[var(--stroke-strong)] bg-[var(--bg-card-2)] hover:border-[rgba(61,125,255,.5)]',
                  )}
                >
                  <Fingerprint size={26} className="text-[var(--brand-2)]" />
                  <div className="mt-2.5 text-[13px] text-[var(--text-1)]">拖拽文件到此处核验，或点击选择</div>
                  <div className="mt-1 text-[11.5px] text-[var(--text-3)]">文件仅在本地计算哈希，不会上传到服务器</div>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) runFile(f);
                  }}
                />
                <div className="mt-3 flex items-center gap-2">
                  <Button size="sm" onClick={demoMatch}>载入一致示例</Button>
                  <Button size="sm" onClick={demoMismatch}>载入不一致示例</Button>
                  {fileName && <span className="ml-1 text-[11.5px] text-[var(--text-3)]">{fileName} · {fmtSize(fileSize)}</span>}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && queryHash()}
                  placeholder="输入 0x 开头的 64 位哈希值"
                  prefix={<Search size={13} />}
                  className="font-mono"
                />
                <div className="flex items-center gap-2">
                  <Button variant="primary" size="sm" onClick={queryHash}>查询链上记录</Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const e = db.evidences[0];
                      setQuery(e.hash);
                      setTimeout(() => {
                        setResult({ kind: 'match', hash: e.hash, evidenceId: e.id, title: e.title, time: e.confirmedAt ?? e.createdAt, height: e.blockHeight, size: e.fileSize });
                      }, 120);
                    }}
                  >
                    填入示例哈希
                  </Button>
                  <span className="text-[11px] text-[var(--text-3)]">支持存证文件哈希、文本哈希</span>
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard title="核验结果" desc="比对本地哈希与链上存证记录">
            {result.kind === 'idle' && (
              <div className="py-12 text-center">
                <FileSearch size={30} className="mx-auto text-[var(--text-3)]" />
                <div className="mt-3 text-[12.5px] text-[var(--text-2)]">尚未开始核验</div>
                <div className="mt-1 text-[11.5px] text-[var(--text-3)]">上传文件或输入哈希后，这里会显示核验结论</div>
              </div>
            )}

            {result.kind === 'computing' && (
              <div className="py-10">
                <div className="mx-auto max-w-[380px] text-center">
                  <div className="text-[12.5px] text-[var(--text-2)]">正在计算 SHA-256 数字指纹…</div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#3D7DFF] to-[#22D3EE] transition-all" style={{ width: `${result.progress}%` }} />
                  </div>
                  <div className="num mt-2 text-[11px] text-[var(--text-3)]">{result.progress}%</div>
                </div>
              </div>
            )}

            {result.kind === 'match' && (
              <div className="rounded-[10px] border border-[rgba(45,212,167,.3)] bg-[rgba(45,212,167,.06)] p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={22} className="mt-0.5 flex-none text-[var(--ok)]" />
                  <div className="flex-1">
                    <div className="text-[14px] font-semibold text-[#6EE7C7]">核验通过 · 文件未被修改</div>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--text-2)]">
                      该文件的哈希值与链上存证记录完全一致，可证明自 {fmtTime(result.time)} 起内容未发生任何改动。
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-x-6">
                      {[
                        ['存证编号', <span key="a" className="font-mono text-[12px] text-[var(--brand-2)]">{result.evidenceId}</span>],
                        ['标的名称', result.title],
                        ['上链时间', <span key="b" className="font-mono text-[12px]">{fmtTime(result.time)}</span>],
                        ['区块高度', <span key="c" className="font-mono text-[12px] text-[var(--brand-2)]">#{result.height.toLocaleString()}</span>],
                      ].map(([k, v]) => (
                        <div key={String(k)} className="flex items-baseline gap-3 border-b border-dashed border-white/[0.07] py-2">
                          <span className="w-[68px] flex-none text-[11.5px] text-[var(--text-3)]">{k}</span>
                          <span className="min-w-0 flex-1 text-[12px] text-[var(--text-1)]">{v}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 rounded-md bg-[#070C15] px-3 py-2">
                      <div className="break-all font-mono text-[10.5px] text-[var(--brand-2)]">{result.hash}</div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="primary" onClick={() => nav(`/evidence/${result.evidenceId}`)}>查看存证详情</Button>
                      <Button size="sm">下载核验报告</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {result.kind === 'notfound' && (
              <div className="rounded-[10px] border border-[rgba(245,181,68,.3)] bg-[rgba(245,181,68,.06)] p-5">
                <div className="flex items-start gap-3">
                  <ShieldAlert size={22} className="mt-0.5 flex-none text-[var(--warn)]" />
                  <div>
                    <div className="text-[14px] font-semibold text-[#F7CB7A]">该文件未在链上找到存证记录</div>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--text-2)]">
                      可能是文件尚未存证，或存证时使用了不同的文件版本。建议立即为该文件创建存证，固定当前时间点的内容。
                    </p>
                    <div className="mt-3 rounded-md bg-[#070C15] px-3 py-2">
                      <div className="break-all font-mono text-[10.5px] text-[var(--text-2)]">{result.hash}</div>
                    </div>
                    <Button size="sm" variant="primary" className="mt-4" onClick={() => nav('/evidence/create')}>立即存证该文件</Button>
                  </div>
                </div>
              </div>
            )}

            {result.kind === 'mismatch' && (
              <div className="rounded-[10px] border border-[rgba(255,92,122,.3)] bg-[rgba(255,92,122,.06)] p-5">
                <div className="flex items-start gap-3">
                  <XCircle size={22} className="mt-0.5 flex-none text-[var(--danger)]" />
                  <div className="flex-1">
                    <div className="text-[14px] font-semibold text-[#FF9AAD]">哈希不匹配 · 文件可能已被修改</div>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--text-2)]">
                      本地文件的哈希与链上记录不一致，说明当前文件内容与存证时不同。请确认是否使用了错误的文件版本。
                    </p>
                    <div className="mt-4 space-y-2">
                      <div className="rounded-md border border-[var(--stroke)] bg-[#070C15] px-3 py-2">
                        <div className="mb-1 text-[10px] text-[var(--text-3)]">本地文件哈希</div>
                        <div className="break-all font-mono text-[10.5px] text-[#FF9AAD]">{result.local}</div>
                      </div>
                      <div className="rounded-md border border-[var(--stroke)] bg-[#070C15] px-3 py-2">
                        <div className="mb-1 text-[10px] text-[var(--text-3)]">链上存证哈希</div>
                        <div className="break-all font-mono text-[10.5px] text-[var(--brand-2)]">{result.remote}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="核验原理">
            <div className="space-y-4">
              {[
                { t: '本地计算', d: '在浏览器内用 SHA-256 计算文件哈希，原文不离开设备' },
                { t: '链上比对', d: '将计算结果与联盟链上的存证记录逐一比对' },
                { t: '得出结证', d: '一致即证明文件自存证时间起未被修改' },
              ].map((s, i) => (
                <div key={s.t} className="flex gap-3">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full border border-[var(--stroke)] bg-white/[0.03] text-[10px] text-[var(--brand-2)]">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-[12.5px] text-[var(--text-1)]">{s.t}</div>
                    <div className="mt-0.5 text-[11px] leading-relaxed text-[var(--text-3)]">{s.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="最近核验">
            <div className="space-y-2.5">
              {db.evidences.slice(0, 4).map((e) => (
                <button key={e.id} onClick={() => nav(`/evidence/${e.id}`)} className="flex w-full items-center gap-2 text-left">
                  <span className="h-1.5 w-1.5 flex-none rounded-full bg-[var(--ok)]" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11.5px] text-[var(--text-2)]">{e.title}</div>
                    <div className="font-mono text-[10px] text-[var(--text-3)]"><HashText value={e.hash} head={10} tail={6} /></div>
                  </div>
                </button>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
