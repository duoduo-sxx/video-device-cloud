import { useEffect, useState } from 'react';
import { Gavel, FileCheck2, Plus } from 'lucide-react';
import { Button, Field, HashText, Input, RadioCard, StatusPill, Tag, Textarea } from '@/components/ui/core';
import { PageHeader, SectionCard } from '@/components/ui/page';
import { DataTable, Timeline, type Column } from '@/components/ui/data';
import { Modal } from '@/components/ui/overlay';
import { DocPaper, DocSeal } from '@/components/business';
import { db } from '@/mock/api';
import { JUDICIAL_STATUS, JUDICIAL_TYPE } from '@/utils/constants';
import { fmtMoney, fmtTime } from '@/utils/format';
import type { JudicialOrder, JudicialType } from '@/types';
import { toast } from 'sonner';

const FLOW = ['提交申请', '材料初审', '机构受理', '出具文书', '寄送送达'];

export default function ForensicsJudicial() {
  const [rows, setRows] = useState<JudicialOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<JudicialOrder | null>(null);
  const [type, setType] = useState<JudicialType>('notary');
  const [pkg, setPkg] = useState(db.packages[0]?.id ?? '');
  const [addr, setAddr] = useState('浙江省杭州市西湖区文三路 98 号 拾光文创 3 层');

  useEffect(() => {
    setRows(db.judicial.slice(0, 12));
    setLoading(false);
  }, []);

  const columns: Column<JudicialOrder>[] = [
    { key: 'id', title: '出证编号', width: 128, render: (r) => <span className="font-mono text-[11.5px] text-[var(--text-2)]">{r.id}</span> },
    { key: 'type', title: '出证类型', width: 148, render: (r) => <Tag tone={r.type === 'appraisal' ? 'violet' : r.type === 'notary' ? 'blue' : 'cyan'}>{JUDICIAL_TYPE[r.type].label}</Tag> },
    {
      key: 'pkg',
      title: '关联证据包',
      render: (r) => (
        <div className="py-2">
          <div className="truncate text-[12px] text-[var(--text-1)]">{r.packageName}</div>
          <div className="mt-0.5 font-mono text-[10.5px] text-[var(--text-3)]">{r.packageId}</div>
        </div>
      ),
    },
    { key: 'inst', title: '受理机构', width: 176, render: (r) => <span className="text-[12px]">{r.institution}</span> },
    { key: 'status', title: '状态', width: 100, render: (r) => <StatusPill label={JUDICIAL_STATUS[r.status].label} tone={JUDICIAL_STATUS[r.status].tone} /> },
    { key: 'amount', title: '费用', width: 92, align: 'right', render: (r) => <span className="num text-[12px]">{fmtMoney(r.amount)}</span> },
    { key: 'time', title: '申请时间', width: 150, render: (r) => <span className="font-mono text-[11.5px]">{fmtTime(r.submittedAt)}</span> },
    { key: 'op', title: '操作', width: 88, render: (r) => <button className="text-[11.5px] text-[var(--brand-2)] hover:underline" onClick={(e) => { e.stopPropagation(); setDetail(r); }}>查看</button> },
  ];

  return (
    <div className="page">
      <PageHeader
        title="司法出证"
        desc="基于证据包向公证处、司法鉴定机构申请出具文书，全流程可追踪"
        actions={<Button variant="primary" icon={<Plus size={14} />} onClick={() => setOpen(true)}>申请出证</Button>}
      />

      <div className="mb-4 grid grid-cols-5 gap-3">
        {[
          { k: '累计申请', v: 24, c: '#3D7DFF' },
          { k: '材料初审', v: 3, c: '#F5B544' },
          { k: '机构受理', v: 2, c: '#22D3EE' },
          { k: '已出具', v: 12, c: '#2DD4A7' },
          { k: '已寄送', v: 7, c: '#8B5CF6' },
        ].map((i) => (
          <div key={i.k} className="card px-4 py-3.5">
            <div className="text-[11px] text-[var(--text-3)]">{i.k}</div>
            <div className="num mt-1 text-[19px] font-semibold leading-none" style={{ color: i.c }}>{i.v}</div>
          </div>
        ))}
      </div>

      <div className="card mb-4 px-6 py-5">
        <div className="flex items-center">
          {FLOW.map((s, i) => (
            <div key={s} className="flex flex-1 items-center last:flex-none">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--stroke-strong)] text-[10px] text-[var(--text-2)]">{i + 1}</span>
                <span className="whitespace-nowrap text-[12px] text-[var(--text-2)]">{s}</span>
              </div>
              {i < FLOW.length - 1 && <div className="mx-3 h-px flex-1 bg-[var(--stroke)]" />}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <DataTable columns={columns} rows={rows} loading={loading} rowKey={(r) => r.id} onRowClick={setDetail} />
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="申请司法出证"
        desc="选择出证类型并关联证据包，材料将由机构审核"
        width={620}
        footer={
          <>
            <Button onClick={() => setOpen(false)}>取消</Button>
            <Button
              variant="primary"
              onClick={() => {
                setOpen(false);
                toast.success(`出证申请已提交，编号 JD-2026-0025，预计 ${JUDICIAL_TYPE[type].days}完成`);
              }}
            >
              提交申请
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <div className="label">出证类型</div>
            <div className="grid grid-cols-3 gap-2.5">
              {(Object.keys(JUDICIAL_TYPE) as JudicialType[]).map((k) => (
                <RadioCard
                  key={k}
                  checked={type === k}
                  onClick={() => setType(k)}
                  title={JUDICIAL_TYPE[k].label}
                  desc={`${fmtMoney(JUDICIAL_TYPE[k].price)} · ${JUDICIAL_TYPE[k].days}`}
                  icon={<Gavel size={14} />}
                />
              ))}
            </div>
          </div>
          <Field label="关联证据包" required>
            <select
              value={pkg}
              onChange={(e) => setPkg(e.target.value)}
              className="input"
            >
              {db.packages.slice(0, 12).map((p) => (
                <option key={p.id} value={p.id} className="bg-[var(--bg-card-2)]">
                  {p.name} · {p.id}（{p.itemCount} 项证据）
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="申请人" required>
              <Input defaultValue="陈默" />
            </Field>
            <Field label="联系电话" required>
              <Input defaultValue="13800138000" />
            </Field>
          </div>
          <Field label="收件地址" required>
            <Textarea rows={2} value={addr} onChange={(e) => setAddr(e.target.value)} />
          </Field>
          <div className="rounded-lg border border-[var(--stroke)] bg-[var(--bg-card-2)] px-3.5 py-3 text-[11.5px] leading-relaxed text-[var(--text-3)]">
            提交后机构将在 1 个工作日内完成材料初审。若材料不齐，会通过站内消息通知补充，不影响已固化的链上证据。
          </div>
        </div>
      </Modal>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? `出证进度 · ${detail.id}` : ''}
        desc={detail ? `${JUDICIAL_TYPE[detail.type].label} · ${detail.institution}` : ''}
        width={760}
        footer={<Button onClick={() => setDetail(null)}>关闭</Button>}
      >
        {detail && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <StatusPill label={JUDICIAL_STATUS[detail.status].label} tone={JUDICIAL_STATUS[detail.status].tone} />
              <span className="text-[11.5px] text-[var(--text-3)]">预计完成 {fmtTime(detail.expectedAt)}</span>
              <Tag tone="blue">{fmtMoney(detail.amount)}</Tag>
            </div>

            <Timeline items={detail.timeline.map((t) => ({ title: t.title, time: t.time ? fmtTime(t.time) : '待处理', done: t.done, desc: t.remark }))} />

            {(detail.status === 'issued' || detail.status === 'delivered') && (
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-[12px] text-[var(--text-2)]">
                  <FileCheck2 size={13} className="text-[var(--brand-2)]" />
                  文书预览
                </div>
                <DocPaper className="text-[11px]">
                  <div className="text-center">
                    <div className="text-[15px] font-semibold tracking-[4px]">公 证 书</div>
                    <div className="mt-1 font-mono text-[9.5px] text-[#7D8CA1]">（2026）浙杭西证字第 8821 号</div>
                  </div>
                  <div className="mt-4 space-y-2 leading-[1.9] text-[#2C3847]">
                    <p>申请人：陈默，男，1992 年 3 月 12 日出生，公民身份号码 330106199203124518。</p>
                    <p>
                      公证事项：保全证据（电子数据）。
                    </p>
                    <p>
                      经查，申请人于 2026 年 10 月 12 日通过星火链证平台对其享有权利的《山海拾遗·第三辑》插画集相关网页内容进行取证。
                      本公证员对取证过程进行了监督，取证所得的电子数据经 SHA-256 算法计算哈希值，并与星火联盟链上记录一致。
                    </p>
                    <p className="break-all font-mono text-[9.5px] text-[#55647A]">
                      证据哈希：{detail.id.startsWith('JD') ? '0x8c41d2e7a9b3f05c6d8e1a4b7c2d9e0f3a6b1c5d8e2f4a7b0c3d6e9f1a2b5c8d' : '—'}
                    </p>
                    <p>兹证明与本公证书相粘连的电子数据打印件与实际情况相符。</p>
                  </div>
                  <div className="mt-6 flex items-end justify-between">
                    <div className="text-[9.5px] leading-[1.9] text-[#7D8CA1]">
                      中华人民共和国浙江省杭州市西湖公证处
                      <br />
                      公证员：李文清（签名）
                      <br />
                      {fmtTime(detail.timeline[3]?.time ?? detail.submittedAt)}
                    </div>
                    <DocSeal size={78} />
                  </div>
                </DocPaper>
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-6">
              {[
                ['证据包', detail.packageName],
                ['证据包编号', detail.packageId],
                ['申请人', detail.applicant],
                ['受理机构', detail.institution],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline gap-3 border-b border-dashed border-white/[0.055] py-2">
                  <span className="w-[72px] flex-none text-[11.5px] text-[var(--text-3)]">{k}</span>
                  <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--text-1)]">{v}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-[var(--stroke)] bg-[var(--bg-card-2)] px-3.5 py-2.5">
              <span className="text-[11.5px] text-[var(--text-3)]">链上存证交易</span>
              <HashText value={db.packages[0]?.items[0]?.hash ?? '0x0000'} head={12} tail={6} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
