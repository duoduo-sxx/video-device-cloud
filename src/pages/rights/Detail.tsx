import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftRight, Download, Gavel, ShieldCheck } from 'lucide-react';
import { Avatar, Button, HashText, StatusPill, Tag } from '@/components/ui/core';
import { PageHeader, SectionCard } from '@/components/ui/page';
import { Timeline } from '@/components/ui/data';
import { CertificateCard } from '@/components/business';
import { mockApi } from '@/mock/api';
import { RIGHTS_CATEGORY, RIGHTS_STATUS } from '@/utils/constants';
import { fmtDate, fmtTime } from '@/utils/format';
import type { Evidence, RightsRecord } from '@/types';
import { toast } from 'sonner';

export default function RightsDetail() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState<RightsRecord | null | undefined>(undefined);
  const [evidences, setEvidences] = useState<Evidence[]>([]);

  useEffect(() => {
    mockApi.rights.detail(id).then((r) => {
      setData(r ?? null);
      if (r) {
        Promise.all(r.evidenceIds.map((eid) => mockApi.evidence.detail(eid))).then((list) =>
          setEvidences(list.filter(Boolean) as Evidence[]),
        );
      }
    });
  }, [id]);

  if (data === undefined) {
    return (
      <div className="page">
        <div className="mb-5 h-7 w-64 skel" />
        <div className="h-[420px] skel" />
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="page flex flex-col items-center py-32">
        <ShieldCheck size={38} className="text-[var(--text-3)]" />
        <div className="mt-4 text-[15px]">未找到该权属记录</div>
        <div className="mt-1 text-[12px] text-[var(--text-3)]">登记号 {id} 不存在</div>
        <Button className="mt-5" onClick={() => nav('/rights')}>返回权属列表</Button>
      </div>
    );
  }

  const st = RIGHTS_STATUS[data.status];
  const cat = RIGHTS_CATEGORY[data.category];
  const totalShare = 100;

  return (
    <div className="page">
      <PageHeader
        back
        title={data.title}
        desc={`${data.id} · ${cat.label} · ${data.subCategory}`}
        tag={<StatusPill label={st.label} tone={st.tone} />}
        actions={
          <>
            <Button icon={<ArrowLeftRight size={14} />} onClick={() => toast.success('已打开转让流程，请选择受让方')}>
              发起转让
            </Button>
            <Button icon={<Download size={14} />} onClick={() => toast.success('权属证书已开始下载')}>
              下载证书
            </Button>
            <Button
              variant="primary"
              icon={<Gavel size={14} />}
              onClick={() => {
                if (data.disputeId) nav('/rights/disputes');
                else toast.success('异议申请已创建，请补充反证材料');
              }}
            >
              提起异议
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-4 gap-4">
        <div className="card card-pad col-span-2">
          <div className="flex items-start gap-4">
            <div className="flex h-[74px] w-[74px] flex-none items-center justify-center rounded-[10px] bg-gradient-to-br from-[rgba(61,125,255,.28)] to-[rgba(34,211,238,.12)] text-[26px] font-semibold text-[#9CC2FF] ring-1 ring-[rgba(61,125,255,.25)]">
              {data.title.replace(/[《》·\s]/g, '').slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold text-[var(--text-1)]">{data.title}</div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <Tag tone={cat.tone}>{cat.label}</Tag>
                <Tag>{data.subCategory}</Tag>
                <Tag tone="gray">{data.region}</Tag>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Avatar name={data.owner.name} color={data.owner.type === 'org' ? '#8B5CF6' : '#22D3EE'} size={22} />
                <span className="text-[12px] text-[var(--text-1)]">{data.owner.name}</span>
                <span className="font-mono text-[10.5px] text-[var(--text-3)]">{data.owner.did.slice(0, 24)}…</span>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[var(--stroke)] pt-3">
            {[
              ['登记日期', data.registeredAt ? fmtDate(data.registeredAt) : '审核中'],
              ['有效期至', data.validTo],
              ['关联存证', `${data.evidenceIds.length} 条`],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="text-[10.5px] text-[var(--text-3)]">{k}</div>
                <div className="mt-0.5 font-mono text-[12px] text-[var(--text-1)]">{v}</div>
              </div>
            ))}
          </div>
        </div>

        <SectionCard title="权利范围">
          <div className="flex flex-wrap gap-1.5">
            {data.rightScope.map((s) => (
              <span key={s} className="rounded-md border border-[rgba(61,125,255,.35)] bg-[rgba(61,125,255,.12)] px-2 py-1 text-[11.5px] text-[#9CC2FF]">
                {s}
              </span>
            ))}
          </div>
          <div className="mt-3 text-[11px] leading-relaxed text-[var(--text-3)]">
            权利范围已写入链上权属登记合约，超出范围的授权行为将被系统记录并可追溯。
          </div>
        </SectionCard>

        <SectionCard title="权属份额">
          <div className="flex items-center gap-4">
            <ShareRing owner={data.owner.name} ratio={data.owner.shareRatio ?? 100} />
            <div className="space-y-1.5 text-[11.5px]">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3D7DFF]" />
                <span className="text-[var(--text-2)]">{data.owner.name}</span>
                <span className="num ml-auto text-[var(--text-1)]">{data.owner.shareRatio ?? 100}%</span>
              </div>
              {data.coOwners.map((c, i) => (
                <div key={c.name + i} className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE]" />
                  <span className="text-[var(--text-2)]">{c.name}</span>
                  <span className="num ml-auto text-[var(--text-1)]">{c.shareRatio}%</span>
                </div>
              ))}
              {!data.coOwners.length && <div className="text-[11px] text-[var(--text-3)]">独有权利，无共有人</div>}
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <SectionCard title="权属信息">
            <div className="grid grid-cols-2 gap-x-8">
              {[
                ['登记号', <span key="1" className="font-mono text-[12px]">{data.id}</span>],
                ['证书编号', <span key="2" className="font-mono text-[12px] text-[var(--brand-2)]">{data.certificateNo ?? '待签发'}</span>],
                ['权利人类型', data.owner.type === 'person' ? '自然人' : '法人 / 组织'],
                ['证件号码', <span key="3" className="font-mono text-[12px]">{data.owner.idNo}</span>],
                ['链上 DID', <span key="4" className="break-all font-mono text-[11px]">{data.owner.did}</span>],
                ['首次发表日', data.firstPublishAt ? fmtDate(data.firstPublishAt) : '—'],
                ['生效日期', data.validFrom],
                ['失效日期', data.validTo],
                ['上链交易', <HashText key="5" value={data.txHash} head={10} tail={6} />],
                ['区块高度', <button key="6" className="font-mono text-[12px] text-[var(--brand-2)] hover:underline" onClick={() => nav(`/chain/blocks/${data.blockHeight}`)}>#{data.blockHeight.toLocaleString()}</button>],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex items-baseline gap-3 border-b border-dashed border-white/[0.055] py-2.5">
                  <span className="w-[82px] flex-none text-[12px] text-[var(--text-3)]">{k}</span>
                  <span className="min-w-0 flex-1 text-[12px] text-[var(--text-1)]">{v}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="关联存证"
            desc={`${data.evidenceIds.length} 条证据支撑本次权属登记`}
            extra={<Button size="sm" onClick={() => nav('/evidence')}>查看全部存证</Button>}
          >
            <div className="space-y-2">
              {evidences.map((e) => (
                <button
                  key={e.id}
                  onClick={() => nav(`/evidence/${e.id}`)}
                  className="flex w-full items-center gap-3 rounded-[9px] border border-[var(--stroke)] bg-[var(--bg-card-2)] px-3.5 py-2.5 text-left transition-colors hover:border-[var(--stroke-strong)] hover:bg-[var(--bg-hover)]"
                >
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[7px] bg-[rgba(61,125,255,.12)] text-[11px] text-[#9CC2FF]">
                    {e.type === 'image' ? '图' : e.type === 'video' ? '视' : e.type === 'design' ? '设' : '文'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] text-[var(--text-1)]">{e.title}</div>
                    <div className="mt-0.5 flex gap-2 font-mono text-[10.5px] text-[var(--text-3)]">
                      <span>{e.id}</span>
                      <span>·</span>
                      <span>#{e.blockHeight.toLocaleString()}</span>
                    </div>
                  </div>
                  <HashText value={e.hash} head={8} tail={6} />
                </button>
              ))}
              {!evidences.length && <div className="py-6 text-center text-[12px] text-[var(--text-3)]">暂无关联存证</div>}
            </div>
          </SectionCard>

          <SectionCard title="权属证书" desc="证书信息与链上登记记录一一对应">
            <CertificateCard
              kind="rights"
              no={data.certificateNo ?? `XH-RR-2026-${data.id.split('-').pop()}`}
              title={data.title}
              ownerName={data.owner.name}
              hash={data.txHash}
              blockHeight={data.blockHeight}
              txHash={data.txHash}
              issuedAt={data.registeredAt ?? data.events[0].time}
              extra={[
                { label: '登 记 号', value: data.id },
                { label: '权利范围', value: data.rightScope.join(' / ') },
                { label: '有 效 期', value: `${data.validFrom} 至 ${data.validTo}` },
              ]}
            />
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="权属事件流" desc="全部权属变动均已上链留痕">
            <Timeline
              items={data.events.map((e) => ({
                title: e.title,
                time: fmtTime(e.time),
                desc: `操作人：${e.operator}`,
                extra: e.txHash ? <HashText value={e.txHash} head={8} tail={5} /> : undefined,
              }))}
            />
          </SectionCard>

          <SectionCard title="登记信息速览">
            <div className="space-y-0">
              {[
                ['当前状态', <StatusPill key="s" label={st.label} tone={st.tone} />],
                ['共有人数', `${data.coOwners.length} 人`],
                ['权利项数', `${data.rightScope.length} 项`],
                ['证据数量', `${data.evidenceIds.length} 条`],
                ['登记主体', data.orgName],
                ['异议状态', data.disputeId ? <span key="d" className="text-[var(--danger)]">存在异议 {data.disputeId}</span> : '无'],
              ].map(([k, v]) => (
                <div key={String(k)} className="kv">
                  <span className="kv-k">{k}</span>
                  <span className="kv-v">{v}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="相关操作">
            <div className="space-y-2">
              <Button className="w-full justify-start" onClick={() => toast.success('已发起许可授权流程')}>许可授权给第三方</Button>
              <Button className="w-full justify-start" onClick={() => nav('/rights/register')}>办理变更登记</Button>
              <Button className="w-full justify-start" onClick={() => nav('/forensics/packages')}>加入维权证据包</Button>
              <Button className="w-full justify-start" onClick={() => nav('/rights/graph')}>查看权属图谱</Button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function ShareRing({ owner, ratio }: { owner: string; ratio: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg width="74" height="74" viewBox="0 0 74 74" className="flex-none">
      <circle cx="37" cy="37" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="7" />
      <circle
        cx="37"
        cy="37"
        r={r}
        fill="none"
        stroke="#3D7DFF"
        strokeWidth="7"
        strokeDasharray={`${(c * ratio) / 100} ${c}`}
        strokeLinecap="round"
        transform="rotate(-90 37 37)"
      />
      <text x="37" y="35" textAnchor="middle" fontSize="12" fill="#E8EEF9" fontWeight="600">
        {ratio}%
      </text>
      <text x="37" y="46" textAnchor="middle" fontSize="7.5" fill="#63718A">
        {owner.slice(0, 4)}
      </text>
      <title>{owner} 持有 {ratio}% 份额</title>
    </svg>
  );
}
