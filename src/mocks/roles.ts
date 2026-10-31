import type { Role, RoleCode } from '@/types';

const CONSOLE_ALL = [
  'console.overview',
  'console.compute',
  'console.models',
  'console.data',
  'console.match',
  'console.generate',
  'console.api',
  'console.usage',
  'console.billing',
  'console.invoice',
  'console.settings',
];

export const ROLES: Role[] = [
  {
    code: 'tenant_admin',
    name: '企业管理员',
    scope: 'console',
    desc: '负责企业账号、密钥、充值与账单确认',
    permissions: [...CONSOLE_ALL, 'billing.confirm', 'invoice.apply', 'member.manage'],
  },
  {
    code: 'tenant_member',
    name: '业务使用者',
    scope: 'console',
    desc: '建任务、跑数据，不可见账单金额与开票',
    permissions: [
      'console.overview',
      'console.compute',
      'console.models',
      'console.data',
      'console.match',
      'console.generate',
      'console.api',
      'console.usage',
    ],
  },
  {
    code: 'tenant_finance',
    name: '客户财务',
    scope: 'console',
    desc: '仅核对账单、申请与下载发票',
    permissions: ['console.overview', 'console.usage', 'console.billing', 'console.invoice'],
  },
  {
    code: 'ops',
    name: '平台运营',
    scope: 'admin',
    desc: '客户、服务目录、定价、工单与内容合规',
    permissions: ['admin.overview', 'admin.customer', 'admin.catalog', 'admin.pricing', 'admin.ticket', 'admin.compliance'],
  },
  {
    code: 'ops_compute',
    name: '算力运维',
    scope: 'admin',
    desc: '资源池、节点、调度与告警处理',
    permissions: ['admin.overview', 'admin.compute'],
  },
  {
    code: 'finance',
    name: '平台财务',
    scope: 'finance',
    desc: '对账、出账、开票、回款与报表',
    permissions: ['finance.overview', 'finance.reconcile', 'finance.invoice', 'finance.receivable', 'finance.report'],
  },
  {
    code: 'super_admin',
    name: '平台超管',
    scope: 'admin',
    desc: '全平台权限与系统配置',
    permissions: ['*'],
  },
];

export const ROLE_MAP: Record<RoleCode, Role> = ROLES.reduce(
  (acc, r) => ({ ...acc, [r.code]: r }),
  {} as Record<RoleCode, Role>,
);

export function hasPerm(perms: string[], need: string): boolean {
  if (perms.includes('*')) return true;
  return perms.includes(need);
}
