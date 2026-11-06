import type { ReactNode } from 'react';

export function StatusTag({
  label,
  color,
  dot = true,
}: {
  label: string;
  color: string;
  dot?: boolean;
}) {
  return (
    <span
      className="status-tag"
      style={{ color, background: `${color}14`, borderColor: `${color}33` }}
    >
      {dot && <i style={{ background: color }} />}
      {label}
    </span>
  );
}

export function PageHeader({
  title,
  desc,
  actions,
}: {
  title: string;
  desc?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {desc && <div className="page-desc">{desc}</div>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

const AVATAR_COLORS = ['#2563EB', '#06B6D4', '#16A34A', '#8B5CF6', '#F59E0B', '#EF4444', '#0EA5E9'];

export function UserAvatar({
  name,
  size = 28,
  color,
  square = false,
}: {
  name: string;
  size?: number;
  color?: string;
  square?: boolean;
}) {
  const bg = color ?? AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <span
      className="user-avatar"
      style={{
        width: size,
        height: size,
        background: `${bg}1F`,
        color: bg,
        fontSize: size * 0.42,
        borderRadius: square ? 6 : '50%',
      }}
      title={name}
    >
      {name.slice(0, 1)}
    </span>
  );
}

export function Sparkline({
  data,
  color = '#2563EB',
  width = 92,
  height = 30,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - 3 - ((v - min) / span) * (height - 6);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const area = `0,${height} ${points.join(' ')} ${width},${height}`;
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polygon points={area} fill={color} opacity="0.1" />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Ring({
  percent,
  size = 40,
  stroke = 4,
  color = '#2563EB',
  label,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${(c * Math.min(percent, 100)) / 100} ${c}`}
          strokeLinecap="round"
        />
      </svg>
      {label && <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{label}</span>}
    </span>
  );
}

export function KV({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="kv">
      <span className="kv-label">{label}</span>
      <span className="kv-value">{value}</span>
    </div>
  );
}
