import { Fragment, useState } from 'react';
import { Check, Download, MessageSquare, ShieldCheck, Star, X } from 'lucide-react';
import { Card, CardHeader, PageHeader, StatCard } from '@/components/ui/Card';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import { Badge, PriorityBadge, RiskBadge, StatusBadge } from '@/components/ui/Badge';
import { Drawer, Modal, Progress, Tabs } from '@/components/ui/Overlay';
import { FilterBar, SearchInput, Select, Textarea } from '@/components/ui/Form';
import { useUIStore } from '@/store/uiStore';
import { AUDIT_LOGS, CONTRACTS, REVIEW_ITEMS, TICKETS } from '@/mocks/misc';
import { ROLES } from '@/mocks/roles';
import { USERS } from '@/mocks/tenants';
import { money } from '@/lib/format';
import type { Contract, ReviewItem, Ticket, User } from '@/types';

/* ================= 合同管理（平台侧） ================= */
export function AdminContracts() {
  const rows = CONTRACTS;

  const columns: Column<Contract>[] = [
    { key: 'contractNo', title: '合同编号', width: 170, render: (r) => <span className="num text-xs">{r.contractNo}</span> },
    { key: 'name', title: '合同名称' },
    { key: 'tenantId', title: '客户', width: 130, render: (r) => <span className="text-xs text-ink-2">{r.tenantId}</span> },
    { key: 'period', title: '服务期限', width: 200, render: (r) => <span className="num text-xs text-ink-2">{r.startDate} ~ {r.endDate}</span> },
    { key: 'amount', title: '合同金额', width: 140, align: 'right', render: (r) => <span className="num">{money(r.amount)}</span> },
    { key: 'status', title: '状态', width: 100, render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div>
      <PageHeader title="合同管理" desc="平台侧合同台账，与客户控制台的合同数据同源" actions={<Button icon={<Download size={14} />}>导出</Button>} />
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="合同总数" value="48" unit="份" hint="本年度新增 22 份" />
        <StatCard label="合同总金额" value={money(48260000)} tone="primary" />
        <StatCard label="即将到期" value="6" unit="份" hint="90 天内到期" tone="warning" />
      </div>
      <Card pad={false}>
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} pageSize={8} />
      </Card>
    </div>
  );
}

