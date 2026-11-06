import { useState } from 'react';
import { ChevronDown, Headphones, LifeBuoy, Mail, MessageSquare } from 'lucide-react';
import { Button, Field, Input, Select, StatusPill, Tag, Textarea } from '@/components/ui/core';
import { PageHeader, SectionCard } from '@/components/ui/page';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';

const FAQ = [
  {
    q: '存证之后还需要去版权局登记吗？',
    a: '两者不冲突。区块链存证解决的是「什么时间已经存在这份内容」的问题，属于电子数据证据；版权登记是官方确权程序。建议先存证固定时间，再根据需要进行官方登记，两者可以形成互补的证据体系。',
  },
  {
    q: '存证证书在诉讼中能被采信吗？',
    a: '依据《最高人民法院关于互联网法院审理案件若干问题的规定》第十一条，当事人提交的电子数据通过区块链技术存证并能证明其真实性的，法院应当确认其效力。本平台已对接司法链，可一键申请公证书或鉴定意见书，进一步提高采信度。',
  },
  {
    q: '文件会被上传到服务器吗？',
    a: '默认不会。文件哈希在浏览器本地通过 SHA-256 计算，仅哈希值与元数据上链。若你需要平台托管原文（用于证据包打包），可在存证时勾选「托管原文」。',
  },
  {
    q: '权属登记审核需要多久？',
    a: '资料齐全的情况下，90% 的申请可在 1 个工作日内完成。涉及共有人、转让历史或异议的，可能需要 3–5 个工作日。',
  },
  {
    q: '出证失败或机构不受理会退款吗？',
    a: '会。材料初审未通过或机构不受理的，出证费用全额退回原支付账户，通常在 3 个工作日内到账。',
  },
  {
    q: '如何批量将历史作品接入？',
    a: '推荐使用开放 API 的批量存证接口，单次最多 100 条。也可以使用「批量存证」页面上传压缩包，系统会自动解压并逐条计算哈希。',
  },
];

export default function Support() {
  const [open, setOpen] = useState<number | null>(0);
  const [form, setForm] = useState({ type: 'technical', title: '', desc: '', contact: '13800138000' });

  return (
    <div className="page">
      <PageHeader title="帮助与工单" desc="常见问题、使用指南与人工支持" />

      <div className="mb-4 grid grid-cols-3 gap-4">
        {[
          { icon: MessageSquare, t: '在线客服', d: '工作日 9:00–21:00', a: '发起会话' },
          { icon: Mail, t: '邮件支持', d: 'support@xh-chain.cn', a: '发送邮件' },
          { icon: Headphones, t: '专属顾问', d: '企业版客户可用', a: '预约沟通' },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.t} className="card flex items-center gap-3 p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-[rgba(61,125,255,.12)] text-[#9CC2FF]"><Icon size={16} /></span>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] text-[var(--text-1)]">{c.t}</div>
                <div className="text-[10.5px] text-[var(--text-3)]">{c.d}</div>
              </div>
              <Button size="xs" onClick={() => toast.success('已发起，客服将尽快联系你')}>{c.a}</Button>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <SectionCard title="常见问题" className="col-span-2" desc="点击展开查看解答">
          <div className="space-y-2">
            {FAQ.map((f, i) => (
              <div key={f.q} className="rounded-[9px] border border-[var(--stroke)] bg-[var(--bg-card-2)]">
                <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                  <span className="text-[12.5px] text-[var(--text-1)]">{f.q}</span>
                  <ChevronDown size={14} className={cn('ml-auto flex-none text-[var(--text-3)] transition-transform', open === i && 'rotate-180')} />
                </button>
                {open === i && <div className="border-t border-[var(--stroke)] px-4 py-3 text-[11.5px] leading-[1.9] text-[var(--text-2)]">{f.a}</div>}
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="提交工单" desc="通常 2 小时内响应">
            <div className="space-y-3.5">
              <Field label="问题类型">
                <Select
                  value={form.type}
                  onChange={(v) => setForm({ ...form, type: v })}
                  options={[
                    { value: 'technical', label: '技术问题' },
                    { value: 'account', label: '账号与权限' },
                    { value: 'billing', label: '账单与发票' },
                    { value: 'legal', label: '法律与合规' },
                  ]}
                />
              </Field>
              <Field label="问题标题">
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="一句话描述问题" />
              </Field>
              <Field label="详细描述">
                <Textarea rows={4} value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="请描述操作步骤、预期结果与实际结果" />
              </Field>
              <Field label="联系方式">
                <Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
              </Field>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => {
                  if (!form.title.trim()) return toast.error('请填写问题标题');
                  toast.success('工单已提交，编号 TK-2026-0087');
                  setForm({ ...form, title: '', desc: '' });
                }}
              >
                提交工单
              </Button>
            </div>
          </SectionCard>

          <SectionCard title="我的工单">
            <div className="space-y-2">
              {[
                ['TK-2026-0086', '批量存证部分文件失败', '处理中'],
                ['TK-2026-0081', '发票抬头需要修改', '已完成'],
              ].map(([id, t, s]) => (
                <div key={id} className="flex items-center gap-2 rounded-lg border border-[var(--stroke)] bg-[var(--bg-card-2)] px-3 py-2.5">
                  <LifeBuoy size={12} className="text-[var(--text-3)]" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11.5px] text-[var(--text-1)]">{t}</div>
                    <div className="font-mono text-[10px] text-[var(--text-3)]">{id}</div>
                  </div>
                  <StatusPill label={s} tone={s === '已完成' ? 'green' : 'amber'} />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      <SectionCard className="mt-4" title="服务等级（SLA）">
        <div className="grid grid-cols-4 gap-4">
          {[
            ['可用性', '99.9%', '月度统计'],
            ['首次响应', '≤ 2 小时', '工作日'],
            ['故障恢复', '≤ 4 小时', 'P1 级故障'],
            ['数据持久性', '99.999%', '三副本存储'],
          ].map(([k, v, s]) => (
            <div key={k} className="rounded-[9px] border border-[var(--stroke)] bg-[var(--bg-card-2)] px-4 py-3">
              <div className="text-[10.5px] text-[var(--text-3)]">{k}</div>
              <div className="num mt-1 text-[16px] font-semibold text-[var(--text-1)]">{v}</div>
              <div className="mt-0.5 text-[10px] text-[var(--text-3)]">{s}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
