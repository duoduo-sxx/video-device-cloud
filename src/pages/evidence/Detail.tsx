import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Copy, Download, FileQuestion, Link2, ShieldCheck, XCircle } from 'lucide-react';
import { Button, CopyButton, HashText, StatusPill, Tag } from '@/components/ui/core';
import { PageHeader, SectionCard } from '@/components/ui/page';
import { Timeline } from '@/components/ui/data';
import { CertificateCard } from '@/components/business';
import { mockApi } from '@/mock/api';
import { EVIDENCE_STATUS, EVIDENCE_TYPE } from '@/utils/constants';
import { fmtSize, fmtTime, shortHash } from '@/utils/format';
import type { Evidence } from '@/types';
import { toast } from 'sonner';

export default function EvidenceDetail() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState<Evidence | null | undefined>(undefined);

  useEffect(() => {
    mockApi.evidence.detail(id).then((d) => setData(d ?? null));
  }, [id]);

  if (data === undefined) {
    return (
      <div className="page">
        <div className="mb-5 h-7 w-56 skel" />
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 h-[520px] skel" />
          <div className="h-[320px] skel" />
        </div>
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="page flex flex-col items-center justify-center py-32">
        <FileQuestion size={40} className="text-[var(--text-3)]" />
        <div className="mt-4 text-[15px] text-[var(--text-1)]">未找到该存证记录</div>
        <div className="mt-1 text-[12px] text-[var(--text-3)]">存证编号 {id} 不存在，或已被撤销</div>
        <Button className="mt-5" onClick={() => nav('/evidence')}>返回存证列表</Button>
      </div>
    );
  }

  const st = EVIDENCE_STATUS[data.status];

  return (
    <div className="page">
      <PageHeader
        back
        title={data.title}
        desc={`${data.id} · ${EVIDENCE_TYPE[data.type].label} · ${data.orgName}`}
        tag={<StatusPill label={st.label} tone={st.tone} />}
        actions={
          <>
            <Button onClick={() => nav('/evidence/verify')}>哈希核验</Button>
            <Button icon={<Download size={14} />} onClick={() => toast.success(`证书 ${data.certificateNo ?? data.id} 已开始下载`)}>
              下载证书
            </Button>
            <Button variant="primary" icon={<Link2 size={14} />} onClick={() => toast.success('验真链接已复制到剪贴板')}>
              分享验真
            </Button>
          </>
        }
      />

      {data.status === 'failed' && (
        <div className="mb-4 flex items-center gap-2.5 rounded-[10px] border border-[rgba(255,92,122,.3)] bg-[rgba(255,92,122,.07)] px-4 py-3">
          <XCircle size={15} className="flex-none text-[var(--danger)]" />
          <div className="text-[12px] text-[var(--text-2)]">
            <span className="text-[var(--danger)]">上链失败：</span>
            {data.errorMsg ?? 'ERR_NODE_TIMEOUT 节点响应超时'}
          </div>
          <Button size="xs" className="ml-auto" onClick={() => toast.success('已重新提交上链，预计 3 秒内完成')}>
            重试上链
          </Button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <SectionCard
            title="链上信息"
            desc="数据写入星火联盟链后的不可篡改记录"
            extra={<span className="flex items-center gap-1.5 text-[11px] text-[var(--ok)]"><ShieldCheck size={12} />已确认</span>}
          >
            <div className="grid grid-cols-2 gap-x-8">
              {[
                ['交易哈希', <HashText key="1" value={data.txHash} head={12} tail={8} />],
                ['区块高度', <button key="2" className="font-mono text-[12px] text-[var(--brand-2)] hover:underline" onClick={() => nav(`/chain/blocks/${data.blockHeight}`)}>#{data.blockHeight.toLocaleString()}</button>],
                ['区块哈希', <HashText key="3" value={data.blockHash} head={12} tail={8} />],
                ['确认数', <span key="4" className="font-mono text-[12px]">{data.confirmations.toLocaleString()}</span>],
                ['链名称', <span key="5" className="text-[12px]">{data.chainName}（{data.chainId}）</span>],
                ['共识算法', <span key="6" className="text-[12px]">PBFT · 4/7 节点确认</span>],
                ['上链时间', <span key="7" className="font-mono text-[12px]">{fmtTime(data.confirmedAt ?? data.createdAt)}</span>],
                ['交易手续费', <span key="8" className="text-[12px]">0 XH <span className="text-[var(--text-3)]">（联盟链免 Gas）</span></span>],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex items-baseline gap-3 border-b border-dashed border-white/[0.055] py-2.5">
                  <span className="w-[76px] flex-none text-[12px] text-[var(--text-3)]">{k}</span>
                  <span className="min-w-0 flex-1">{v}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="存证证书" desc="可下载 PDF 或分享验真链接，任何人可核验证书真伪">
            <CertificateCard
              kind="evidence"
              no={data.certificateNo ?? `XH-EV-${data.createdAt.slice(0, 7)}-000000`}
              title={data.title}
              ownerName={data.ownerName}
              hash={data.hash}
              blockHeight={data.blockHeight}
              txHash={data.txHash}
              issuedAt={data.confirmedAt ?? data.createdAt}
            />
          </SectionCard>

          <SectionCard title="操作日志" desc="从创建到证书签发的完整过程">
            <Timeline
              items={[
                { title: '创库存证记录', time: fmtTime(data.createdAt), desc: `操作人 ${data.ownerName} · 来源 ${data.source === 'web' ? '网页端' : data.source === 'api' ? 'API 接口' : data.source === 'batch' ? '批量上传' : '命令行'}` },
                { title: 'SHA-256 哈希计算完成', time: fmtTime(data.createdAt), desc: `数字指纹 ${shortHash(data.hash, 14, 10)}` },
                { title: '交易广播至共识节点', time: fmtTime(data.createdAt), desc: '已提交至北京、杭州、深圳、成都 4 个共识节点' },
                { title: '区块确认', time: fmtTime(data.confirmedAt ?? data.createdAt), desc: `打包进区块 #${data.blockHeight.toLocaleString()}，确认数 ${data.confirmations.toLocaleString()}`, extra: <HashText value={data.txHash} head={10} tail={6} /> },
                { title: '证书签发', time: fmtTime(data.confirmedAt ?? data.createdAt), desc: `证书编号 ${data.certificateNo ?? '—'}` },
              ]}
            />
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="文件信息">
            <div className="space-y-0">
              {[
                ['文件名', data.fileName],
                ['文件大小', fmtSize(data.fileSize)],
                ['文件类型', EVIDENCE_TYPE[data.type].label],
                ['MIME', data.mimeType],
                ['算法', 'SHA-256'],
              ].map(([k, v]) => (
                <div key={k} className="kv">
                  <span className="kv-k">{k}</span>
                  <span className="kv-v break-all text-[12px]">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-[9px] border border-[var(--stroke)] bg-[#070C15] px-3 py-2.5">
              <div className="mb-1.5 text-[10px] tracking-[1px] text-[var(--text-3)]">FILE HASH · SHA-256</div>
              <div className="break-all font-mono text-[10.5px] leading-relaxed text-[var(--brand-2)]">{data.hash}</div>
            </div>
          </SectionCard>

          <SectionCard title="验真二维码" desc="扫码跳转至公开验真页">
            <div className="flex items-center gap-4">
              <div className="rounded-lg border border-[var(--stroke)] bg-white p-2">
                <QRBlock value={`https://verify.xh-chain.cn/${data.certificateNo ?? data.id}`} />
              </div>
              <div className="text-[11.5px] leading-relaxed text-[var(--text-3)]">
                累计验真 <span className="text-[var(--text-1)]">{data.verifyCount}</span> 次
                <br />
                最近一次核验 {fmtTime(data.createdAt)}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="权属与标签">
            <div className="space-y-3">
              <div>
                <div className="mb-1.5 text-[11.5px] text-[var(--text-3)]">关联权属</div>
                {data.relatedRightsId ? (
                  <button
                    onClick={() => nav(`/rights/${data.relatedRightsId}`)}
                    className="flex w-full items-center justify-between rounded-lg border border-[var(--stroke)] bg-[var(--bg-card-2)] px-3 py-2.5 text-left transition-colors hover:border-[var(--stroke-strong)]"
                  >
                    <div>
                      <div className="text-[12px] text-[var(--text-1)]">{data.relatedRightsId}</div>
                      <div className="mt-0.5 text-[10.5px] text-[var(--text-3)]">已登记权属，可查看完整证据链</div>
                    </div>
                    <span className="text-[11px] text-[var(--brand-2)]">查看</span>
                  </button>
                ) : (
                  <div className="rounded-lg border border-dashed border-[var(--stroke)] px-3 py-2.5 text-[11.5px] text-[var(--text-3)]">
                    尚未关联权属，可前往「权属登记」建立证据链
                  </div>
                )}
              </div>
              <div>
                <div className="mb-1.5 text-[11.5px] text-[var(--text-3)]">标签</div>
                <div className="flex flex-wrap gap-1.5">
                  {data.tags.length ? data.tags.map((t) => <Tag key={t}>{t}</Tag>) : <span className="text-[11.5px] text-[var(--text-3)]">无标签</span>}
                </div>
              </div>
              <div>
                <div className="mb-1.5 text-[11.5px] text-[var(--text-3)]">备注</div>
                <p className="text-[11.5px] leading-relaxed text-[var(--text-2)]">{data.remark ?? '—'}</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="快捷操作">
            <div className="space-y-2">
              <Button className="w-full" icon={<Download size={13} />} onClick={() => toast.success('证书已开始下载')}>下载存证证书</Button>
              <Button className="w-full" icon={<Copy size={13} />} onClick={() => { navigator.clipboard?.writeText(data.txHash); toast.success('交易哈希已复制'); }}>
                复制交易哈希
              </Button>
              <Button className="w-full" icon={<Link2 size={13} />} onClick={() => nav('/forensics/packages')}>加入证据包</Button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function QRBlock({ value }: { value: string }) {
  // 简易二维码占位：用 21x21 网格根据字符串哈希生成，避免额外依赖
  const cells = [];
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  for (let y = 0; y < 21; y++) {
    for (let x = 0; x < 21; x++) {
      const corner = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
      const on = corner ? (x === 0 || y === 0 || x === 6 || y === 6 || (x > 1 && x < 5 && y > 1 && y < 5)) : ((h >> ((x * 3 + y * 7) % 24)) & 1) === 1;
      if (on) cells.push(<rect key={`${x}-${y}`} x={x * 4} y={y * 4} width={4} height={4} fill="#16202E" />);
    }
  }
  return <svg width={84} height={84}>{cells}</svg>;
}
