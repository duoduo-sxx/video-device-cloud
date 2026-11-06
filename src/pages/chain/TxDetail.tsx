import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, FileSearch, ShieldCheck } from 'lucide-react';
import { Button, HashText, StatusPill, Tag } from '@/components/ui/core';
import { PageHeader, SectionCard } from '@/components/ui/page';
import { mockApi, db } from '@/mock/api';
import { TX_TYPE } from '@/utils/constants';
import { fmtTime } from '@/utils/format';
import type { Transaction } from '@/types';

export default function TxDetail() {
  const { hash = '' } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState<Transaction | null | undefined>(undefined);
  const [raw, setRaw] = useState(false);

  useEffect(() => {
    mockApi.chain.txDetail(hash).then((t) => setData(t ?? null));
  }, [hash]);

  if (data === undefined) return <div className="page"><div className="h-[400px] skel" /></div>;
  if (data === null) {
    return (
      <div className="page flex flex-col items-center py-32">
        <FileSearch size={38} className="text-[var(--text-3)]" />
        <div className="mt-4 text-[15px]">未找到该交易</div>
        <div className="mt-1 max-w-[520px] break-all text-center font-mono text-[11px] text-[var(--text-3)]">{hash}</div>
        <Button className="mt-5" onClick={() => nav('/chain/txs')}>返回交易列表</Button>
      </div>
    );
  }

  const ev = db.evidences.find((e) => e.id === data.bizId);
  const rt = db.rights.find((r) => r.id === data.bizId);
  const ct = db.contracts.find((c) => c.id === data.bizId);

  return (
    <div className="page">
      <PageHeader
        back
        title="交易详情"
        desc={data.bizTitle}
        tag={<Tag tone={TX_TYPE[data.type].tone}>{TX_TYPE[data.type].label}</Tag>}
        actions={<Button onClick={() => nav(`/chain/blocks/${data.blockHeight}`)}>查看所在区块</Button>}
      />

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <SectionCard title="交易信息" extra={<StatusPill label={data.status === 'success' ? '执行成功' : '执行失败'} tone={data.status === 'success' ? 'green' : 'red'} />}>
            <div className="grid grid-cols-2 gap-x-8">
              {[
                ['交易哈希', <HashText key="1" value={data.hash} head={22} tail={12} />],
                ['交易类型', <Tag key="2" tone={TX_TYPE[data.type].tone}>{TX_TYPE[data.type].label}</Tag>],
                ['所在区块', <button key="3" className="font-mono text-[12px] text-[var(--brand-2)] hover:underline" onClick={() => nav(`/chain/blocks/${data.blockHeight}`)}>#{data.blockHeight.toLocaleString()}</button>],
                ['确认数', <span key="4" className="num text-[12px]">{data.confirmations.toLocaleString()}</span>],
                ['发起地址', <HashText key="5" value={data.from} head={14} tail={8} />],
                ['合约地址', <HashText key="6" value={data.to} head={14} tail={8} />],
                ['业务编号', <span key="7" className="font-mono text-[12px]">{data.bizId}</span>],
                ['交易时间', <span key="8" className="font-mono text-[12px]">{fmtTime(data.timestamp)}</span>],
                ['手续费', <span key="9" className="text-[12px]">0 XH（联盟链免 Gas）</span>],
                ['执行结果', <span key="10" className="text-[12px]">{data.status === 'success' ? '合约执行成功，事件已写入' : '合约执行回滚'}</span>],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex items-baseline gap-3 border-b border-dashed border-white/[0.055] py-3">
                  <span className="w-[76px] flex-none text-[12px] text-[var(--text-3)]">{k}</span>
                  <span className="min-w-0 flex-1 break-all text-[12px] text-[var(--text-1)]">{v}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="原始数据"
            desc="合约调用参数与事件日志"
            extra={
              <button className="flex items-center gap-1 text-[11.5px] text-[var(--brand-2)]" onClick={() => setRaw(!raw)}>
                {raw ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                {raw ? '收起' : '展开'}
              </button>
            }
          >
            {raw ? (
              <pre className="max-h-[420px] overflow-auto rounded-[9px] border border-[var(--stroke)] bg-[#070C15] p-4 font-mono text-[11px] leading-relaxed">
                {JSON.stringify(
                  {
                    transactionHash: data.hash,
                    blockNumber: data.blockHeight,
                    from: data.from,
                    to: data.to,
                    status: data.status,
                    input: data.payload,
                    logs: [
                      {
                        address: data.to,
                        topics: [data.hash.slice(0, 34), `0x${data.bizId.replace(/[^a-zA-Z0-9]/g, '')}`],
                        data: '0x' + data.hash.slice(2, 66),
                      },
                    ],
                    gasUsed: 0,
                    timestamp: data.timestamp,
                  },
                  null,
                  2,
                )
                  .split('\n')
                  .map((line, i) => (
                    <div key={i}>
                      {line.split(/(".*?":|[{}\[\],])/g).map((seg, k) =>
                        /^"/.test(seg) ? (
                          <span key={k} className="text-[#9CC2FF]">{seg}</span>
                        ) : /^[{}\[\],]$/.test(seg) ? (
                          <span key={k} className="text-[var(--text-3)]">{seg}</span>
                        ) : (
                          <span key={k} className="text-[var(--text-2)]">{seg}</span>
                        ),
                      )}
                    </div>
                  ))}
              </pre>
            ) : (
              <div className="rounded-[9px] border border-[var(--stroke)] bg-[#070C15] px-4 py-3 font-mono text-[11px] text-[var(--text-3)]">
                点击「展开」查看完整 JSON 数据
              </div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="关联业务对象" desc="该交易对应的业务记录">
            {ev && (
              <button onClick={() => nav(`/evidence/${ev.id}`)} className="w-full rounded-[9px] border border-[var(--stroke)] bg-[var(--bg-card-2)] p-3.5 text-left transition-colors hover:border-[var(--stroke-strong)]">
                <div className="flex items-center gap-2">
                  <Tag tone="cyan">存证</Tag>
                  <span className="font-mono text-[10.5px] text-[var(--text-3)]">{ev.id}</span>
                </div>
                <div className="mt-1.5 text-[12.5px] text-[var(--text-1)]">{ev.title}</div>
                <div className="mt-1 font-mono text-[10.5px] text-[var(--text-3)]">{ev.fileName}</div>
                <div className="mt-2"><HashText value={ev.hash} head={12} tail={6} /></div>
              </button>
            )}
            {rt && (
              <button onClick={() => nav(`/rights/${rt.id}`)} className="w-full rounded-[9px] border border-[var(--stroke)] bg-[var(--bg-card-2)] p-3.5 text-left transition-colors hover:border-[var(--stroke-strong)]">
                <div className="flex items-center gap-2">
                  <Tag tone="blue">权属</Tag>
                  <span className="font-mono text-[10.5px] text-[var(--text-3)]">{rt.id}</span>
                </div>
                <div className="mt-1.5 text-[12.5px] text-[var(--text-1)]">{rt.title}</div>
                <div className="mt-1 text-[10.5px] text-[var(--text-3)]">权利人 {rt.owner.name}</div>
              </button>
            )}
            {ct && (
              <button onClick={() => nav(`/contracts/${ct.id}`)} className="w-full rounded-[9px] border border-[var(--stroke)] bg-[var(--bg-card-2)] p-3.5 text-left transition-colors hover:border-[var(--stroke-strong)]">
                <div className="flex items-center gap-2">
                  <Tag tone="violet">合同</Tag>
                  <span className="font-mono text-[10.5px] text-[var(--text-3)]">{ct.id}</span>
                </div>
                <div className="mt-1.5 text-[12.5px] text-[var(--text-1)]">{ct.title}</div>
              </button>
            )}
            {!ev && !rt && !ct && (
              <div className="rounded-[9px] border border-dashed border-[var(--stroke)] px-3 py-6 text-center text-[11.5px] text-[var(--text-3)]">
                该交易为链上治理或授权类操作
              </div>
            )}
          </SectionCard>

          <SectionCard title="执行轨迹">
            <div className="space-y-3">
              {[
                ['交易签名校验', '通过 · ECDSA secp256k1'],
                ['节点广播', '4 个共识节点已接收'],
                ['合约执行', `调用 ${data.payload.contract ?? 'EvidenceRegistry'}.${data.payload.method ?? 'attest'}`],
                ['状态写入', 'Merkle 树已更新'],
                ['区块确认', `#${data.blockHeight.toLocaleString()} 已终局`],
              ].map(([k, v], i) => (
                <div key={k} className="flex gap-3">
                  <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-[rgba(45,212,167,.16)] text-[9px] text-[var(--ok)]">✓</span>
                  <div>
                    <div className="text-[11.5px] text-[var(--text-1)]">{k}</div>
                    <div className="mt-0.5 font-mono text-[10.5px] text-[var(--text-3)]">{v}</div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="card card-pad flex items-start gap-2.5">
            <ShieldCheck size={14} className="mt-0.5 flex-none text-[var(--ok)]" />
            <p className="text-[11px] leading-relaxed text-[var(--text-3)]">
              交易一旦确认即不可篡改。若需核验存证文件，请前往
              <button className="mx-1 text-[var(--brand-2)] hover:underline" onClick={() => nav('/evidence/verify')}>哈希核验</button>
              上传原始文件比对。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
