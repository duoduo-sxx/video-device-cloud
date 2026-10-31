import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Download, Edit3, Plus, Search } from 'lucide-react';
import { Card, CardHeader, PageHeader, StatCard } from '@/components/ui/Card';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Drawer, Tabs } from '@/components/ui/Overlay';
import { FilterBar, SearchInput, Select } from '@/components/ui/Form';
import { TrendArea } from '@/components/charts';
import { useUIStore } from '@/store/uiStore';
import { TENANTS } from '@/mocks/tenants';
import { BILLS, PERIODS } from '@/mocks/bills';
import { CONTRACTS, TICKETS } from '@/mocks/misc';
import { byCategory, dailySeries } from '@/mocks/usage';
import { money, num } from '@/lib/format';
import { BILL_STATUS_LABEL, CATEGORY_LABEL, type ServiceCategory, type Tenant } from '@/types';

/* ================= 客户列表 ================= */
export function Customers() {
  const navigate = useNavigate();
  const toast = useUIStore((s) => s.toast);
  const [kw, setKw] = useState('');
  const [level, setLevel] = useState('all');
  const [open, setOpen] = useState(false);

  const rows = TENANTS.filter((t) => (level === 'all' ? true : t.level === level)).filter(
    (t) => !kw || t.name.includes(kw) || t.shortName.includes(kw),
  );

  const columns: Column<Tenant>[] = [
    {
      key: 'name',
      title: '客户名称',
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-soft text-2xs font-semibold text-primary">
            {r.shortName.slice(0, 1)}
          </span>
          <div>
            <div className="text-sm font-medium text-ink-1">{r.name}</div>
            <div className="mt-0.5 text-2xs text-ink-3">{r.taxNo}</div>
          </div>
        </div>
      ),
    },
    { key: 'industry', title: '行业', width: 130, render: (r) => <span className="text-xs text-ink-2">{r.industry}</span> },
    { key: 'level', title: '等级', width: 70, align: 'center', render: (r) => <Badge tone={r.level === 'A' ? 'blue' : r.level === 'B' ? 'cyan' : 'gray'}>{r.level}</Badge> },
    { key: 'monthlyAvg', title: '月均消费', width: 130, align: 'right', sortable: true, sorter: (a, b) => a.monthlyAvg - b.monthlyAvg, render: (r) => <span className="num">{money(r.monthlyAvg)}</span> },
    { key: 'balance', title: '账户余额', width: 130, align: 'right', render: (r) => <span className="num text-ink-2">{money(r.balance)}</span> },
    { key: 'creditLimit', title: '信用额度', width: 130, align: 'right', render: (r) => <span className="num text-ink-2">{money(r.creditLimit)}</span> },
    { key: 'salesOwner', title: '客户经理', width: 100, render: (r) => <span className="text-xs text-ink-2">{r.salesOwner}</span> },
    { key: 'status', title: '状态', width: 90, render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'op',
      title: '操作',
      width: 90,
      align: 'right',
      render: (r) => (
        <button className="text-xs text-primary" onClick={(e) => { e.stopPropagation(); navigate(`/admin/customers/${r.id}`); }}>
          详情
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="客户管理"
        desc={`在营客户 ${TENANTS.length} 家，其中 A 级 ${TENANTS.filter((t) => t.level === 'A').length} 家`}
        actions={
          <>
            <Button icon={<Download size={14} />} onClick={() => toast('客户清单已导出', 'info')}>
              导出
            </Button>
            <Button variant="primary" icon={<Plus size={14} />} onClick={() => setOpen(true)}>
              新增客户
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="在营客户" value={String(TENANTS.length)} unit="家" hint="本月新增 2 家" />
        <StatCard label="A 级客户" value={String(TENANTS.filter((t) => t.level === 'A').length)} unit="家" hint="贡献 62% 收入" tone="primary" />
        <StatCard label="试用中" value={String(TENANTS.filter((t) => t.status === 'trial').length)} unit="家" hint="试用期 30 天" tone="warning" />
        <StatCard label="月度 ARPU" value={money(TENANTS.reduce((a, t) => a + t.monthlyAvg, 0) / TENANTS.length)} hint="平均每客户月消费" />
      </div>

      <Card pad={false}>
        <div className="p-4">
          <FilterBar extra={<span className="text-2xs text-ink-3">共 {rows.length} 家</span>}>
            <SearchInput value={kw} onChange={setKw} placeholder="搜索客户名称或税号" className="w-64" />
            <Select value={level} onChange={(e) => setLevel(e.target.value)} className="w-32">
              <option value="all">全部等级</option>
              <option value="A">A 级</option>
              <option value="B">B 级</option>
              <option value="C">C 级</option>
            </Select>
            <Select className="w-32" defaultValue="all">
              <option value="all">全部状态</option>
              <option>正常</option>
              <option>试用中</option>
              <option>冻结</option>
            </Select>
          </FilterBar>
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          pageSize={10}
          onRowClick={(r) => navigate(`/admin/customers/${r.id}`)}
          emptyTitle="没有符合条件的客户"
        />
      </Card>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="新增客户"
        subtitle="录入工商信息后系统自动生成客户编号"
        footer={
          <>
            <Button onClick={() => setOpen(false)}>取消</Button>
            <Button
              variant="primary"
              onClick={() => {
                setOpen(false);
                toast('客户已创建，待补充资质材料');
              }}
            >
              创建客户
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 block">
              <span className="mb-1.5 block text-xs font-medium text-ink-2">企业全称</span>
              <input className="h-9 w-full rounded-ctl border border-line px-3 text-sm" placeholder="与营业执照一致" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-2">统一社会信用代码</span>
              <input className="h-9 w-full rounded-ctl border border-line px-3 text-sm" placeholder="18 位" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-2">所属行业</span>
              <Select defaultValue="汽车零部件制造">
                <option>汽车零部件制造</option>
                <option>连锁零售</option>
                <option>金融</option>
                <option>供应链物流</option>
                <option>医疗信息化</option>
                <option>跨境电商</option>
              </Select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-2">客户等级</span>
              <Select defaultValue="B">
                <option value="A">A 级</option>
                <option value="B">B 级</option>
                <option value="C">C 级</option>
              </Select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-2">信用额度（元）</span>
              <input className="h-9 w-full rounded-ctl border border-line px-3 text-sm" defaultValue="200000" />
            </label>
            <label className="col-span-2 block">
              <span className="mb-1.5 block text-xs font-medium text-ink-2">注册地址</span>
              <input className="h-9 w-full rounded-ctl border border-line px-3 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-2">客户成功经理</span>
              <Select defaultValue="周敏">
                <option>周敏</option>
                <option>李昊</option>
                <option>孙倩</option>
              </Select>
            </label>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

/* ================= 客户详情 ================= */
export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useUIStore((s) => s.toast);
  const [tab, setTab] = useState('base');
  const tenant = TENANTS.find((t) => t.id === id);

  const bills = useMemo(() => BILLS.filter((b) => b.tenantId === id).sort((a, b) => (a.period < b.period ? 1 : -1)), [id]);
  const contracts = CONTRACTS.filter((c) => c.tenantId === id);
  const tickets = TICKETS.filter((t) => t.tenantId === id);

  if (!tenant) {
    return (
      <div className="py-20 text-center text-sm text-ink-2">
        客户不存在，<button className="link" onClick={() => navigate('/admin/customers')}>返回列表</button>
      </div>
    );
  }

  const cat = byCategory(tenant.id, '2026-09');
  const trend = dailySeries(tenant.id, '2026-09').map((d) => ({ date: d.date, amount: d.amount }));

  return (
    <div>
      <button
        onClick={() => navigate('/admin/customers')}
        className="mb-3 inline-flex items-center gap-1 text-xs text-ink-2 hover:text-ink-1"
      >
        <ArrowLeft size={13} /> 返回客户列表
      </button>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-base font-semibold text-white">
            {tenant.shortName.slice(0, 1)}
          </span>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-semibold text-ink-1">{tenant.name}</h1>
              <Badge tone={tenant.level === 'A' ? 'blue' : 'gray'}>{tenant.level} 级</Badge>
              <StatusBadge status={tenant.status} />
            </div>
            <p className="mt-1.5 text-sm text-ink-2">
              {tenant.industry} ｜ {tenant.taxNo} ｜ 客户经理 {tenant.salesOwner}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button icon={<Edit3 size={14} />} onClick={() => toast('已进入编辑模式', 'info')}>
            编辑
          </Button>
          <Button variant="primary" icon={<Building2 size={14} />} onClick={() => navigate('/finance/invoices/apply')}>
            去开票
          </Button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="月均消费（不含税）" value={money(tenant.monthlyAvg)} hint="近 6 个月平均" tone="primary" />
        <StatCard label="账户余额" value={money(tenant.balance)} hint="预付费余额" />
        <StatCard label="信用额度" value={money(tenant.creditLimit)} hint={`已用 ${((tenant.monthlyAvg / tenant.creditLimit) * 100).toFixed(0)}%`} />
        <StatCard label="累计结算" value={money(bills.filter((b) => b.status === 'settled').reduce((a, b) => a + b.total, 0))} hint={`${bills.length} 个账期`} tone="success" />
      </div>

      <Card pad={false}>
        <div className="px-5 pt-2">
          <Tabs
            tabs={[
              { key: 'base', label: '基本信息' },
              { key: 'bills', label: '账单', count: bills.length },
              { key: 'usage', label: '用量' },
              { key: 'contracts', label: '合同', count: contracts.length },
              { key: 'tickets', label: '工单', count: tickets.length },
              { key: 'logs', label: '操作记录' },
            ]}
            active={tab}
            onChange={setTab}
          />
        </div>

        <div className="p-5">
          {tab === 'base' && (
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2 lg:grid-cols-3">
              {[
                ['客户编号', tenant.id],
                ['企业全称', tenant.name],
                ['统一社会信用代码', tenant.taxNo],
                ['所属行业', tenant.industry],
                ['客户等级', `${tenant.level} 级`],
                ['客户状态', tenant.status === 'active' ? '正常' : tenant.status === 'trial' ? '试用中' : '冻结'],
                ['注册地址', tenant.address],
                ['联系电话', tenant.phone],
                ['开户银行', tenant.bankName],
                ['银行账号', tenant.bankAccount],
                ['主要联系人', `${tenant.contactName} ${tenant.contactPhone}`],
                ['合作起始日', tenant.createdAt],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-xs text-ink-3">{k}</div>
                  <div className="mt-1 text-sm text-ink-1">{v}</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'bills' && (
            <DataTable
              columns={[
                { key: 'period', title: '账期', width: 100, render: (r) => <span className="num">{r.period}</span> },
                { key: 'billNo', title: '账单号', width: 150, render: (r) => <span className="num text-xs text-ink-2">{r.billNo}</span> },
                { key: 'netAmount', title: '不含税', width: 130, align: 'right', render: (r) => <span className="num">{money(r.netAmount)}</span> },
                { key: 'taxAmount', title: '税额', width: 110, align: 'right', render: (r) => <span className="num text-ink-2">{money(r.taxAmount)}</span> },
                { key: 'total', title: '价税合计', width: 140, align: 'right', render: (r) => <span className="num font-medium">{money(r.total)}</span> },
                { key: 'status', title: '状态', width: 100, render: (r) => <StatusBadge status={r.status} label={BILL_STATUS_LABEL[r.status]} /> },
              ]}
              rows={bills}
              rowKey={(r) => r.id}
              pageSize={8}
            />
          )}

          {tab === 'usage' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="mb-2 text-sm font-medium text-ink-1">2026-09 日消费趋势</div>
                <TrendArea data={trend} xKey="date" yKey="amount" height={240} />
              </div>
              <div>
                <div className="mb-2 text-sm font-medium text-ink-1">类别构成</div>
                <div className="space-y-3">
                  {(Object.keys(cat) as ServiceCategory[]).map((k) => (
                    <div key={k} className="flex items-center justify-between text-xs">
                      <span className="text-ink-2">{CATEGORY_LABEL[k]}</span>
                      <span className="num text-ink-1">{money(cat[k])}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'contracts' && (
            <DataTable
              columns={[
                { key: 'contractNo', title: '合同编号', width: 170, render: (r) => <span className="num text-xs">{r.contractNo}</span> },
                { key: 'name', title: '合同名称' },
                { key: 'period', title: '服务期限', width: 200, render: (r) => <span className="num text-xs text-ink-2">{r.startDate} ~ {r.endDate}</span> },
                { key: 'amount', title: '金额', width: 140, align: 'right', render: (r) => <span className="num">{money(r.amount)}</span> },
                { key: 'status', title: '状态', width: 100, render: (r) => <StatusBadge status={r.status} /> },
              ]}
              rows={contracts}
              rowKey={(r) => r.id}
              pageSize={8}
              emptyTitle="该客户暂无合同"
            />
          )}

          {tab === 'tickets' && (
            <DataTable
              columns={[
                { key: 'title', title: '工单标题' },
                { key: 'category', title: '分类', width: 110, render: (r) => <Badge tone="gray">{r.category}</Badge> },
                { key: 'priority', title: '优先级', width: 80, render: (r) => <Badge tone={r.priority === 'high' ? 'red' : r.priority === 'medium' ? 'amber' : 'gray'}>{r.priority === 'high' ? '高' : r.priority === 'medium' ? '中' : '低'}</Badge> },
                { key: 'assignee', title: '处理人', width: 100 },
                { key: 'status', title: '状态', width: 100, render: (r) => <StatusBadge status={r.status} /> },
              ]}
              rows={tickets}
              rowKey={(r) => r.id}
              pageSize={8}
              emptyTitle="该客户暂无工单"
            />
          )}

          {tab === 'logs' && (
            <div className="space-y-2">
              {[
                ['2026-10-31 09:12', '登录控制台', '陈立'],
                ['2026-10-30 15:05', '查看 9 月账单', '何静'],
                ['2026-10-28 16:20', '更新数据集版本', '赵一鸣'],
                ['2026-10-26 11:40', '创建 API 密钥', '赵一鸣'],
                ['2026-10-20 10:22', '提交工单：A100 实例 NCCL 超时', '赵一鸣'],
              ].map(([t, a, who]) => (
                <div key={t} className="flex items-center gap-3 border-b border-line pb-2 text-xs last:border-0">
                  <span className="num w-36 shrink-0 text-ink-3">{t}</span>
                  <span className="flex-1 text-ink-1">{a}</span>
                  <span className="text-ink-2">{who}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
