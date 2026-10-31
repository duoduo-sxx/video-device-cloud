import clsx from 'clsx';
import type { ReactNode } from 'react';

type Tone = 'gray' | 'blue' | 'green' | 'amber' | 'red' | 'cyan' | 'purple';

const TONES: Record<Tone, string> = {
  gray: 'bg-[#F2F4F7] text-ink-2',
  blue: 'bg-primary-soft text-primary',
  green: 'bg-success-soft text-success',
  amber: 'bg-warning-soft text-warning',
  red: 'bg-danger-soft text-danger',
  cyan: 'bg-[#ECFEFF] text-cyanx',
  purple: 'bg-[#F5F3FF] text-[#6D28D9]',
};

export function Badge({
  children,
  tone = 'gray',
  dot,
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        'inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium',
        TONES[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/* 业务状态 → 色调映射 */
export const STATUS_TONE: Record<string, Tone> = {
  // 账单
  draft: 'gray',
  pending_confirm: 'amber',
  confirmed: 'blue',
  invoiced: 'purple',
  settled: 'green',
  disputed: 'red',
  // 任务 / 实例 / 通用
  running: 'blue',
  success: 'green',
  failed: 'red',
  waiting: 'gray',
  stopped: 'gray',
  creating: 'amber',
  released: 'gray',
  // 发票
  pending: 'amber',
  issued: 'purple',
  sent: 'green',
  void: 'gray',
  // 客户 / 成员
  active: 'green',
  frozen: 'red',
  trial: 'cyan',
  disabled: 'gray',
  connected: 'green',
  error: 'red',
  // 模型 / 服务
  online: 'green',
  offline: 'gray',
  beta: 'amber',
  // 工单
  open: 'amber',
  processing: 'blue',
  resolved: 'green',
  closed: 'gray',
  // 合同
  expiring: 'amber',
  expired: 'red',
  // 告警
  firing: 'red',
  // 审批
  approved: 'green',
  rejected: 'red',
};

export const STATUS_TEXT: Record<string, string> = {
  draft: '待出账',
  pending_confirm: '待确认',
  confirmed: '已确认',
  invoiced: '已开票',
  settled: '已回款',
  disputed: '有异议',
  running: '运行中',
  success: '成功',
  failed: '失败',
  waiting: '排队中',
  stopped: '已停止',
  creating: '创建中',
  released: '已释放',
  pending: '待处理',
  issued: '已开票',
  sent: '已寄出',
  void: '已作废',
  active: '正常',
  frozen: '冻结',
  trial: '试用中',
  disabled: '已停用',
  connected: '已连接',
  error: '异常',
  online: '已上架',
  offline: '已下架',
  beta: '公测',
  open: '待受理',
  processing: '处理中',
  resolved: '已解决',
  closed: '已关闭',
  expiring: '即将到期',
  expired: '已到期',
  firing: '告警中',
  approved: '已通过',
  rejected: '已驳回',
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const tone = STATUS_TONE[status] ?? 'gray';
  return (
    <Badge tone={tone} dot>
      {label ?? STATUS_TEXT[status] ?? status}
    </Badge>
  );
}

export function RiskBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const map = { high: ['red', '高风险'], medium: ['amber', '中风险'], low: ['green', '低风险'] } as const;
  return <Badge tone={map[level][0]}>{map[level][1]}</Badge>;
}

export function PriorityBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const map = { high: ['red', '高'], medium: ['amber', '中'], low: ['gray', '低'] } as const;
  return <Badge tone={map[level][0]}>{map[level][1]}</Badge>;
}
