import { useState } from 'react';
import {
  BellRing,
  Building2,
  Check,
  CreditCard,
  Landmark,
  Plus,
  Save,
  Shield,
  Smartphone,
  UserPlus,
  Wallet,
} from 'lucide-react';
import { Card, CardHeader, PageHeader, StatCard, KV } from '@/components/ui/Card';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Modal, Tabs } from '@/components/ui/Overlay';
import { Field, Select, Textarea, Toggle } from '@/components/ui/Form';
import { useAuthStore, useCurrentTenant } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { useUIStore } from '@/store/uiStore';
import { USERS } from '@/mocks/tenants';
import { AUDIT_LOGS, PAYMENTS } from '@/mocks/misc';
import { money } from '@/lib/format';
import { ROLE_MAP } from '@/mocks/roles';
import type { User } from '@/types';

/* ================= 企业信息 ================= */
export function Company() {
  const tenant = useCurrentTenant();
  const toast = useUIStore((s) => s.toast);
  const [tab, setTab] = useState('base');

  return (
    <div>
      <PageHeader
        title="企业信息"
        desc="工商信息与开票信息将用于账单与发票开具，变更后需重新核验"
        actions={
          <Button variant="primary" icon={<Save size={14} />} onClick={() => toast('企业信息已保存')}>
            保存
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2" pad={false}>
          <div className="px-5 pt-2">
            <Tabs
              tabs={[
                { key: 'base', label: '工商信息' },
                { key: 'invoice', label: '开票信息' },
                { key: 'contact', label: '联系人' },
              ]}
              active={tab}
              onChange={setTab}
            />
          </div>

          <div className="p-5">
            {tab === 'base' && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="企业全称" required className="col-span-2">
                  <input defaultValue={tenant.name} className="h-9 w-full rounded-ctl border border-line px-3 text-sm" />
                </Field>
                <Field label="统一社会信用代码" required>
                  <input defaultValue={tenant.taxNo} className="num h-9 w-full rounded-ctl border border-line px-3 text-sm" />
                </Field>
                <Field label="所属行业">
                  <Select defaultValue={tenant.industry}>
                    <option>{tenant.industry}</option>
                    <option>汽车零部件制造</option>
                    <option>新能源</option>
                    <option>装备制造</option>
                  </Select>
                </Field>
                <Field label="注册地址" required className="col-span-2">
                  <input defaultValue={tenant.address} className="h-9 w-full rounded-ctl border border-line px-3 text-sm" />
                </Field>
                <Field label="联系电话">
                  <input defaultValue={tenant.phone} className="h-9 w-full rounded-ctl border border-line px-3 text-sm" />
                </Field>
                <Field label="企业规模">
                  <Select defaultValue="large">
                    <option value="large">大型（1000 人以上）</option>
                    <option value="mid">中型（300-1000 人）</option>
                    <option value="small">小型（300 人以下）</option>
                  </Select>
                </Field>
              </div>
            )}

            {tab === 'invoice' && (
              <div className="space-y-4">
                <div className="rounded-ctl bg-primary-soft px-3.5 py-3 text-2xs leading-relaxed text-primary">
                  开票信息变更后，已开具的发票需办理红冲后重开，请谨慎修改。我司默认开具税率 6% 的增值税专用发票。
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="发票抬头" required className="col-span-2">
                    <input defaultValue={tenant.name} className="h-9 w-full rounded-ctl border border-line px-3 text-sm" />
                  </Field>
                  <Field label="纳税人识别号" required>
                    <input defaultValue={tenant.taxNo} className="num h-9 w-full rounded-ctl border border-line px-3 text-sm" />
                  </Field>
                  <Field label="发票类型">
                    <Select defaultValue="special">
                      <option value="special">增值税专用发票</option>
                      <option value="normal">增值税普通发票</option>
                    </Select>
                  </Field>
                  <Field label="开户银行" required>
                    <input defaultValue={tenant.bankName} className="h-9 w-full rounded-ctl border border-line px-3 text-sm" />
                  </Field>
                  <Field label="银行账号" required>
                    <input defaultValue={tenant.bankAccount} className="num h-9 w-full rounded-ctl border border-line px-3 text-sm" />
                  </Field>
                  <Field label="注册地址及电话" className="col-span-2">
                    <input defaultValue={`${tenant.address} ${tenant.phone}`} className="h-9 w-full rounded-ctl border border-line px-3 text-sm" />
                  </Field>
                  <Field label="发票接收邮箱" className="col-span-2" hint="电子发票开具后将发送至该邮箱">
                    <input defaultValue="finance@hengrui-auto.com" className="h-9 w-full rounded-ctl border border-line px-3 text-sm" />
                  </Field>
                </div>
              </div>
            )}

            {tab === 'contact' && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="主要联系人">
                  <input defaultValue={tenant.contactName} className="h-9 w-full rounded-ctl border border-line px-3 text-sm" />
                </Field>
                <Field label="联系电话">
                  <input defaultValue={tenant.contactPhone} className="h-9 w-full rounded-ctl border border-line px-3 text-sm" />
                </Field>
                <Field label="财务联系人">
                  <input defaultValue="何静" className="h-9 w-full rounded-ctl border border-line px-3 text-sm" />
                </Field>
                <Field label="财务联系电话">
                  <input defaultValue="139****4410" className="h-9 w-full rounded-ctl border border-line px-3 text-sm" />
                </Field>
                <Field label="技术对接人" className="col-span-2">
                  <input defaultValue="赵一鸣（数据算法组）" className="h-9 w-full rounded-ctl border border-line px-3 text-sm" />
                </Field>
                <Field label="备注" className="col-span-2">
                  <Textarea placeholder="补充说明，例如结算特殊约定" />
                </Field>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="账户概况" />
            <div className="mt-4 space-y-4">
              <KV label="客户编号">{tenant.id}</KV>
              <KV label="客户等级">
                <Badge tone="blue">{tenant.level} 级客户</Badge>
              </KV>
              <KV label="信用额度">{money(tenant.creditLimit)}</KV>
              <KV label="协议签署日">{tenant.createdAt}</KV>
              <KV label="客户成功经理">{tenant.salesOwner}</KV>
            </div>
          </Card>

          <Card>
            <CardHeader title="资质认证" />
            <div className="mt-3 space-y-2">
              {[
                ['营业执照', '已认证'],
                ['一般纳税人资格', '已认证'],
                ['开票信息核验', '已通过'],
                ['数据安全承诺函', '已签署'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between rounded-ctl bg-[#F9FAFB] px-3 py-2">
                  <span className="text-xs text-ink-2">{k}</span>
                  <span className="flex items-center gap-1 text-2xs text-success">
                    <Check size={11} /> {v}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ================= 成员与权限 ================= */
export function Members() {
  const user = useAuthStore((s) => s.user);
  const toast = useUIStore((s) => s.toast);
  const [open, setOpen] = useState(false);
  const rows = USERS.filter((u) => u.tenantId === (user?.tenantId ?? 'TEN-0001'));

  const columns: Column<User>[] = [
    {
      key: 'name',
      title: '成员',
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-soft text-2xs font-semibold text-primary">
            {r.name.slice(0, 1)}
          </span>
          <div>
            <div className="text-sm font-medium text-ink-1">{r.name}</div>
            <div className="mt-0.5 text-2xs text-ink-3">{r.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'department', title: '部门', width: 140, render: (r) => <span className="text-xs text-ink-2">{r.department}</span> },
    { key: 'role', title: '角色', width: 130, render: (r) => <Badge tone="blue">{ROLE_MAP[r.role].name}</Badge> },
    { key: 'phone', title: '手机号', width: 130, render: (r) => <span className="num text-xs text-ink-2">{r.phone}</span> },
    { key: 'lastLoginAt', title: '最近登录', width: 150, render: (r) => <span className="num text-xs text-ink-2">{r.lastLoginAt.slice(5, 16).replace('T', ' ')}</span> },
    { key: 'status', title: '状态', width: 90, render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'op',
      title: '操作',
      width: 120,
      align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-2">
          <button className="text-xs text-primary" onClick={() => toast(`已打开 ${r.name} 的角色配置`, 'info')}>
            配置
          </button>
          <button
            className="text-xs text-ink-2"
            onClick={() => toast(r.status === 'active' ? `已停用 ${r.name}` : `已启用 ${r.name}`, 'info')}
          >
            {r.status === 'active' ? '停用' : '启用'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="成员与权限"
        desc="按职责分配角色，业务使用者不可见账单金额与开票信息"
        actions={
          <Button variant="primary" icon={<UserPlus size={14} />} onClick={() => setOpen(true)}>
            邀请成员
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="成员总数" value={String(rows.length)} unit="人" hint="含 1 位已停用" />
        <StatCard label="企业管理员" value={String(rows.filter((r) => r.role === 'tenant_admin').length)} unit="人" />
        <StatCard label="业务使用者" value={String(rows.filter((r) => r.role === 'tenant_member').length)} unit="人" tone="primary" />
        <StatCard label="客户财务" value={String(rows.filter((r) => r.role === 'tenant_finance').length)} unit="人" />
      </div>

      <Card pad={false}>
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} pageSize={8} emptyTitle="还没有成员" />
      </Card>

      <Card className="mt-4">
        <CardHeader title="角色权限说明" desc="权限点由平台统一定义，租户内仅可分配角色" extra={<Shield size={15} className="text-ink-3" />} />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#F9FAFB] text-ink-2">
              <tr>
                <th className="px-3 py-2 text-left font-medium">角色</th>
                <th className="px-3 py-2 text-left font-medium">可见范围</th>
                <th className="px-3 py-2 text-left font-medium">说明</th>
              </tr>
            </thead>
            <tbody>
              {(['tenant_admin', 'tenant_member', 'tenant_finance'] as const).map((r) => (
                <tr key={r} className="border-t border-line">
                  <td className="px-3 py-2.5 font-medium text-ink-1">{ROLE_MAP[r].name}</td>
                  <td className="px-3 py-2.5 text-ink-2">
                    {r === 'tenant_admin'
                      ? '全部客户端菜单 + 账单确认 + 开票申请'
                      : r === 'tenant_member'
                        ? '算力 / 模型 / 数据 / 匹配 / 生成 / API'
                        : '账单 / 发票 / 合同 / 用量'}
                  </td>
                  <td className="px-3 py-2.5 text-ink-2">{ROLE_MAP[r].desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="邀请成员"
        subtitle="被邀请人将收到邮件，点击链接激活账号"
        footer={
          <>
            <Button onClick={() => setOpen(false)}>取消</Button>
            <Button
              variant="primary"
              onClick={() => {
                setOpen(false);
                toast('邀请已发送，有效期 7 天');
              }}
            >
              发送邀请
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="邮箱地址" required>
            <input placeholder="name@company.com" className="h-9 w-full rounded-ctl border border-line px-3 text-sm" />
          </Field>
          <Field label="姓名" required>
            <input placeholder="张三" className="h-9 w-full rounded-ctl border border-line px-3 text-sm" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="所属部门">
              <input placeholder="数据算法组" className="h-9 w-full rounded-ctl border border-line px-3 text-sm" />
            </Field>
            <Field label="分配角色" required>
              <Select defaultValue="tenant_member">
                <option value="tenant_admin">企业管理员</option>
                <option value="tenant_member">业务使用者</option>
                <option value="tenant_finance">客户财务</option>
              </Select>
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ================= 充值 ================= */
export function Recharge() {
  const balance = useAppStore((s) => s.balance);
  const recharge = useAppStore((s) => s.recharge);
  const toast = useUIStore((s) => s.toast);
  const [amount, setAmount] = useState<number | ''>(50000);
  const [method, setMethod] = useState('transfer');
  const [success, setSuccess] = useState(false);

  const presets = [10000, 50000, 100000, 300000];

  function submit() {
    const v = Number(amount);
    if (!v || v <= 0) {
      toast('请输入有效充值金额', 'error');
      return;
    }
    recharge(v);
    setSuccess(true);
    toast(`充值 ${money(v)} 成功，余额已更新`);
  }

  return (
    <div>
      <PageHeader title="账户充值" desc="充值金额进入账户余额，用于抵扣算力与模型调用消费" />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="充值金额" desc="单笔最低 ¥1,000，单笔最高 ¥1,000,000" />
          <div className="mt-4">
            <div className="grid grid-cols-4 gap-2">
              {presets.map((p) => (
                <button
                  key={p}
                  onClick={() => setAmount(p)}
                  className={`rounded-ctl border py-3 text-center transition-colors ${
                    amount === p ? 'border-primary bg-primary-soft' : 'border-line hover:bg-[#FCFCFD]'
                  }`}
                >
                  <div className="num text-sm font-medium text-ink-1">{money(p)}</div>
                  {p === 100000 && <div className="mt-0.5 text-2xs text-warning">赠 2% 算力券</div>}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <Field label="自定义金额（元）" required>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-3">¥</span>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="num h-10 w-full rounded-ctl border border-line pl-7 pr-3 text-base font-medium focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring"
                  />
                </div>
              </Field>
            </div>

            <div className="mt-5">
              <div className="mb-2 text-xs font-medium text-ink-2">支付方式</div>
              <div className="space-y-2">
                {[
                  ['transfer', '银行转账', '对公转账，1-2 个工作日到账', Landmark],
                  ['alipay', '企业支付宝', '实时到账，单笔上限 20 万', Wallet],
                  ['wechat', '微信支付', '实时到账，单笔上限 5 万', Smartphone],
                ].map(([k, label, desc, Icon]) => {
                  const I = Icon as typeof Landmark;
                  return (
                    <button
                      key={k as string}
                      onClick={() => setMethod(k as string)}
                      className={`flex w-full items-center gap-3 rounded-ctl border px-3.5 py-3 text-left transition-colors ${
                        method === k ? 'border-primary bg-primary-soft' : 'border-line hover:bg-[#FCFCFD]'
                      }`}
                    >
                      <I size={17} className={method === k ? 'text-primary' : 'text-ink-3'} />
                      <div className="flex-1">
                        <div className="text-xs font-medium text-ink-1">{label as string}</div>
                        <div className="mt-0.5 text-2xs text-ink-3">{desc as string}</div>
                      </div>
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                          method === k ? 'border-primary' : 'border-[#D0D5DD]'
                        }`}
                      >
                        {method === k && <span className="h-2 w-2 rounded-full bg-primary" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
              <div className="text-xs text-ink-3">
                应付金额 <span className="num ml-1 text-lg font-semibold text-ink-1">{money(Number(amount) || 0)}</span>
              </div>
              <Button variant="primary" icon={<CreditCard size={14} />} onClick={submit}>
                确认充值
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="当前余额" />
            <div className="num mt-3 text-3xl font-semibold text-primary">{money(balance)}</div>
            <div className="mt-1 text-xs text-ink-3">可用于抵扣全部服务的消费</div>
            <div className="mt-4 space-y-2 border-t border-line pt-3 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-3">信用额度</span>
                <span className="num text-ink-1">{money(800000)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">本月已消费</span>
                <span className="num text-ink-1">{money(241860)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">预计可用天数</span>
                <span className="num text-ink-1">约 15 天</span>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="充值记录" />
            <div className="mt-3 space-y-2.5">
              {PAYMENTS.filter((p) => p.tenantId === 'TEN-0001')
                .slice(-4)
                .reverse()
                .map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-xs">
                    <div>
                      <div className="text-ink-1">账户充值</div>
                      <div className="mt-0.5 num text-2xs text-ink-3">{p.paidAt.slice(0, 10)}</div>
                    </div>
                    <span className="num text-success">+{money(p.amount)}</span>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={success}
        onClose={() => setSuccess(false)}
        title="充值成功"
        width={420}
        footer={
          <Button variant="primary" block onClick={() => setSuccess(false)}>
            完成
          </Button>
        }
      >
        <div className="flex flex-col items-center py-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-soft">
            <Check size={24} className="text-success" />
          </span>
          <div className="num mt-3 text-xl font-semibold text-ink-1">{money(Number(amount) || 0)}</div>
          <div className="mt-1 text-xs text-ink-3">已充入账户余额，当前余额 {money(balance)}</div>
          <div className="mt-4 rounded-ctl bg-[#F9FAFB] px-3 py-2 text-2xs text-ink-3">
            演示环境支付不会产生真实扣款
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ================= 消费预警 ================= */
export function Alerts() {
  const toast = useUIStore((s) => s.toast);
  const [balanceOn, setBalanceOn] = useState(true);
  const [dailyOn, setDailyOn] = useState(true);
  const [quotaOn, setQuotaOn] = useState(true);
  const [emailOn, setEmailOn] = useState(true);
  const [smsOn, setSmsOn] = useState(false);

  return (
    <div>
      <PageHeader
        title="消费预警"
        desc="在余额不足或消费异常时及时通知，避免服务中断"
        actions={
          <Button variant="primary" icon={<Save size={14} />} onClick={() => toast('预警配置已保存')}>
            保存配置
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="预警规则" desc="可同时开启多条，命中任一条即发送通知" />
          <div className="mt-4 space-y-3">
            {[
              {
                title: '余额预警',
                desc: '账户余额低于阈值时通知，建议预留 10 天消费额度',
                on: balanceOn,
                set: setBalanceOn,
                value: '150000',
                unit: '元',
              },
              {
                title: '日消费预警',
                desc: '单日消费超过阈值时通知，用于发现异常调用',
                on: dailyOn,
                set: setDailyOn,
                value: '30000',
                unit: '元/日',
              },
              {
                title: '配额预警',
                desc: 'API 密钥日配额使用率超过阈值时通知',
                on: quotaOn,
                set: setQuotaOn,
                value: '80',
                unit: '%',
              },
            ].map((r) => (
              <div key={r.title} className="rounded-ctl border border-line px-3.5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-ink-1">{r.title}</div>
                    <div className="mt-0.5 text-2xs text-ink-3">{r.desc}</div>
                  </div>
                  <Toggle checked={r.on} onChange={r.set} />
                </div>
                {r.on && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-2xs text-ink-3">阈值</span>
                    <input
                      defaultValue={r.value}
                      className="num h-8 w-32 rounded-ctl border border-line px-2.5 text-xs focus:border-primary focus:outline-none"
                    />
                    <span className="text-2xs text-ink-3">{r.unit}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-line pt-4">
            <div className="mb-2 text-xs font-medium text-ink-2">通知方式</div>
            <div className="flex gap-6">
              <Toggle checked={emailOn} onChange={setEmailOn} label="邮件" />
              <Toggle checked={smsOn} onChange={setSmsOn} label="短信" />
            </div>
            <div className="mt-3 text-2xs text-ink-3">
              邮件将发送至 finance@hengrui-auto.com 与 chenli@hengrui-auto.com
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="当前状态" extra={<BellRing size={15} className="text-ink-3" />} />
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-2">账户余额</span>
                <Badge tone="amber">低于预警线</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-2">今日消费</span>
                <span className="num text-xs text-ink-1">{money(8420)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-2">配额使用率</span>
                <span className="num text-xs text-ink-1">63.7%</span>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="近期通知" />
            <div className="mt-3 space-y-3">
              {[
                ['余额低于预警线', '2026-10-30 09:00', 'warning'],
                ['9 月账单已生成待确认', '2026-10-01 10:12', 'info'],
                ['调用配额使用率 63.7%', '2026-10-29 18:00', 'info'],
              ].map(([t, d, tone]) => (
                <div key={t} className="flex gap-2">
                  <span
                    className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                      tone === 'warning' ? 'bg-warning' : 'bg-primary'
                    }`}
                  />
                  <div>
                    <div className="text-xs text-ink-1">{t}</div>
                    <div className="mt-0.5 num text-2xs text-ink-3">{d}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ================= 操作日志 ================= */
export function OpLogs() {
  const toast = useUIStore((s) => s.toast);
  const rows = AUDIT_LOGS.filter((l) => l.actorRole.includes('企业') || l.actorRole.includes('客户') || l.actorRole.includes('业务'));

  return (
    <div>
      <PageHeader
        title="操作日志"
        desc="记录本租户成员的关键操作，用于审计与问题追溯，保留 180 天"
        actions={
          <Button icon={<Save size={14} />} onClick={() => toast('操作日志已导出', 'info')}>
            导出
          </Button>
        }
      />

      <Card pad={false}>
        <DataTable
          columns={[
            { key: 'createdAt', title: '时间', width: 170, render: (r) => <span className="num text-xs text-ink-2">{r.createdAt.replace('T', ' ')}</span> },
            { key: 'actorName', title: '操作人', width: 110, render: (r) => <span className="text-sm">{r.actorName}</span> },
            { key: 'actorRole', title: '角色', width: 120, render: (r) => <Badge tone="gray">{r.actorRole}</Badge> },
            { key: 'action', title: '操作内容', render: (r) => <span className="text-sm">{r.action}</span> },
            { key: 'targetType', title: '对象类型', width: 100, render: (r) => <span className="text-xs text-ink-2">{r.targetType}</span> },
            { key: 'target', title: '对象', width: 190, render: (r) => <span className="font-mono text-2xs text-ink-2">{r.target}</span> },
            { key: 'ip', title: '来源 IP', width: 140, render: (r) => <span className="num text-xs text-ink-2">{r.ip}</span> },
          ]}
          rows={rows}
          rowKey={(r) => r.id}
          pageSize={12}
          emptyTitle="暂无操作记录"
        />
      </Card>
    </div>
  );
}
