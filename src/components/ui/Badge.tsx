import clsx from 'clsx';
import type { ReactNode } from 'react';

type Tone = 'gray' | 'blue' | 'green' | 'amber' | 'red' | 'cyan' | 'purple';

export const TONES: Record<Tone, string> = {
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

/** 业务状态 → 色调 */
export const STATUS_TONE: Record<string, Tone> = {
  // 账户
  active: 'green',
  paused: 'gray',
  auth_expired: 'red',
  balance_low: 'amber',
  // 同步
  success: 'green',
  running: 'blue',
  failed: 'red',
  waiting: 'gray',
  // 计划
  delivering: 'green',
  limited: 'amber',
  learn: 'cyan',
  ended: 'gray',
  // 质量
  passed: 'green',
  warning: 'amber',
  // 建议
  pending: 'amber',
  adopted: 'blue',
  dispatched: 'cyan',
  ignored: 'gray',
  // 变更单
  pending_approval: 'amber',
  effective: 'green',
  // 归因/其他
  matched: 'green',
  diff: 'amber',
  ready: 'green',
  building: 'cyan',
  used: 'blue',
  // 风险
  high: 'red',
  medium: 'amber',
  low: 'gray',
};

export const STATUS_TEXT: Record<string, string> = {
  // 账户
  active: '投放中',
  paused: '已暂停',
  auth_expired: '授权过期',
  balance_low: '余额预警',
  // 同步
  success: '成功',
  running: '同步中',
  failed: '失败',
  waiting: '排队中',
  // 计划
  delivering: '投放中',
  limited: '预算受限',
  learn: '学习期',
  ended: '已结束',
  // 质量
  passed: '通过',
  warning: '警告',
  // 建议
  pending: '待处理',
  adopted: '已采纳',
  dispatched: '已下发',
  ignored: '已忽略',
  // 变更单
  pending_approval: '待审批',
  effective: '已生效',
  // 其他
  matched: '一致',
  diff: '有差异',
  ready: '可用',
  building: '构建中',
  used: '使用中',
  high: '高',
  medium: '中',
  low: '低',
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const tone = STATUS_TONE[status] ?? 'gray';
  return (
    <Badge tone={tone} dot>
      {label ?? STATUS_TEXT[status] ?? status}
    </Badge>
  );
}

/** 异常等级 */
export function LevelBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const map = { high: ['red', '高优先级'], medium: ['amber', '中优先级'], low: ['gray', '低优先级'] } as const;
  return <Badge tone={map[level][0]}>{map[level][1]}</Badge>;
}

/** 环比涨跌（广告场景：成本涨=坏=红，转化涨=好=绿） */
export function DeltaBadge({
  value,
  goodWhenDown,
  suffix = '%',
}: {
  value: number;
  goodWhenDown?: boolean;
  suffix?: string;
}) {
  const positive = value >= 0;
  const good = goodWhenDown ? !positive : positive;
  return (
    <span
      className={clsx(
        'num inline-flex items-center gap-0.5 text-xs font-medium',
        good ? 'text-success' : 'text-danger',
      )}
    >
      {positive ? '▲' : '▼'}
      {Math.abs(value).toFixed(1)}
      {suffix}
    </span>
  );
}
