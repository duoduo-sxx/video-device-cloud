import { useState } from 'react';
import { Check, CreditCard, Download, Receipt } from 'lucide-react';
import { Button, Tag } from '@/components/ui/core';
import { PageHeader, SectionCard } from '@/components/ui/page';
import { Tabs } from '@/components/ui/data';
import { fmtMoney } from '@/utils/format';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';

const PLANS = [
  { name: '基础版', price: 980, unit: '年', items: ['存证 2,000 条/年', '权属登记 200 项', 'API 1 万次/月', '基础取证 20 次'] },
  { name: '专业版', price: 3980, unit: '年', items: ['存证 18,000 条/年', '权属登记 2,000 项', 'API 10 万次/月', '司法出证 10 单'], current: true },
  { name: '企业版', price: 12800, unit: '年', items: ['存证不限量', '专属节点通道', 'API 不限次', '7×24 专属服务'] },
];

const BILLS = [
  { id: 'INV-2026-10-001', period: '2026-10', amount: 331.67, type: '套餐订阅', status: '已支付', date: '2026-10-01' },
  { id: 'INV-2026-09-001', period: '2026-09', amount: 331.67, type: '套餐订阅', status: '已支付', date: '2026-09-01' },
  { id: 'INV-2026-09-002', period: '2026-09', amount: 1200.0, type: '司法出证', status: '已支付', date: '2026-09-18' },
  { id: 'INV-2026-08-001', period: '2026-08', amount: 331.67, type: '套餐订阅', status: '已支付', date: '2026-08-01' },
  { id: 'INV-2026-07-002', period: '2026-07', amount: 386.4, type: 'API 超额', status: '已支付', date: '2026-07-31' },
];

export default function Billing() {
  const [tab, setTab] = useState('bill');

  return (
    <div className="page">
      <PageHeader
        title="套餐与账单"
        desc="当前套餐：专业版 · 有效期至 2027-03-31"
        actions={<Button variant="primary" onClick={() => toast.success('已进入套餐升级流程')}>升级套餐</Button>}
      />

      <div className="grid grid-cols-3 gap-4">
        {PLANS.map((p) => (
          <div
            key={p.name}
            className={cn(
              'card relative p-5',
              p.current && 'border-[rgba(61,125,255,.45)] shadow-[0_0_0_1px_rgba(61,125,255,.2),0_20px_40px_-24px_rgba(61,125,255,.45)]',
            )}
          >
            {p.current && (
              <span className="absolute right-4 top-4 rounded-md bg-[rgba(61,125,255,.16)] px-2 py-0.5 text-[10px] text-[#9CC2FF]">当前套餐</span>
            )}
            <div className="text-[13px] text-[var(--text-1)]">{p.name}</div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="num text-[26px] font-semibold text-[var(--text-1)]">¥{p.price.toLocaleString()}</span>
              <span className="text-[11.5px] text-[var(--text-3)]">/ {p.unit}</span>
            </div>
            <div className="mt-3 space-y-1.5">
              {p.items.map((i) => (
                <div key={i} className="flex items-center gap-1.5 text-[11.5px] text-[var(--text-2)]">
                  <Check size={11} className="flex-none text-[var(--ok)]" /> {i}
                </div>
              ))}
            </div>
            <Button
              className="mt-4 w-full"
              variant={p.current ? 'ghost' : 'primary'}
              disabled={p.current}
              onClick={() => toast.success(`已选择${p.name}`)}
            >
              {p.current ? '使用中' : '选择该套餐'}
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <SectionCard title="本月用量" className="col-span-1">
          <div className="space-y-4">
            {[
              { k: '存证条数', u: 1204, t: 18000 },
              { k: '权属登记', u: 46, t: 2000 },
              { k: 'API 调用', u: 48320, t: 100000 },
              { k: '司法出证', u: 3, t: 10 },
            ].map((i) => (
              <div key={i.k}>
                <div className="flex items-baseline justify-between text-[11.5px]">
                  <span className="text-[var(--text-2)]">{i.k}</span>
                  <span className="num text-[var(--text-3)]">
                    <span className="text-[var(--text-1)]">{i.u.toLocaleString()}</span> / {i.t.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#3D7DFF] to-[#22D3EE]" style={{ width: `${(i.u / i.t) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="账单与发票" className="col-span-2" bodyClass="p-0">
          <div className="px-5 pt-3">
            <Tabs
              active={tab}
              onChange={setTab}
              items={[
                { key: 'bill', label: '账单明细' },
                { key: 'invoice', label: '发票记录' },
              ]}
            />
          </div>
          <div className="overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th>单号</th>
                  <th>账期</th>
                  <th>类型</th>
                  <th style={{ textAlign: 'right' }}>金额</th>
                  <th>状态</th>
                  <th>日期</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {BILLS.map((b) => (
                  <tr key={b.id}>
                    <td><span className="font-mono text-[11.5px] text-[var(--text-2)]">{b.id}</span></td>
                    <td><span className="font-mono text-[11.5px]">{b.period}</span></td>
                    <td><Tag>{b.type}</Tag></td>
                    <td style={{ textAlign: 'right' }}><span className="num text-[12px]">{fmtMoney(b.amount)}</span></td>
                    <td><Tag tone="green">{b.status}</Tag></td>
                    <td><span className="font-mono text-[11.5px] text-[var(--text-3)]">{b.date}</span></td>
                    <td>
                      <button className="flex items-center gap-1 text-[11px] text-[var(--brand-2)] hover:underline" onClick={() => toast.success('发票已发送至邮箱')}>
                        <Download size={10} /> 发票
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      <SectionCard className="mt-4" title="支付方式">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 rounded-[9px] border border-[var(--stroke)] bg-[var(--bg-card-2)] px-4 py-3">
            <CreditCard size={16} className="text-[var(--brand-2)]" />
            <div>
              <div className="text-[12px] text-[var(--text-1)]">招商银行 · 对公账户</div>
              <div className="font-mono text-[10.5px] text-[var(--text-3)]">尾号 8821 · 杭州分行文三路支行</div>
            </div>
            <Tag tone="green">默认</Tag>
          </div>
          <Button size="sm" onClick={() => toast.success('已添加新的支付方式')}>添加支付方式</Button>
          <div className="ml-auto flex items-center gap-2 text-[11px] text-[var(--text-3)]">
            <Receipt size={12} />
            开票信息：杭州拾光文创有限公司 · 91330106MA2GX8K21C
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