/* ================= 工单 ================= */
export function Tickets() {
  const toast = useUIStore((s) => s.toast);
  const [tab, setTab] = useState('all');
  const [kw, setKw] = useState('');
  const [detail, setDetail] = useState<Ticket | null>(null);
  const [reply, setReply] = useState('');

  const rows = TICKETS.filter((t) => (tab === 'all' ? true : t.status === tab)).filter(
    (t) => !kw || t.title.includes(kw) || t.tenantName.includes(kw),
  );

  const columns: Column<Ticket>[] = [
    { key: 'id', title: '工单号', width: 120, render: (r) => <span className="num text-xs text-ink-2">{r.id}</span> },
    { key: 'title', title: '标题', render: (r) => <span className="text-sm">{r.title}</span> },
    { key: 'tenantName', title: '客户', width: 210, render: (r) => <span className="text-xs text-ink-2">{r.tenantName}</span> },
    { key: 'category', title: '分类', width: 110, render: (r) => <Badge tone="gray">{r.category}</Badge> },
    { key: 'priority', title: '优先级', width: 80, render: (r) => <PriorityBadge level={r.priority} /> },
    { key: 'assignee', title: '处理人', width: 90, render: (r) => <span className="text-xs text-ink-2">{r.assignee}</span> },
    { key: 'status', title: '状态', width: 100, render: (r) => <StatusBadge status={r.status} /> },
    { key: 'slaDeadline', title: 'SLA 截止', width: 140, render: (r) => <span className="num text-xs text-ink-2">{r.slaDeadline.slice(5, 16).replace('T', ' ')}</span> },
    {
      key: 'op',
      title: '',
      width: 70,
      align: 'right',
      render: (r) => (
        <button className="text-xs text-primary" onClick={(e) => { e.stopPropagation(); setDetail(r); }}>
          处理
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="工单支持" desc="客户提交的技术与业务支持请求，按 SLA 计时响应" />

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="待受理" value={String(TICKETS.filter((t) => t.status === 'open').length)} unit="条" tone="warning" />
        <StatCard label="处理中" value={String(TICKETS.filter((t) => t.status === 'processing').length)} unit="条" tone="primary" />
        <StatCard label="本月已解决" value={String(TICKETS.filter((t) => t.status === 'resolved' || t.status === 'closed').length)} unit="条" tone="success" />
        <StatCard label="SLA 达成率" value="94.2" unit="%" hint="P1 工单 2 小时响应" />
      </div>

      <Card pad={false}>
        <div className="px-4 pt-2">
          <Tabs
            tabs={[
              { key: 'all', label: '全部', count: TICKETS.length },
              { key: 'open', label: '待受理' },
              { key: 'processing', label: '处理中' },
              { key: 'resolved', label: '已解决' },
            ]}
            active={tab}
            onChange={setTab}
            className="mb-3"
          />
          <FilterBar extra={<span className="text-2xs text-ink-3">共 {rows.length} 条</span>}>
            <SearchInput value={kw} onChange={setKw} placeholder="搜索工单标题或客户" className="w-64" />
            <Select className="w-32" defaultValue="all">
              <option value="all">全部优先级</option>
              <option>高</option>
              <option>中</option>
              <option>低</option>
            </Select>
          </FilterBar>
        </div>
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} pageSize={10} onRowClick={setDetail} emptyTitle="没有工单" />
      </Card>

      <Drawer
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? detail.title : ''}
        subtitle={detail ? `${detail.id} ｜ ${detail.tenantName}` : ''}
        width={620}
        footer={
          <>
            <Button icon={<X size={14} />} onClick={() => { toast('工单已关闭', 'info'); setDetail(null); }}>
              关闭工单
            </Button>
            <Button variant="primary" icon={<MessageSquare size={14} />} onClick={() => { toast('回复已发送'); setReply(''); }}>
              发送回复
            </Button>
          </>
        }
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <PriorityBadge level={detail.priority} />
              <StatusBadge status={detail.status} />
              <Badge tone="gray">{detail.category}</Badge>
              <span className="ml-auto num text-2xs text-ink-3">SLA {detail.slaDeadline.slice(5, 16).replace('T', ' ')}</span>
            </div>

            <div className="space-y-3">
              {detail.replies.length === 0 && (
                <div className="rounded-ctl bg-[#F9FAFB] px-3.5 py-3 text-xs text-ink-3">暂无回复记录</div>
              )}
              {detail.replies.map((r, i) => (
                <div key={i} className="rounded-ctl border border-line px-3.5 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-ink-1">{r.by}</span>
                    <span className="num text-2xs text-ink-3">{r.at.replace('T', ' ')}</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-2">{r.content}</p>
                </div>
              ))}
            </div>

            <div>
              <div className="mb-1.5 text-xs font-medium text-ink-2">回复客户</div>
              <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="填写处理进展或解决方案…" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-ink-3">处理人</div>
                <div className="mt-1 text-ink-1">{detail.assignee}</div>
              </div>
              <div>
                <div className="text-ink-3">创建时间</div>
                <div className="num mt-1 text-ink-1">{detail.createdAt.replace('T', ' ')}</div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

/* ================= 内容审核 ================= */
export function ComplianceReviews() {
  const toast = useUIStore((s) => s.toast);
  const [tab, setTab] = useState('pending');
  const [detail, setDetail] = useState<ReviewItem | null>(null);

  const rows = REVIEW_ITEMS.filter((r) => (tab === 'all' ? true : r.status === tab));

  const columns: Column<ReviewItem>[] = [
    { key: 'tenantName', title: '客户', width: 220, render: (r) => <span className="text-xs">{r.tenantName}</span> },
    { key: 'contentType', title: '内容类型', width: 120, render: (r) => <Badge tone="gray">{r.contentType}</Badge> },
    { key: 'snippet', title: '命中内容', render: (r) => <span className="line-clamp-1 text-xs text-ink-2">{r.snippet}</span> },
    { key: 'reason', title: '拦截原因', width: 200, render: (r) => <span className="text-2xs text-ink-2">{r.reason}</span> },
    { key: 'riskLevel', title: '风险', width: 90, render: (r) => <RiskBadge level={r.riskLevel} /> },
    { key: 'status', title: '状态', width: 100, render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'op',
      title: '操作',
      width: 110,
      align: 'right',
      render: (r) =>
        r.status === 'pending' ? (
          <div className="flex justify-end gap-2">
            <button className="text-xs text-success" onClick={(e) => { e.stopPropagation(); toast('已放行该内容'); }}>
              放行
            </button>
            <button className="text-xs text-danger" onClick={(e) => { e.stopPropagation(); toast('已维持拦截', 'info'); }}>
              驳回
            </button>
          </div>
        ) : (
          <button className="text-xs text-primary" onClick={(e) => { e.stopPropagation(); setDetail(r); }}>
            查看
          </button>
        ),
    },
  ];

  return (
    <div>
      <PageHeader title="内容审核" desc="命中内容安全策略的生成结果将进入人工复核队列，拦截内容不计费" />

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="待审核" value={String(REVIEW_ITEMS.filter((r) => r.status === 'pending').length)} unit="条" tone="warning" />
        <StatCard label="高风险" value={String(REVIEW_ITEMS.filter((r) => r.riskLevel === 'high').length)} unit="条" />
        <StatCard label="今日放行" value={String(REVIEW_ITEMS.filter((r) => r.status === 'approved').length)} unit="条" tone="success" />
        <StatCard label="今日拦截" value={String(REVIEW_ITEMS.filter((r) => r.status === 'rejected').length)} unit="条" />
      </div>

      <Card pad={false}>
        <div className="px-4 pt-2">
          <Tabs
            tabs={[
              { key: 'pending', label: '待审核', count: REVIEW_ITEMS.filter((r) => r.status === 'pending').length },
              { key: 'approved', label: '已放行' },
              { key: 'rejected', label: '已拦截' },
              { key: 'all', label: '全部', count: REVIEW_ITEMS.length },
            ]}
            active={tab}
            onChange={setTab}
            className="mb-3"
          />
        </div>
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} pageSize={10} onRowClick={setDetail} emptyTitle="审核队列已清空" />
      </Card>

      <Modal open={!!detail} onClose={() => setDetail(null)} title="审核详情" footer={<Button onClick={() => setDetail(null)}>关闭</Button>}>
        {detail && (
          <div className="space-y-3">
            <div className="rounded-ctl border border-line bg-[#F9FAFB] p-4 text-xs leading-relaxed text-ink-1">{detail.snippet}</div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-ink-3">客户</div>
                <div className="mt-1 text-ink-1">{detail.tenantName}</div>
              </div>
              <div>
                <div className="text-ink-3">内容类型</div>
                <div className="mt-1 text-ink-1">{detail.contentType}</div>
              </div>
              <div>
                <div className="text-ink-3">拦截原因</div>
                <div className="mt-1 text-ink-1">{detail.reason}</div>
              </div>
              <div>
                <div className="text-ink-3">风险等级</div>
                <div className="mt-1">
                  <RiskBadge level={detail.riskLevel} />
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ================= 审计日志 ================= */
export function AuditLogs() {
  const [kw, setKw] = useState('');
  const rows = AUDIT_LOGS.filter((l) => !kw || l.action.includes(kw) || l.actorName.includes(kw));

  return (
    <div>
      <PageHeader
        title="审计日志"
        desc="记录全平台敏感操作，保留 12 个月，支持按操作人与对象检索"
        actions={<Button icon={<Download size={14} />}>导出</Button>}
      />

      <Card pad={false}>
        <div className="p-4">
          <FilterBar extra={<span className="text-2xs text-ink-3">共 {rows.length} 条</span>}>
            <SearchInput value={kw} onChange={setKw} placeholder="搜索操作内容或操作人" className="w-64" />
            <Select className="w-36" defaultValue="all">
              <option value="all">全部对象类型</option>
              <option>账单</option>
              <option>发票</option>
              <option>密钥</option>
              <option>定价</option>
            </Select>
          </FilterBar>
        </div>
        <DataTable
          columns={[
            { key: 'createdAt', title: '时间', width: 170, render: (r) => <span className="num text-xs text-ink-2">{r.createdAt.replace('T', ' ')}</span> },
            { key: 'actorName', title: '操作人', width: 120, render: (r) => <span className="text-sm">{r.actorName}</span> },
            { key: 'actorRole', title: '角色', width: 130, render: (r) => <Badge tone="gray">{r.actorRole}</Badge> },
            { key: 'action', title: '操作', render: (r) => <span className="text-sm">{r.action}</span> },
            { key: 'target', title: '对象', width: 190, render: (r) => <span className="font-mono text-2xs text-ink-2">{r.target}</span> },
            { key: 'ip', title: '来源 IP', width: 140, render: (r) => <span className="num text-xs text-ink-2">{r.ip}</span> },
          ]}
          rows={rows}
          rowKey={(r) => r.id}
          pageSize={14}
          emptyTitle="没有匹配的审计记录"
        />
      </Card>
    </div>
  );
}

/* ================= 平台用户 ================= */
export function PlatformUsers() {
  const toast = useUIStore((s) => s.toast);
  const rows = USERS.filter((u) => u.tenantId === 'PLATFORM');

  const columns: Column<User>[] = [
    { key: 'name', title: '姓名', width: 120, render: (r) => <span className="text-sm font-medium">{r.name}</span> },
    { key: 'email', title: '邮箱', render: (r) => <span className="text-xs text-ink-2">{r.email}</span> },
    { key: 'department', title: '部门', width: 140, render: (r) => <span className="text-xs text-ink-2">{r.department}</span> },
    { key: 'role', title: '角色', width: 120, render: (r) => <Badge tone="blue">{r.role}</Badge> },
    { key: 'lastLoginAt', title: '最近登录', width: 150, render: (r) => <span className="num text-xs text-ink-2">{r.lastLoginAt.slice(5, 16).replace('T', ' ')}</span> },
    { key: 'status', title: '状态', width: 90, render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'op',
      title: '操作',
      width: 100,
      align: 'right',
      render: (r) => (
        <button className="text-xs text-primary" onClick={() => toast(`已打开 ${r.name} 的账号配置`, 'info')}>
          配置
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="平台用户" desc="平台内部账号，仅超管可管理" actions={<Button variant="primary">新增账号</Button>} />
      <Card pad={false}>
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} pageSize={8} />
      </Card>
    </div>
  );
}

/* ================= 角色权限 ================= */
const PERM_GROUPS = [
  { label: '客户控制台', perms: ['console.overview', 'console.compute', 'console.models', 'console.data', 'console.match', 'console.generate', 'console.api', 'console.usage', 'console.billing', 'console.invoice', 'console.settings'] },
  { label: '运营后台', perms: ['admin.overview', 'admin.customer', 'admin.catalog', 'admin.pricing', 'admin.compute', 'admin.ticket', 'admin.compliance', 'admin.system'] },
  { label: '财务结算', perms: ['finance.overview', 'finance.reconcile', 'finance.invoice', 'finance.receivable', 'finance.report'] },
];

export function Roles() {
  const toast = useUIStore((s) => s.toast);
  const [sel, setSel] = useState<string[]>(ROLES.map((r) => r.code));

  return (
    <div>
      <PageHeader
        title="角色权限"
        desc="勾选配置角色可访问的权限点，变更实时生效并记录审计"
        actions={
          <Button variant="primary" icon={<ShieldCheck size={14} />} onClick={() => toast('权限配置已保存，5 分钟内全平台生效')}>
            保存配置
          </Button>
        }
      />

      <Card pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-[#F9FAFB]">
                <th className="min-w-[260px] px-4 py-3 text-left font-medium text-ink-2">权限点</th>
                {ROLES.map((r) => (
                  <th key={r.code} className="px-3 py-3 text-center font-medium text-ink-2">
                    <div className="text-xs">{r.name}</div>
                    <div className="num mt-0.5 text-2xs font-normal text-ink-3">{r.permissions.includes('*') ? '全部' : `${r.permissions.length} 项`}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERM_GROUPS.map((g) => (
                <Fragment key={g.label}>
                  <tr className="bg-[#FCFCFD]">
                    <td colSpan={ROLES.length + 1} className="border-t border-line px-4 py-2 text-2xs font-medium text-ink-2">
                      {g.label}
                    </td>
                  </tr>
                  {g.perms.map((p) => (
                    <tr key={p} className="hover:bg-[#FCFCFD]">
                      <td className="border-t border-line px-4 py-2 font-mono text-2xs text-ink-2">{p}</td>
                      {ROLES.map((r) => {
                        const has = r.permissions.includes('*') || r.permissions.includes(p);
                        return (
                          <td key={r.code} className="border-t border-line px-3 py-2 text-center">
                            {has ? (
                              <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-primary-soft">
                                <Check size={11} className="text-primary" strokeWidth={3} />
                              </span>
                            ) : (
                              <span className="inline-block h-4 w-4 rounded border border-line" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-4">
        <CardHeader title="角色说明" extra={<Star size={15} className="text-ink-3" />} />
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ROLES.map((r) => (
            <div key={r.code} className="rounded-ctl border border-line px-3.5 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink-1">{r.name}</span>
                <Badge tone={r.scope === 'console' ? 'blue' : r.scope === 'finance' ? 'purple' : 'cyan'}>
                  {r.scope === 'console' ? '客户侧' : r.scope === 'finance' ? '财务侧' : '平台侧'}
                </Badge>
              </div>
              <div className="mt-1 text-2xs leading-relaxed text-ink-3">{r.desc}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-4 flex items-center gap-2">
        <Button size="sm" onClick={() => setSel([])}>
          清空选择
        </Button>
        <span className="text-2xs text-ink-3">当前已选 {sel.length} 个角色</span>
        <div className="ml-auto flex items-center gap-2">
          <Progress value={72} height={4} />
          <span className="text-2xs text-ink-3">权限覆盖率 72%</span>
        </div>
      </div>
    </div>
  );
}
