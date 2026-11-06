import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  FileText,
  Globe,
  Hash,
  Loader2,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { Button, Field, Input, Select, Tag, Textarea } from '@/components/ui/core';
import { PageHeader, SectionCard } from '@/components/ui/page';
import { Tabs } from '@/components/ui/data';
import { db, injectEvidence, mockApi } from '@/mock/api';
import { EVIDENCE_TYPE } from '@/utils/constants';
import { fmtSize, fmtTime } from '@/utils/format';
import { fileHash, textHash } from '@/utils/hash';
import type { Evidence, EvidenceType } from '@/types';
import { useData } from '@/store/data';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';

const NODES = ['北京主节点', '杭州共识节点', '深圳共识节点', '成都共识节点', '司法鉴定节点', '公证处节点'];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function EvidenceCreate() {
  const nav = useNavigate();
  const addEvidence = useData((s) => s.addEvidence);
  const inputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState('file');
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [dragging, setDragging] = useState(false);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<EvidenceType>('document');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [rightsId, setRightsId] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'org' | 'private'>('private');
  const [remark, setRemark] = useState('');

  const [stage, setStage] = useState(0); // 0 idle, 1 hash, 2 broadcast, 3 confirm, 4 done
  const [typed, setTyped] = useState('');
  const [progress, setProgress] = useState(0);
  const [created, setCreated] = useState<Evidence | null>(null);
  const [busy, setBusy] = useState(false);

  const rightsOptions = useMemo(
    () => db.rights.slice(0, 30).map((r) => ({ value: r.id, label: `${r.title} · ${r.id}` })),
    [],
  );

  const accept = (f: File) => {
    if (f.size > 500 * 1024 * 1024) {
      toast.error('单个文件不得超过 500MB');
      return;
    }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));
    const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) setType('document');
    else if (['jpg', 'jpeg', 'png', 'tif', 'webp'].includes(ext)) setType('image');
    else if (['mp4', 'mov', 'avi'].includes(ext)) setType('video');
    else if (['wav', 'mp3', 'flac'].includes(ext)) setType('audio');
    else if (['psd', 'ai', 'fig', 'sketch'].includes(ext)) setType('design');
    else if (['jsonl', 'csv', 'parquet', 'zip', 'tar', 'gz'].includes(ext)) setType('dataset');
    else if (['js', 'ts', 'py', 'java', 'go'].includes(ext)) setType('code');
  };

  const addTag = () => {
    const v = tagInput.trim();
    if (!v) return;
    if (tags.length >= 5) return toast.error('最多添加 5 个标签');
    if (!tags.includes(v)) setTags([...tags, v]);
    setTagInput('');
  };

  const run = async () => {
    if (tab === 'file' && !file) return toast.error('请先选择需要存证的文件');
    if (tab === 'text' && text.trim().length < 10) return toast.error('文本内容不少于 10 个字符');
    if (tab === 'web' && !/^https?:\/\//.test(url)) return toast.error('请输入合法的网页地址');
    if (!title.trim()) return toast.error('请填写存证标题');

    setBusy(true);
    setStage(1);
    setTyped('');
    setProgress(0);

    const h =
      tab === 'file' && file ? await fileHash(file) : tab === 'text' ? textHash(text) : textHash(url);

    // 打字机
    for (let i = 0; i <= h.length; i += 2) {
      setTyped(h.slice(0, i));
      await sleep(14);
    }
    setTyped(h);
    await sleep(320);
    setStage(2);
    await sleep(1100);
    setStage(3);
    for (let p = 0; p <= 100; p += 5) {
      setProgress(p);
      await sleep(28);
    }

    const createdItem = await mockApi.evidence.create({
      title: title.trim(),
      type: tab === 'file' ? type : tab === 'text' ? 'text' : 'webpage',
      fileName: tab === 'file' && file ? file.name : tab === 'text' ? `${title}.txt` : `${title}.html`,
      fileSize: tab === 'file' && file ? file.size : tab === 'text' ? text.length * 2 : 186 * 1024,
      mimeType: tab === 'file' && file ? file.type || 'application/octet-stream' : 'text/plain',
      hash: h,
      tags,
      privacy,
      remark,
      relatedRightsId: rightsId || undefined,
      source: 'web',
    });

    injectEvidence(createdItem);
    addEvidence(createdItem);
    setCreated(createdItem);
    setStage(4);
    setBusy(false);
    toast.success(`存证成功：${createdItem.id}`);
  };

  const reset = () => {
    setStage(0);
    setCreated(null);
    setFile(null);
    setText('');
    setUrl('');
    setTitle('');
    setTags([]);
    setRemark('');
    setProgress(0);
    setTyped('');
  };

  return (
    <div className="page">
      <PageHeader
        title="快速存证"
        desc="文件、文本或网页内容计算哈希后写入星火联盟链，生成具备时间戳效力的存证证书"
        actions={
          <>
            <Button onClick={() => nav('/evidence/batch')}>批量存证</Button>
            <Button onClick={() => nav('/evidence')}>存证记录</Button>
          </>
        }
      />

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 space-y-4">
          <SectionCard title="选择存证对象" desc="支持单文件、纯文本与网页快照三类">
            <Tabs
              active={tab}
              onChange={setTab}
              items={[
                { key: 'file', label: '文件存证' },
                { key: 'text', label: '文本存证' },
                { key: 'web', label: '网页存证' },
              ]}
              className="mb-5"
            />

            {tab === 'file' && (
              <>
                {!file ? (
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
                      if (f) accept(f);
                    }}
                    onClick={() => inputRef.current?.click()}
                    className={cn(
                      'flex cursor-pointer flex-col items-center justify-center rounded-[10px] border border-dashed py-16 transition-all',
                      dragging
                        ? 'border-[rgba(34,211,238,.7)] bg-[rgba(34,211,238,.06)]'
                        : 'border-[var(--stroke-strong)] bg-[var(--bg-card-2)] hover:border-[rgba(61,125,255,.5)] hover:bg-[var(--bg-hover)]',
                    )}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--stroke)] bg-white/[0.03]">
                      <UploadCloud size={22} className="text-[var(--brand-2)]" />
                    </div>
                    <div className="mt-3 text-[13px] text-[var(--text-1)]">拖拽文件到此处，或点击选择文件</div>
                    <div className="mt-1.5 text-[11.5px] text-[var(--text-3)]">
                      支持 PDF / DOCX / JPG / PNG / MP4 / PSD / ZIP，单文件 ≤ 500MB
                    </div>
                    <div className="mt-3 flex gap-1.5">
                      {['PDF', 'PNG', 'MP4', 'PSD', 'ZIP'].map((t) => (
                        <span key={t} className="tag">{t}</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[10px] border border-[var(--stroke)] bg-[var(--bg-card-2)] p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[9px] bg-[rgba(61,125,255,.12)] text-[#9CC2FF]">
                        <FileText size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] text-[var(--text-1)]">{file.name}</div>
                        <div className="mt-1 flex items-center gap-2 text-[11.5px] text-[var(--text-3)]">
                          <span>{fmtSize(file.size)}</span>
                          <span>·</span>
                          <span>{file.type || '未知类型'}</span>
                          <span>·</span>
                          <span>最后修改 {fmtTime(file.lastModified)}</span>
                        </div>
                      </div>
                      <button onClick={() => setFile(null)} className="text-[var(--text-3)] hover:text-[var(--danger)]">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) accept(f);
                  }}
                />
              </>
            )}

            {tab === 'text' && (
              <div>
                <Textarea
                  rows={8}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="粘贴需要存证的文本内容，例如小说章节、文案定稿、代码片段…"
                />
                <div className="mt-2 flex justify-between text-[11px] text-[var(--text-3)]">
                  <span>内容会以 UTF-8 编码计算 SHA-256 指纹，仅哈希上链，原文不会离开本地</span>
                  <span className="num">{text.length} 字符</span>
                </div>
              </div>
            )}

            {tab === 'web' && (
              <div className="space-y-3">
                <Field label="网页地址" required>
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    prefix={<Globe size={13} />}
                    placeholder="https://"
                  />
                </Field>
                <div className="rounded-lg border border-[rgba(34,211,238,.2)] bg-[rgba(34,211,238,.05)] px-3.5 py-3 text-[11.5px] leading-relaxed text-[var(--text-2)]">
                  系统会抓取页面快照并固化 DOM、截图与时间戳，形成完整的网页存证证据。若需固定动态内容，建议同时使用
                  <button onClick={() => nav('/forensics/web')} className="mx-1 text-[var(--brand-2)] hover:underline">网页取证</button>
                  功能进行录屏。
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard title="存证信息" desc="这些信息会随存证一起上链，公开后可被任何人核验">
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <Field label="存证标题" required className="col-span-2">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="给这份证据起一个便于检索的名称" maxLength={60} />
              </Field>
              <Field label="存证类型" required>
                <Select
                  value={type}
                  onChange={(v) => setType(v as EvidenceType)}
                  options={Object.entries(EVIDENCE_TYPE).map(([k, v]) => ({ value: k, label: v.label }))}
                />
              </Field>
              <Field label="关联权属" hint="关联后可在权属详情中直接查看该证据">
                <Select value={rightsId} onChange={setRightsId} options={rightsOptions} placeholder="不关联" />
              </Field>
              <Field label="标签" className="col-span-2" hint="回车添加，最多 5 个">
                <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-[var(--stroke)] bg-[var(--bg-card-2)] px-2.5 py-1.5">
                  {tags.map((t) => (
                    <span key={t} className="tag">
                      {t}
                      <button className="ml-1 text-[var(--text-3)] hover:text-[var(--danger)]" onClick={() => setTags(tags.filter((x) => x !== t))}>
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder={tags.length ? '' : '输入后回车添加'}
                    className="h-6 min-w-[120px] flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-[var(--text-3)]"
                  />
                </div>
              </Field>
              <Field label="隐私级别" className="col-span-2">
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { k: 'private' as const, t: '私有', d: '仅本人可见，哈希对外可验' },
                    { k: 'org' as const, t: '组织可见', d: '本组织成员可查看详情' },
                    { k: 'public' as const, t: '公开', d: '任何人可通过编号验真' },
                  ].map((p) => (
                    <button
                      key={p.k}
                      onClick={() => setPrivacy(p.k)}
                      className={cn(
                        'rounded-[9px] border px-3 py-2.5 text-left transition-all',
                        privacy === p.k
                          ? 'border-[rgba(34,211,238,.5)] bg-[rgba(34,211,238,.06)]'
                          : 'border-[var(--stroke)] bg-[var(--bg-card-2)] hover:border-[var(--stroke-strong)]',
                      )}
                    >
                      <div className="text-[12px] text-[var(--text-1)]">{p.t}</div>
                      <div className="mt-0.5 text-[10.5px] leading-relaxed text-[var(--text-3)]">{p.d}</div>
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="备注" className="col-span-2">
                <Textarea rows={3} value={remark} onChange={(e) => setRemark(e.target.value)} maxLength={200} placeholder="补充创作背景、交付说明等信息（选填）" />
              </Field>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-[var(--stroke)] pt-4">
              <div className="flex items-center gap-1.5 text-[11.5px] text-[var(--text-3)]">
                <ShieldCheck size={13} className="text-[var(--ok)]" />
                文件仅在本地计算哈希，原文不上传，存证过程不可篡改
              </div>
              <Button variant="primary" icon={<Hash size={14} />} onClick={run} disabled={busy}>
                计算哈希并上链
              </Button>
            </div>
          </SectionCard>
        </div>

        <div className="col-span-2 space-y-4">
          <SectionCard title="上链流程">
            <div className="space-y-3.5">
              {[
                { t: '本地计算 SHA-256', d: '在浏览器内完成，原始文件不出本地', icon: Hash },
                { t: '广播至联盟链', d: '交易提交到 7 个节点中的 4 个共识节点', icon: Globe },
                { t: '等待区块确认', d: 'PBFT 一次确认即终局，约 2.4 秒', icon: Loader2 },
                { t: '签发存证证书', d: '生成含二维码的电子证书，支持下载', icon: ShieldCheck },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={s.t} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full border border-[var(--stroke)] bg-white/[0.03] text-[10px] text-[var(--brand-2)]">
                      <Icon size={12} />
                    </span>
                    <div>
                      <div className="text-[12.5px] text-[var(--text-1)]">
                        {i + 1}. {s.t}
                      </div>
                      <div className="mt-0.5 text-[11px] leading-relaxed text-[var(--text-3)]">{s.d}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="链上信息" desc="星火联盟链 XH-Chain">
            <div className="space-y-0">
              {[
                ['链名称', '星火联盟链'],
                ['链 ID', 'xh-mainnet'],
                ['共识算法', 'PBFT'],
                ['出块间隔', '2.1 秒'],
                ['当前高度', db.blocks[0].height.toLocaleString()],
                ['参与节点', '7 个（含 2 个司法节点）'],
              ].map(([k, v]) => (
                <div key={k} className="kv">
                  <span className="kv-k">{k}</span>
                  <span className="kv-v font-mono text-[12px]">{v}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="存证小贴士">
            <ul className="space-y-2.5 text-[11.5px] leading-relaxed text-[var(--text-2)]">
              <li>· 同一文件重复存证会得到相同的哈希，可用于证明「文件未被修改」。</li>
              <li>· 建议在作品完成后 <span className="text-[var(--text-1)]">立即存证</span>，时间戳越早，举证效力越强。</li>
              <li>· 涉及商业秘密的文件请选择「私有」，仅哈希对外可验，原文不会泄露。</li>
              <li>· 存证后可在「权属登记」中关联该证据，形成完整的权属证明链。</li>
            </ul>
          </SectionCard>
        </div>
      </div>

      {/* ---------------- 上链动画 ---------------- */}
      {stage > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(3,6,12,.82)] backdrop-blur-[6px]">
          <div className="w-[560px] rounded-[14px] border border-[var(--stroke-strong)] bg-[var(--bg-card)] p-7 shadow-[0_40px_100px_-40px_rgba(0,0,0,1)]">
            {stage < 4 ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="relative flex h-10 w-10 items-center justify-center">
                    <span className="absolute inset-0 animate-ping rounded-full bg-[rgba(34,211,238,.14)]" />
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(34,211,238,.4)] bg-[rgba(34,211,238,.1)]">
                      <Hash size={17} className="text-[var(--brand-2)]" />
                    </span>
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold">
                      {stage === 1 ? '正在计算数字指纹' : stage === 2 ? '正在广播至联盟链' : '等待区块确认'}
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-[var(--text-3)]">
                      {stage === 1 ? 'SHA-256 · 本地计算，文件不会离开设备' : stage === 2 ? '已提交至 4 个共识节点' : 'PBFT 共识进行中，约 2.4 秒'}
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-[9px] border border-[var(--stroke)] bg-[#070C15] px-4 py-3">
                  <div className="mb-1.5 text-[10px] tracking-[1px] text-[var(--text-3)]">FILE DIGEST · SHA-256</div>
                  <div className="break-all font-mono text-[11.5px] leading-relaxed text-[var(--brand-2)]">
                    {typed}
                    {stage === 1 && <span className="ml-0.5 inline-block h-3 w-[6px] animate-pulse bg-[var(--brand-2)] align-middle" />}
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-[11px] text-[var(--text-3)]">
                    <span>{stage === 1 ? '哈希计算完成' : stage === 2 ? '交易广播' : '区块确认'}</span>
                    <span className="num">{stage === 1 ? '33%' : stage === 2 ? '66%' : `${Math.round(66 + progress * 0.34)}%`}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#3D7DFF] to-[#22D3EE] transition-all duration-300"
                      style={{ width: `${stage === 1 ? 33 : stage === 2 ? 66 : 66 + progress * 0.34}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-6 gap-2">
                  {NODES.map((n, i) => {
                    const on = stage >= 2 && i < 6;
                    return (
                      <div key={n} className="text-center">
                        <div
                          className={cn(
                            'mx-auto h-1.5 w-1.5 rounded-full transition-all duration-300',
                            on ? 'bg-[var(--brand-2)] shadow-[0_0_8px_var(--brand-2)]' : 'bg-white/15',
                          )}
                        />
                        <div className={cn('mt-1.5 text-[9.5px] transition-colors', on ? 'text-[var(--text-2)]' : 'text-[var(--text-3)]')}>{n}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 animate-[fadeUp_.32s_ease-out] items-center justify-center rounded-full bg-[rgba(45,212,167,.12)] ring-1 ring-[rgba(45,212,167,.4)]">
                  <Check size={26} className="text-[var(--ok)]" />
                </div>
                <h3 className="mt-4 text-[16px] font-semibold">存证成功</h3>
                <p className="mt-1 text-[12px] text-[var(--text-3)]">数字指纹已写入星火联盟链，证书已签发</p>

                <div className="mt-5 space-y-0 rounded-[10px] border border-[var(--stroke)] bg-[var(--bg-card-2)] px-4 py-1 text-left">
                  <div className="kv">
                    <span className="kv-k">存证编号</span>
                    <span className="kv-v font-mono text-[12px] text-[var(--brand-2)]">{created?.id}</span>
                  </div>
                  <div className="kv">
                    <span className="kv-k">区块高度</span>
                    <span className="kv-v font-mono text-[12px]">#{created?.blockHeight.toLocaleString()}</span>
                  </div>
                  <div className="kv">
                    <span className="kv-k">交易哈希</span>
                    <span className="kv-v break-all font-mono text-[11px]">{created?.txHash}</span>
                  </div>
                  <div className="kv">
                    <span className="kv-k">存证时间</span>
                    <span className="kv-v font-mono text-[12px]">{fmtTime(created?.createdAt)}</span>
                  </div>
                </div>

                <div className="mt-6 flex gap-2.5">
                  <Button className="flex-1" onClick={reset}>
                    继续存证
                  </Button>
                  <Button variant="primary" className="flex-1" onClick={() => nav(`/evidence/${created?.id}`)}>
                    查看证书
                    <ArrowRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
