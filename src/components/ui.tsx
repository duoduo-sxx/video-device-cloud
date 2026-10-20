import type { CSSProperties, ReactNode } from 'react';
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import type { Tone } from '@/types/enums';
import { TONE_STYLE } from '@/utils/color';
import { colorOf } from '@/mock';

/* ---------------- StatusTag ---------------- */
export function StatusTag({
  label,
  tone,
  dot = true,
  style,
}: {
  label: string;
  tone: Tone;
  dot?: boolean;
  style?: CSSProperties;
}) {
  const s = TONE_STYLE[tone];
  return (
    <span className="np-tag" style={{ color: s.color, background: s.bg, ...style }}>
      {dot && <span className="np-tag-dot" style={{ background: s.color }} />}
      {label}
    </span>
  );
}

export function PlainTag({ children }: { children: ReactNode }) {
  return <span className="np-tag-plain">{children}</span>;
}

/* ---------------- Avatar ---------------- */
export function Avatar({
  name,
  size = 24,
  title,
}: {
  name: string;
  size?: number;
  title?: string;
}) {
  return (
    <span
      className="np-avatar"
      title={title ?? name}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, Math.round(size * 0.4)),
        background: colorOf(name),
      }}
    >
      {name.length > 2 ? name.slice(-2) : name}
    </span>
  );
}

export function AvatarGroup({ names, size = 22, max = 4 }: { names: string[]; size?: number; max?: number }) {
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  return (
    <span className="np-avatar-group">
      {shown.map((n) => (
        <Avatar key={n} name={n} size={size} />
      ))}
      {rest > 0 && (
        <span
          className="np-avatar"
          style={{
            width: size,
            height: size,
            fontSize: 10,
            background: 'var(--np-bg-subtle)',
            color: 'var(--np-text-tertiary)',
          }}
        >
          +{rest}
        </span>
      )}
    </span>
  );
}

/* ---------------- Progress ---------------- */
export function Progress({
  value,
  color,
  height = 6,
  showTrack = true,
}: {
  value: number;
  color?: string;
  height?: number;
  showTrack?: boolean;
}) {
  const v = Math.max(0, Math.min(100, value));
  const auto = v >= 90 ? 'var(--np-success)' : v >= 50 ? 'var(--np-primary-500)' : 'var(--np-warning)';
  return (
    <div
      className="np-progress"
      style={{ height, background: showTrack ? undefined : 'transparent' }}
      role="progressbar"
      aria-valuenow={Math.round(v)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="np-progress-inner" style={{ width: `${v}%`, background: color ?? auto }} />
    </div>
  );
}

/* ---------------- Delta ---------------- */
export function Delta({ value, positiveIsGood = true }: { value: number; positiveIsGood?: boolean }) {
  const up = value >= 0;
  const good = positiveIsGood ? up : !up;
  const color = Math.abs(value) < 0.0005 ? 'var(--np-text-tertiary)' : good ? 'var(--np-success)' : 'var(--np-danger)';
  return (
    <span className="np-delta" style={{ color }}>
      {up ? <ArrowUpOutlined style={{ fontSize: 10 }} /> : <ArrowDownOutlined style={{ fontSize: 10 }} />}
      {Math.abs(value * 100).toFixed(1)}%
    </span>
  );
}

/* ---------------- Empty ---------------- */
export function EmptyState({
  title = '暂无数据',
  desc,
  action,
}: {
  title?: string;
  desc?: string;
  action?: ReactNode;
}) {
  return (
    <div className="np-empty">
      <svg className="np-empty-art" viewBox="0 0 96 76" fill="none" aria-hidden>
        <rect x="12" y="18" width="62" height="46" rx="8" stroke="var(--np-border-strong)" strokeWidth="1.5" />
        <rect x="22" y="10" width="62" height="46" rx="8" fill="var(--np-bg-surface)" stroke="var(--np-border-strong)" strokeWidth="1.5" />
        <line x1="30" y1="26" x2="62" y2="26" stroke="var(--np-border-strong)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="30" y1="35" x2="52" y2="35" stroke="var(--np-border)" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="70" cy="47" r="12" fill="var(--np-primary-50)" stroke="var(--np-primary-200)" strokeWidth="1.5" />
        <path d="M66 47h8M70 43v8" stroke="var(--np-primary-500)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <div className="np-empty-title">{title}</div>
      {desc && <div className="np-empty-desc">{desc}</div>}
      {action}
    </div>
  );
}

/* ---------------- KV ---------------- */
export function Kv({ items }: { items: { k: string; v: ReactNode }[] }) {
  return (
    <dl className="np-kv">
      {items.map((i) => (
        <div key={i.k} style={{ display: 'contents' }}>
          <dt>{i.k}</dt>
          <dd>{i.v}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ---------------- Sparkline ---------------- */
export function Sparkline({
  data,
  color = 'var(--np-primary-500)',
  width = 88,
  height = 28,
  fill = true,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  fill?: boolean;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = width / (data.length - 1);
  const points = data.map((v, i) => [i * step, height - ((v - min) / span) * (height - 4) - 2] as const);
  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${path} L${width},${height} L0,${height} Z`;
  const gid = `spark-${Math.abs(data.length * 31 + Math.round(max))}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gid})`} />}
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
