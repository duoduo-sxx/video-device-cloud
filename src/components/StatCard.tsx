import type { ReactNode } from 'react';
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { Sparkline } from './base';

interface Props {
  title: string;
  value: ReactNode;
  unit?: string;
  change?: number;
  changeLabel?: string;
  spark?: number[];
  color?: string;
  footer?: ReactNode;
  invert?: boolean;
}

export default function StatCard({
  title,
  value,
  unit,
  change,
  changeLabel = '较昨日',
  spark,
  color = '#2563EB',
  footer,
  invert = false,
}: Props) {
  const up = (change ?? 0) >= 0;
  const good = invert ? !up : up;
  const changeColor = !change ? 'var(--text-3)' : good ? '#16A34A' : '#DC2626';

  return (
    <div className="cf-card stat-card">
      <div className="stat-head">
        <span className="stat-title">{title}</span>
      </div>
      <div className="stat-body">
        <div>
          <div className="stat-value" style={{ color }}>
            {value}
            {unit && <span className="stat-unit">{unit}</span>}
          </div>
          {change !== undefined && (
            <div className="stat-change">
              <span style={{ color: changeColor }}>
                {up ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(change).toFixed(1)}%
              </span>
              <span className="stat-change-label">{changeLabel}</span>
            </div>
          )}
          {footer && <div className="stat-footer">{footer}</div>}
        </div>
        {spark && (
          <div className="stat-spark">
            <Sparkline data={spark} color={color} width={72} />
          </div>
        )}
      </div>
    </div>
  );
}
