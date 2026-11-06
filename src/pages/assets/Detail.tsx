import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Database, Download, ShieldCheck } from 'lucide-react';
import { Button, HashText, StatusPill, Tag } from '@/components/ui/core';
import { PageHeader, SectionCard } from '@/components/ui/page';
import { Timeline } from '@/components/ui/data';
import { CertificateCard } from '@/components/business';
import { mockApi } from '@/mock/api';
import { fmtDate, fmtTime } from '@/utils/format';
import type { DataAsset } from '@/types';
import { toast } from 'sonner';

export default function AssetsDetail() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState<DataAsset | null | undefined>(undefined);

  useEffect(() => {
    mockApi.assets.detail(id).then((d) => setData(d ?? null));
  }, [id]);

  if (data === undefined) return <div className="page"><div className="h-[480px] skel" /></div>;
  if (data === null) {
    return (
      <div className="page flex flex-col items-center py-32">
        <Database size={38} className="text-[var(--text-3)]" />
        <div className="mt-4 text-[15px]">未找到该数据资产</div>
        <Button className="mt-5" onClick={() => nav('/data-assets')}>返回台账</Button>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        back
        title={data.name}
        desc={`${data.id} · ${data.orgName}`}
        tag={<StatusPill label={data.rightStatus === 'registered' ? '已确权' : data.rightStatus === 'reviewing' ? '审核中' : '未登记'} tone={data.rightStatus === 'registered' ? 'green' : data.rightStatus === 'reviewing' ? 'amber' : 'gray'} />}
        actions={
          <>
            <Button icon={<Download size={14} />} onClick={() => toast.success('资产凭证已开始下载')}>下载凭证</Button>
            <Button variant="primary" onClick={() => toast.success('已发起授权申请')}>发起授权</Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-4 gap-3">
        {[
          ['数据规模', data.scale],
          ['存储量', data.volume],
          ['更新频率', data.updateFreq],
          ['字段数量', `${data.fields.length} 个`],
        ].map(([k, v]) => (
          <div key={k} className="card px-5 py-4">
            <div className="text-[11.5px] text-[var(--text-3)]">{k}</div>
            <div className="num mt-1 text-[18px] font-semibold text-[var(--text-1)]">{v}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <SectionCard title="资产概览">
            <p className="text-[12px] leading-[1.9] text-[var(--text-2)]">{data.desc}</p>
            <div className="mt-4 grid grid-cols-2 gap-x-8">
              {[
                ['资产编号', <span key="1" className="font-mono text-[12px]">{data.id}</span>],
                ['登记编号', <span key="2" className="font-mono text-[12px] text-[var(--brand-2)]">{data.certNo ?? '待签发'}</span>],
                ['数据来源', data.source],
                ['权属主体', data.orgName],
                ['登记时间', fmtDate(data.createdAt)],
                ['资产类型', data.category],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex items-baseline gap-3 border-b border-dashed border-white/[0.055] py-2.5">
                  <span className="w-[76px] flex-none text-[12px] text-[var(--text-3)]">{k}</span>
                  <span className="min-w-0 flex-1 text-[12px] text-[var(--text-1)]">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-[rgba(45,212,167,.25)] bg-[rgba(45,212,167,.06)] px-3.5 py-2.5">
              <ShieldCheck size={13} className="text-[var(--ok)]" />
              <span className="text-[11.5px] text-[var(--text-2)]">已完成数据来源合法性核验与去标识化处理，不含个人敏感信息。</span>
            </div>
          </SectionCard>

          <SectionCard title="数据字典" desc="字段说明与脱敏状态">
            <div className="overflow-hidden rounded-[9px] border border-[var(--stroke)]">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 160 }}>字段名</th>
                    <th style={{ width: 96 }}>类型</th>
                    <th>说明</th>
                    <th style={{ width: 90 }}>脱敏</th>
                  </tr>
                </thead>
                <tbody>
                  {data.fields.map((f) => (
                    <tr key={f.name}>
                      <td><span className="font-mono text-[11.5px] text-[var(--brand-2)]">{f.name}</span></td>
                      <td><span className="text-[11.5px] text-[var(--text-3)]">{f.type}</span></td>
                      <td><span className="text-[11.5px]">{f.desc}</span></td>
                      <td>{f.masked ? <Tag tone="amber">已脱敏</Tag> : <Tag tone="gray">明文</Tag>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="资产凭证">
            <CertificateCard
              kind="asset"
              no={data.certNo ?? `XH-DA-2026-${data.id.split('-').pop()}`}
              title={data.name}
              ownerName={data.orgName}
              hash={`0x${Array.from({ length: 64 }).map((_, i) => '0123456789abcdef'[(i * 7 + data.id.length) % 16]).join('')}`}
              blockHeight={2485512}
              txHash={`0x${Array.from({ length: 64 }).map((_, i) => '89abcdef01234567'[(i * 5 + 3) % 16]).join('')}`}
              issuedAt={data.createdAt}
              extra={[
                { label: '资 产 编 号', value: data.id },
                { label: '数 据 规 模', value: `${data.scale} / ${data.volume}` },
              ]}
            />
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="授权链路" desc="每次授权均已上链">
            <Timeline
              items={data.licenses.map((l) => ({
                title: `授权给 ${l.licensee}`,
                time: `${l.startAt} 至 ${l.endAt}`,
                desc: `范围：${l.scope}`,
                extra: <Tag tone={l.status === 'active' ? 'green' : l.status === 'expired' ? 'gray' : 'red'}>{l.status === 'active' ? '生效中' : l.status === 'expired' ? '已到期' : '已撤回'}</Tag>,
              }))}
            />
          </SectionCard>

          <SectionCard title="使用记录" desc="调用方与用途均留痕">
            <div className="space-y-2.5">
              {data.usages.map((u, i) => (
                <div key={i} className="border-b border-dashed border-white/[0.055] pb-2.5 last:border-b-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="truncate text-[11.5px] text-[var(--text-1)]">{u.caller}</span>
                    <Tag tone={u.status === 'success' ? 'green' : 'red'}>{u.status === 'success' ? '成功' : '拒绝'}</Tag>
                  </div>
                  <div className="mt-0.5 text-[10.5px] text-[var(--text-3)]">{u.purpose} · {fmtTime(u.time)}</div>
                  <div className="mt-1"><HashText value={u.hash} head={10} tail={4} /></div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
