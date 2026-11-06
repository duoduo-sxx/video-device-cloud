import type { ReactNode } from 'react';
import { Tag } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';

export function PageHeader({
  title,
  description,
  extra,
}: {
  title: string;
  description?: string;
  extra?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <h1 className="page-title">{title}</h1>
        {description ? <p className="page-desc">{description}</p> : null}
      </div>
      {extra ? <div className="page-extra">{extra}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  sub,
  extra,
  children,
  flush,
  style,
}: {
  title?: ReactNode;
  sub?: ReactNode;
  extra?: ReactNode;
  children: ReactNode;
  flush?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <section className={flush ? 'panel flush' : 'panel'} style={style}>
      {title ? (
        <div className="panel-head" style={flush ? { padding: '14px 16px 0', marginBottom: 10 } : undefined}>
          <div className="panel-title">
            {title}
            {sub ? <span className="panel-sub">{sub}</span> : null}
          </div>
          {extra ? <div className="row-gap">{extra}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Sparkline({ data, color = '#1668dc' }: { data: number[]; color?: string }) {
  if (!data.length) return <div className="sparkline" />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${24 - ((v - min) / span) * 20}`)
    .join(' ');
  return (
    <svg className="sparkline" viewBox="0 0 100 26" preserveAspectRatio="none" width="100%" height="26">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function StatCard({
  label,
  value,
  unit,
  delta,
  hint,
  spark,
  color = '#1668dc',
  onClick,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  delta?: number;
  hint?: string;
  spark?: number[];
  color?: string;
  onClick?: () => void;
}) {
  return (
    <div className="stat-card" onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
      <div className="stat-label">
        <span>{label}</span>
        {typeof delta === 'number' ? (
          <span style={{ color: delta >= 0 ? '#16a34a' : '#f5222d' }}>
            {delta >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        ) : null}
      </div>
      <div className="stat-value">
        {value}
        {unit ? <span className="stat-unit">{unit}</span> : null}
      </div>
      {hint ? <div className="stat-foot">{hint}</div> : null}
      {spark ? <Sparkline data={spark} color={color} /> : null}
    </div>
  );
}

export function StatusTag({ text, color }: { text: string; color: string }) {
  return (
    <Tag color={color} bordered={false} style={{ marginInlineEnd: 0 }}>
      {text}
    </Tag>
  );
}

export function Dot({ color }: { color: string }) {
  return <span className="tag-dot" style={{ background: color }} />;
}

export function HealthRing({ score, size = 64, label }: { score: number; size?: number; label?: string }) {
  const radius = size / 2 - 5;
  const circumference = 2 * Math.PI * radius;
  const color = score >= 90 ? '#16a34a' : score >= 80 ? '#52c41a' : score >= 70 ? '#faad14' : score >= 60 ? '#fa8c16' : '#f5222d';
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#eef2f7" strokeWidth="6" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * circumference} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={size * 0.28}
          fontWeight="600"
          fill="#1f2733"
        >
          {score}
        </text>
      </svg>
      {label ? <span className="small muted">{label}</span> : null}
    </div>
  );
}

export function EmptyBlock({ text = '暂无数据，请调整筛选条件', height = 180 }: { text?: string; height?: number }) {
  return (
    <div className="chart-empty" style={{ height }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="64" height="40" viewBox="0 0 64 40" style={{ opacity: 0.5 }}>
          <rect x="8" y="8" width="48" height="26" rx="4" fill="none" stroke="#c3ccda" strokeWidth="1.2" />
          <path d="M8 18h12l4 6h16l4-6h12" fill="none" stroke="#c3ccda" strokeWidth="1.2" />
        </svg>
        <div style={{ marginTop: 8 }}>{text}</div>
      </div>
    </div>
  );
}

export function KeyValue({ items, columns = 1 }: { items: { label: string; value: ReactNode }[]; columns?: number }) {
  return (
    <dl className="kv" style={{ gridTemplateColumns: columns === 2 ? '96px 1fr 96px 1fr' : '96px 1fr' }}>
      {items.map((item) => (
        <div key={item.label} style={{ display: 'contents' }}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
