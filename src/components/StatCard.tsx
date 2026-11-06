import type { ReactNode } from 'react';
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';

interface Props {
  title: string;
  value: string;
  unit?: string;
  delta?: number;
  deltaLabel?: string;
  goodDirection?: 'up' | 'down';
  icon?: ReactNode;
  iconColor?: string;
  iconBg?: string;
  spark?: number[];
  footer?: ReactNode;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 76;
  const h = 26;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / span) * (h - 4) - 2}`)
    .join(' ');
  return (
    <svg className="spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    </svg>
  );
}

export default function StatCard({
  title,
  value,
  unit,
  delta,
  deltaLabel,
  goodDirection = 'up',
  icon,
  iconColor = '#1668FF',
  iconBg = '#EAF1FF',
  spark,
  footer,
}: Props) {
  const up = (delta ?? 0) >= 0;
  const isGood = up ? goodDirection === 'up' : goodDirection === 'down';
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{title}</span>
        {icon ? (
          <span className="stat-icon" style={{ color: iconColor, background: iconBg }}>
            {icon}
          </span>
        ) : null}
      </div>
      <div className="stat-value">
        {value}
        {unit ? <span className="stat-unit">{unit}</span> : null}
      </div>
      <div className="stat-foot">
        {typeof delta === 'number' ? (
          <span className="stat-delta" style={{ color: isGood ? '#00B894' : '#EF4444' }}>
            {up ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        ) : null}
        <span>{deltaLabel ?? (typeof delta === 'number' ? '较昨日' : '')}</span>
        {footer ? <span style={{ marginLeft: 'auto' }}>{footer}</span> : null}
      </div>
      {spark && spark.length > 1 ? <Sparkline data={spark} color={isGood ? '#00B894' : '#1668FF'} /> : null}
    </div>
  );
}
