import React from 'react';
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { sparkData } from '@/utils/format';

export function PageHeader({
  title,
  subtitle,
  actions,
  extra,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <div className="page-head">
      <div className="grow">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
        {extra}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  extra,
  children,
  className = '',
  style,
  noPad,
}: {
  title?: React.ReactNode;
  extra?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  noPad?: boolean;
}) {
  return (
    <div className={`panel ${className}`} style={{ ...(noPad ? { padding: 0 } : {}), ...style }}>
      {(title || extra) && (
        <div className="panel-head" style={noPad ? { padding: '14px 16px 0', marginBottom: 10 } : undefined}>
          <h3>{title}</h3>
          {extra && <div className="extra">{extra}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export function Sparkline({ seed, color = 'var(--brand)', width = 64, height = 24 }: { seed: number; color?: string; width?: number; height?: number }) {
  const data = sparkData(seed, 16);
  const max = Math.max(...data);
  const min = Math.min(...data);
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / Math.max(1, max - min)) * (height - 3) - 1.5;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg className="spark" width={width} height={height}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function MetricCard({
  label,
  value,
  unit,
  delta,
  deltaUp,
  hint,
  seed,
  onClick,
  color,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  delta?: string;
  deltaUp?: boolean;
  hint?: string;
  seed: number;
  onClick?: () => void;
  color?: string;
}) {
  return (
    <div className="metric" onClick={onClick}>
      <div className="label">{label}</div>
      <div className="value">
        {value}
        {unit && <small>{unit}</small>}
      </div>
      <div className="delta">
        {delta && (
          <span className={deltaUp ? 'up' : 'down'} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            {deltaUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            {delta}
          </span>
        )}
        {hint && <span>{hint}</span>}
      </div>
      <Sparkline seed={seed} color={color || 'var(--brand)'} />
    </div>
  );
}

const STATUS_TEXT: Record<string, string> = {
  ready: '已就绪',
  processing: '处理中',
  pending_review: '待审核',
  archived: '已归档',
  failed: '失败',
  queued: '排队中',
  running: '运行中',
  succeeded: '成功',
  canceled: '已取消',
  up: '可用',
  maintenance: '维护中',
  soon: '即将上线',
  active: '正常',
  disabled: '已停用',
  expiring: '即将过期',
  revoked: '已吊销',
};

const STATUS_CLASS: Record<string, string> = {
  ready: 'success',
  processing: 'running',
  pending_review: 'warning',
  archived: 'muted',
  failed: 'failed',
  queued: 'queued',
  running: 'running',
  succeeded: 'success',
  canceled: 'muted',
  up: 'success',
  maintenance: 'warning',
  soon: 'muted',
  active: 'success',
  disabled: 'muted',
  expiring: 'warning',
  revoked: 'failed',
};

export function StatusBadge({ status, text }: { status: string; text?: string }) {
  const cls = STATUS_CLASS[status] || 'muted';
  return (
    <span className={`badge ${cls} ${status === 'running' || status === 'processing' ? 'pulse' : ''}`}>
      <span className="dot" />
      {text || STATUS_TEXT[status] || status}
    </span>
  );
}

export function EmptyState({
  title,
  desc,
  action,
  icon,
}: {
  title: string;
  desc?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <svg width="64" height="48" viewBox="0 0 64 48" fill="none">
        <rect x="6" y="10" width="52" height="32" rx="4" stroke="var(--border-strong)" strokeWidth="1.5" />
        <path d="M6 34l14-10 10 8 9-7 19 12" stroke="var(--border-strong)" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="45" cy="20" r="4" stroke="var(--border-strong)" strokeWidth="1.5" />
      </svg>
      {icon}
      <h4>{title}</h4>
      {desc && <p>{desc}</p>}
      {action}
    </div>
  );
}

export function Cover({ index, label, height }: { index: number; label?: string; height?: number }) {
  return (
    <div className={`cover cover-${index % 8}`} style={{ height }}>
      {label && <span className="cover-label">{label}</span>}
    </div>
  );
}

export function KV({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="kv">
      {items.map(([k, v]) => (
        <React.Fragment key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

export function Divider() {
  return <div className="divider" />;
}
