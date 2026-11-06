import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BadgeCheck, Download, FileSignature, Send, ShieldCheck } from 'lucide-react';
import { Avatar, Button, HashText, StatusPill, Tag } from '@/components/ui/core';
import { PageHeader, SectionCard } from '@/components/ui/page';
import { Timeline } from '@/components/ui/data';
import { DocPaper, SealStamp } from '@/components/business';
import { mockApi } from '@/mock/api';
import { CONTRACT_STATUS } from '@/utils/constants';
import { fmtMoney, fmtTime } from '@/utils/format';
import type { Contract } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';

export default function ContractDetail() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState<Contract | null | undefined>(undefined);
  const [signing, setSigning] = useState<string | null>(null);

  useEffect(() => {
    mockApi.contract.detail(id).then((c) => setData(c ?? null));
  }, [id]);

  if (data === undefined) return <div className="page"><div className="h-[520px] skel" /></div>;
  if (data === null) {
    return (
      <div className="page flex flex-col items-center py-32">
        <FileSignature size={38} className="text-[var(--text-3)]" />
        <div className="mt-4 text-[15px]">未找到该合同</div>
        <Button className="mt-5" onClick={() => nav('/contracts')}>返回合同列表</Button>
      </div>
    );
  }

  const st = CONTRACT_STATUS[data.status];
  const signedCount = data.signers.filter((s) => s.status === 'signed').length;

  const sign = async (signerId: string) => {
    setSigning(signerId);
    await new Promise((r) => setTimeout(r, 700));
    const updated = await mockApi.contract.sign(data.id, signerId);
    if (updated) setData({ ...updated, signers: [...updated.signers] });
    setSigning(null);
    toast.success('签署完成，已写入链上时间戳');
  };

  return (
    <div className="page">
      <PageHeader
        back
        title={data.title}
        desc={`${data.id} · ${data.category} · 由 ${data.createdBy} 发起`}
        tag={<StatusPill label={st.label} tone={st.tone} />}
        actions={
          <>
            <Button icon={<Download size={14} />} onClick={() => toast.success('合同 PDF 已开始下载')}>下载合同</Button>
            {data.status !== 'completed' && (
              <Button variant="primary" icon={<Send size={14} />} onClick={() => toast.success('已发送签署提醒')}>催签</Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <SectionCard title="合同正文" desc="正文哈希已固化，任何修改都会导致验签失败">
            <DocPaper>
              <div className="text-center">
                <h2 className="text-[17px] font-semibold tracking-[1px]">{data.title}</h2>
                <div className="mt-1 text-[10px] tracking-[2px] text-[#7D8CA1]">CONTRACT NO. {data.id}</div>
                <div className="mx-auto mt-3 h-px w-20 bg-[#C6D2DF]" />
              </div>
              <div className="mt-5 space-y-3 text-[11.5px] leading-[2] text-[#2C3847]">
                {data.content.split('\n').filter(Boolean).map((p, i) => (
                  <p key={i} className={p.startsWith('第') || p.startsWith('鉴于') ? 'font-medium' : ''}>
                    {p}
                  </p>
                ))}
              </div>
              <div className="mt-8 grid grid-cols-2 gap-8 border-t border-dashed border-[#D5DEE8] pt-5">
                {data.signers.slice(0, 2).map((s, i) => (
                  <div key={s.id}>
                    <div className="text-[10.5px] text-[#7D8CA1]">{i === 0 ? '甲方（盖章）' : '乙方（盖章）'}</div>
                    <div className="mt-1 text-[11.5px] text-[#2C3847]">{s.name}</div>
                    <div className="relative mt-3 h-[60px]">
                      {s.status === 'signed' ? (
                        <div className="absolute left-0 top-0 opacity-90">
                          <SealStamp size={62} text={`${s.sealText ?? s.name.slice(0, 4)}合同专用章`} />
                        </div>
                      ) : (
                        <div className="flex h-[52px] items-center justify-center rounded border border-dashed border-[#C6D2DF] text-[10px] text-[#9AA8BF]">
                          待签署
                        </div>
                      )}
                    </div>
                    <div className="mt-1 text-[10px] text-[#8794A8]">签署日期：{s.signedAt ? fmtTime(s.signedAt) : '—'}</div>
                  </div>
                ))}
              </div>
            </DocPaper>
          </SectionCard>

          <SectionCard title="验签信息" desc="合同完整性核验结果">
            <div className="grid grid-cols-2 gap-x-8">
              {[
                ['合同哈希', <HashText key="1" value={data.hash} head={12} tail={8} />],
                ['存证编号', data.evidenceId ? <button key="2" className="font-mono text-[12px] text-[var(--brand-2)] hover:underline" onClick={() => nav(`/evidence/${data.evidenceId}`)}>{data.evidenceId}</button> : <span key="2" className="text-[var(--text-3)]">签署完成后生成</span>],
                ['链上交易', data.txHash ? <HashText key="3" value={data.txHash} head={12} tail={8} /> : <span key="3" className="text-[var(--text-3)]">—</span>],
                ['合同金额', <span key="4" className="num">{fmtMoney(data.amount)}</span>],
                ['签署截止', <span key="5" className="font-mono text-[12px]">{fmtTime(data.expireAt)}</span>],
                ['验签结论', data.status === 'completed' ? <span key="6" className="flex items-center gap-1 text-[var(--ok)]"><BadgeCheck size={13} />验签通过</span> : <span key="6" className="text-[var(--text-3)]">待全部签署后生成</span>],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex items-baseline gap-3 border-b border-dashed border-white/[0.055] py-2.5">
                  <span className="w-[76px] flex-none text-[12px] text-[var(--text-3)]">{k}</span>
                  <span className="min-w-0 flex-1 text-[12px] text-[var(--text-1)]">{v}</span>
                </div>
              ))}
            </div>
            {data.status === 'completed' && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-[rgba(45,212,167,.28)] bg-[rgba(45,212,167,.07)] px-3.5 py-2.5">
                <ShieldCheck size={14} className="text-[var(--ok)]" />
                <span className="text-[11.5px] text-[var(--text-2)]">
                  合同全文哈希与链上存证记录一致，签署行为、签署时间、签署主体均已固化，可作为有效电子证据使用。
                </span>
              </div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="签署进度" desc={`${signedCount} / ${data.signers.length} 方已签署`}>
            <div className="space-y-2.5">
              {data.signers.map((s, i) => (
                <div
                  key={s.id}
                  className={cn(
                    'rounded-[9px] border px-3.5 py-3',
                    s.status === 'signed'
                      ? 'border-[rgba(45,212,167,.3)] bg-[rgba(45,212,167,.05)]'
                      : 'border-[var(--stroke)] bg-[var(--bg-card-2)]',
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar name={s.name} color={['#3D7DFF', '#22D3EE', '#8B5CF6'][i % 3]} size={26} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12.5px] text-[var(--text-1)]">{s.name}</div>
                      <div className="text-[10.5px] text-[var(--text-3)]">{i === 0 ? '甲方' : '乙方'} · {s.phone.replace(/(\d{3})\d{4}/, '$1****')}</div>
                    </div>
                    <Tag tone={s.status === 'signed' ? 'green' : s.status === 'rejected' ? 'red' : 'gray'}>
                      {s.status === 'signed' ? '已签署' : s.status === 'rejected' ? '已拒签' : '待签署'}
                    </Tag>
                  </div>
                  {s.status === 'signed' ? (
                    <div className="mt-2 flex items-center justify-between text-[10.5px] text-[var(--text-3)]">
                      <span>{fmtTime(s.signedAt)}</span>
                      <span className="text-[var(--ok)]">签署有效</span>
                    </div>
                  ) : (
                    <Button
                      size="xs"
                      variant="primary"
                      className="mt-2.5 w-full"
                      loading={signing === s.id}
                      onClick={() => sign(s.id)}
                    >
                      模拟签署
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="合同事件">
            <Timeline
              items={[
                { title: '合同创建', time: fmtTime(data.createdAt), desc: `由 ${data.createdBy} 基于模板创建` },
                { title: '发起签署', time: fmtTime(data.createdAt), desc: `共 ${data.signers.length} 方参与，并行签署` },
                ...data.signers
                  .filter((s) => s.status === 'signed')
                  .map((s) => ({ title: `${s.name} 已签署`, time: fmtTime(s.signedAt), desc: '已完成实名认证与意愿校验' })),
                ...(data.status === 'completed'
                  ? [{ title: '合同存证完成', time: fmtTime(data.createdAt), desc: `已写入区块高度 #${2486921}`, extra: data.txHash ? <HashText value={data.txHash} head={8} tail={5} /> : undefined }]
                  : [{ title: '等待剩余签署方', time: '', desc: '全部签署后自动存证并生成验签报告', done: false }]),
              ]}
            />
          </SectionCard>

          <SectionCard title="合同信息">
            <div className="space-y-0">
              {[
                ['合同编号', data.id],
                ['合同类型', data.category],
                ['签署方式', '并行签署'],
                ['合同金额', fmtMoney(data.amount)],
                ['创建人', data.createdBy],
                ['关联模板', data.templateId],
              ].map(([k, v]) => (
                <div key={k} className="kv">
                  <span className="kv-k">{k}</span>
                  <span className="kv-v text-[12px]">{v}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
