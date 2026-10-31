import { useState } from 'react';
import { BarChart3, Check, Edit3, Plus, Tags, Trash2, X } from 'lucide-react';
import { Card, CardHeader, PageHeader, StatCard } from '@/components/ui/Card';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Modal, Tabs } from '@/components/ui/Overlay';
import { FilterBar, Select } from '@/components/ui/Form';
import { useUIStore } from '@/store/uiStore';
import { SERVICE_ITEMS } from '@/mocks/services';
import { MODELS } from '@/mocks/models';
import { DISCOUNTS } from '@/mocks/misc';
import { money, num } from '@/lib/format';
import { CATEGORY_LABEL, type DiscountRequest, type ModelInfo, type ServiceItem } from '@/types';

/* ================= 服务项管理 ================= */
export function AdminServices() {
  const toast = useUIStore((s) => s.toast);
  const [cat, setCat] = useState('all');
  const rows = SERVICE_ITEMS.filter((s) => cat === 'all' || s.category === cat);

  const columns: Column<ServiceItem>[] = [
    { key: 'name', title: '服务项名称', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'code', title: '服务编码', width: 190, render: (r) => <span className="font-mono text-2xs text-ink-2">{r.code}</span> },
    { key: 'category', title: '类别', width: 110, render: (r) => <Badge tone="blue">{CATEGORY_LABEL[r.category]}</Badge> },
    {
      key: 'billingMode',
      title: '计费方式',
      width: 110,
      render: (r) => (
        <span className="text-xs text-ink-2">
          {r.billingMode === 'usage' ? '按量' : r.billingMode === 'reserved' ? '包月预留' : '订阅'}
        </span>
      ),
    },
    { key: 'unit', title: '计量单位', width: 100, render: (r) => <span className="text-xs text-ink-2">{r.unit}</span> },
    {
      key: 'unitPrice',
      title: '标准单价',
      width: 110,
      align: 'right',
      render: (r) => <span className="num">{r.unitPrice < 0.01 ? r.unitPrice.toFixed(4) : money(r.unitPrice)}</span>,
    },
    {
      key: 'tier',
      title: '阶梯价',
      width: 90,
      render: (r) => (r.priceTiers ? <Badge tone="purple">{r.priceTiers.length} 档</Badge> : <span className="text-2xs text-ink-3">—</span>),
    },
    { key: 'status', title: '状态', width: 90, render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'op',
      title: '操作',
      width: 100,
      align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-2">
          <button className="text-xs text-primary" onClick={() => toast(`正在编辑 ${r.name}`, 'info')}>
            编辑
          </button>
          <button className="text-xs text-ink-2" onClick={() => toast(`已${r.status === 'online' ? '下架' : '上架'} ${r.name}`, 'info')}>
            {r.status === 'online' ? '下架' : '上架'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="服务项管理"
        desc="维护服务目录、计量单位与标准单价，变更后即时生效"
        actions={
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => toast('新建服务项', 'info')}>
            新建服务项
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="服务项" value={String(SERVICE_ITEMS.length)} unit="个" hint="含 1 个订阅服务" />
        <StatCard label="已上架" value={String(SERVICE_ITEMS.filter((s) => s.status === 'online').length)} unit="个" tone="success" />
        <StatCard label="类别数" value="6" unit="类" hint="算力/模型/数据/匹配/生成/订阅" />
        <StatCard label="支持阶梯价的" value={String(SERVICE_ITEMS.filter((s) => s.priceTiers).length)} unit="个" tone="primary" />
      </div>

      <Card pad={false}>
        <div className="p-4">
          <FilterBar extra={<span className="text-2xs text-ink-3">共 {rows.length} 项</span>}>
            <Select value={cat} onChange={(e) => setCat(e.target.value)} className="w-40">
              <option value="all">全部类别</option>
              {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </FilterBar>
        </div>
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} pageSize={12} emptyTitle="暂无服务项" />
      </Card>
    </div>
  );
}

/* ================= 模型管理 ================= */
export function AdminModels() {
  const toast = useUIStore((s) => s.toast);
  const rows = MODELS;

  const columns: Column<ModelInfo>[] = [
    { key: 'name', title: '模型名称', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'vendor', title: '供应商', width: 110, render: (r) => <span className="text-xs text-ink-2">{r.vendor}</span> },
    { key: 'version', title: '版本', width: 90, render: (r) => <span className="num text-xs text-ink-2">{r.version}</span> },
    { key: 'type', title: '类型', width: 100, render: (r) => <Badge tone="gray">{r.type}</Badge> },
    { key: 'contextWindow', title: '上下文', width: 90, render: (r) => <span className="num text-xs">{r.contextWindow}</span> },
    { key: 'inputPrice', title: '输入单价', width: 110, align: 'right', render: (r) => <span className="num">{money(r.inputPrice)}</span> },
    { key: 'qpsLimit', title: 'QPS', width: 80, align: 'right', render: (r) => <span className="num text-ink-2">{r.qpsLimit}</span> },
    { key: 'avgLatency', title: '延迟', width: 90, align: 'right', render: (r) => <span className="num text-ink-2">{r.avgLatency}ms</span> },
    { key: 'status', title: '状态', width: 90, render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'op',
      title: '操作',
      width: 110,
      align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-2">
          <button className="text-xs text-primary" onClick={() => toast(`编辑 ${r.name}`, 'info')}>
            编辑
          </button>
          <button className="text-xs text-ink-2" onClick={() => toast(`已${r.status === 'online' ? '下架' : '上架'}`, 'info')}>
            {r.status === 'online' ? '下架' : '上架'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="模型管理"
        desc="维护模型元数据、能力标签、限流与 SLA，上下架影响客户端模型市场展示"
        actions={
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => toast('接入新模型', 'info')}>
            接入模型
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="模型总数" value={String(MODELS.length)} unit="个" />
        <StatCard label="已上架" value={String(MODELS.filter((m) => m.status === 'online').length)} unit="个" tone="success" />
        <StatCard label="公测中" value={String(MODELS.filter((m) => m.status === 'beta').length)} unit="个" tone="warning" />
        <StatCard label="已下架" value={String(MODELS.filter((m) => m.status === 'offline').length)} unit="个" />
      </div>

      <Card pad={false}>
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} pageSize={12} emptyTitle="暂无模型" />
      </Card>
    </div>
  );
}

/* ================= 价格策略 ================= */
export function PricingPlans() {
  const toast = useUIStore((s) => s.toast);
  const model = SERVICE_ITEMS.find((s) => s.id === 'SRV-M01')!;
  const [tiers, setTiers] = useState(model.priceTiers ?? []);

  return (
    <div>
      <PageHeader
        title="价格策略"
        desc="支持按量、包月预留与订阅三种计费模式；阶梯价按累计用量落档"
        actions={
          <Button variant="primary" icon={<Save2 />} onClick={() => toast('价格策略已保存，下个账期生效')}>
            保存并发布
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2" pad={false}>
          <div className="px-5 pt-2">
            <Tabs
              tabs={[
                { key: 'tiered', label: '阶梯价' },
                { key: 'reserved', label: '包月预留' },
                { key: 'sub', label: '订阅套餐' },
              ]}
              active="tiered"
              onChange={() => {}}
            />
          </div>
          <div className="p-5">
            <CardHeader
              title="文本生成 Qwen3-72B"
              desc="按自然月累计 token 落档，落档后当月全部用量按该档单价结算"
              extra={<Button size="sm" icon={<Plus size={13} />} onClick={() => setTiers([...tiers, { from: 0, to: null, price: 0.5 }])}>新增档位</Button>}
            />

            <div className="mt-4 overflow-hidden rounded-ctl border border-line">
              <table className="w-full text-sm">
                <thead className="bg-[#F9FAFB] text-xs text-ink-2">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">区间起（千 token）</th>
                    <th className="px-3 py-2 text-left font-medium">区间止</th>
                    <th className="px-3 py-2 text-left font-medium">单价（元 / 千 token）</th>
                    <th className="px-3 py-2 text-left font-medium">折扣率</th>
                    <th className="w-14 px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {tiers.map((t, i) => (
                    <tr key={i} className="border-t border-line">
                      <td className="px-3 py-2">
                        <input
                          value={t.from}
                          onChange={(e) => {
                            const next = [...tiers];
                            next[i] = { ...t, from: Number(e.target.value) };
                            setTiers(next);
                          }}
                          className="num h-8 w-28 rounded border border-line px-2 text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={t.to ?? ''}
                          placeholder="无上限"
                          onChange={(e) => {
                            const next = [...tiers];
                            next[i] = { ...t, to: e.target.value === '' ? null : Number(e.target.value) };
                            setTiers(next);
                          }}
                          className="num h-8 w-28 rounded border border-line px-2 text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={t.price}
                          onChange={(e) => {
                            const next = [...tiers];
                            next[i] = { ...t, price: Number(e.target.value) };
                            setTiers(next);
                          }}
                          className="num h-8 w-24 rounded border border-line px-2 text-xs"
                        />
                      </td>
                      <td className="num px-3 py-2 text-xs text-ink-2">
                        {(t.price / (tiers[0]?.price || 1) * 10).toFixed(1)} 折
                      </td>
                      <td className="px-3 py-2">
                        <button
                          className="text-ink-3 hover:text-danger"
                          onClick={() => setTiers(tiers.filter((_, idx) => idx !== i))}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 rounded-ctl bg-[#F9FAFB] px-3.5 py-3 text-2xs leading-relaxed text-ink-2">
              举例：某客户当月累计使用 6.8 万千 token，落入第二档（5 万 - 20 万），
              则该月全部 6.8 万千 token 均按 {money(tiers[1]?.price ?? 0.68)}/千 token 结算，
              金额 = 68 × {money(tiers[1]?.price ?? 0.68)} = {money(68 * (tiers[1]?.price ?? 0.68))}。
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="当前生效价格" extra={<BarChart3 size={15} className="text-ink-3" />} />
            <div className="mt-4 space-y-3">
              {SERVICE_ITEMS.filter((s) => s.priceTiers).map((s) => (
                <div key={s.id} className="rounded-ctl border border-line px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-ink-1">{s.name}</span>
                    <Badge tone="green">生效中</Badge>
                  </div>
                  <div className="mt-1.5 space-y-1">
                    {s.priceTiers?.map((t) => (
                      <div key={t.from} className="flex justify-between text-2xs text-ink-3">
                        <span className="num">
                          {num(t.from)} - {t.to ? num(t.to) : '∞'}
                        </span>
                        <span className="num">{money(t.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="包月预留折扣" />
            <div className="mt-3 space-y-2.5 text-xs">
              {[
                ['1 个月', '95 折'],
                ['3 个月', '9 折'],
                ['6 个月', '85 折'],
                ['12 个月', '8 折'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-ink-3">{k}</span>
                  <span className="num font-medium text-ink-1">{v}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="价格变更说明" extra={<Tags size={15} className="text-ink-3" />} />
            <div className="mt-3 text-2xs leading-relaxed text-ink-3">
              价格调整不影响已出账账期。新价格于发布后的下一个自然月 1 日 00:00 生效，
              发布时会自动通知全部在营客户，并记录至审计日志。
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Save2() {
  return <Check size={14} />;
}

/* ================= 折扣审批 ================= */
export function Discounts() {
  const toast = useUIStore((s) => s.toast);
  const [detail, setDetail] = useState<DiscountRequest | null>(null);

  const columns: Column<DiscountRequest>[] = [
    { key: 'tenantName', title: '客户', render: (r) => <span className="font-medium">{r.tenantName}</span> },
    { key: 'serviceName', title: '服务项', width: 200, render: (r) => <span className="text-xs text-ink-2">{r.serviceName}</span> },
    { key: 'basePrice', title: '标准价', width: 110, align: 'right', render: (r) => <span className="num">{money(r.basePrice)}</span> },
    { key: 'requestRate', title: '申请折扣', width: 100, align: 'right', render: (r) => <span className="num font-medium text-primary">{(r.requestRate * 10).toFixed(1)} 折</span> },
    { key: 'applicant', title: '申请人', width: 100, render: (r) => <span className="text-xs text-ink-2">{r.applicant}</span> },
    { key: 'reason', title: '申请理由', render: (r) => <span className="line-clamp-1 text-xs text-ink-2">{r.reason}</span> },
    { key: 'status', title: '状态', width: 90, render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'op',
      title: '操作',
      width: 130,
      align: 'right',
      render: (r) =>
        r.status === 'pending' ? (
          <div className="flex justify-end gap-2">
            <button className="text-xs text-success" onClick={() => toast('已通过该折扣申请')}>
              通过
            </button>
            <button className="text-xs text-danger" onClick={() => toast('已驳回该折扣申请', 'info')}>
              驳回
            </button>
          </div>
        ) : (
          <button className="text-xs text-primary" onClick={() => setDetail(r)}>
            查看
          </button>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="折扣审批"
        desc="客户专属折扣需经审批后生效，审批记录同步至审计日志"
      />

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="待审批" value={String(DISCOUNTS.filter((d) => d.status === 'pending').length)} unit="项" tone="warning" />
        <StatCard label="本月已通过" value={String(DISCOUNTS.filter((d) => d.status === 'approved').length)} unit="项" />
        <StatCard label="本月驳回" value={String(DISCOUNTS.filter((d) => d.status === 'rejected').length)} unit="项" />
        <StatCard label="平均让利率" value="12.4" unit="%" hint="影响毛利约 1.8pp" />
      </div>

      <Card pad={false}>
        <DataTable columns={columns} rows={DISCOUNTS} rowKey={(r) => r.id} pageSize={8} emptyTitle="暂无折扣申请" />
      </Card>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="折扣申请详情"
        footer={<Button onClick={() => setDetail(null)}>关闭</Button>}
      >
        {detail && (
          <div className="space-y-3 text-sm">
            {[
              ['客户', detail.tenantName],
              ['服务项', detail.serviceName],
              ['标准价', money(detail.basePrice)],
              ['申请折扣', `${(detail.requestRate * 10).toFixed(1)} 折`],
              ['折后价', money(detail.basePrice * detail.requestRate)],
              ['申请人', detail.applicant],
              ['提交时间', detail.createdAt.replace('T', ' ')],
              ['申请理由', detail.reason],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-4 border-b border-line pb-2.5 last:border-0">
                <span className="w-24 shrink-0 text-xs text-ink-3">{k}</span>
                <span className="text-ink-1">{v}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
