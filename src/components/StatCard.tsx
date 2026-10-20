import type { ReactNode } from 'react';
import { Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Delta, Sparkline } from './ui';

export function StatCard({
  label,
  value,
  unit,
  delta,
  deltaGoodWhenUp = true,
  spark,
  sparkColor,
  foot,
  hint,
  accent,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  delta?: number;
  deltaGoodWhenUp?: boolean;
  spark?: number[];
  sparkColor?: string;
  foot?: ReactNode;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="np-stat">
      {accent && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 16,
            bottom: 16,
            width: 3,
            borderRadius: '0 3px 3px 0',
            background: accent,
          }}
        />
      )}
      <div className="np-stat-label">
        {label}
        {hint && (
          <Tooltip title={hint}>
            <QuestionCircleOutlined style={{ fontSize: 11, cursor: 'help', color: 'var(--np-text-disabled)' }} />
          </Tooltip>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        <div className="np-stat-value">
          {value}
          {unit && <small>{unit}</small>}
        </div>
        {spark && spark.length > 1 && (
          <div style={{ marginBottom: 4 }}>
            <Sparkline data={spark} color={sparkColor ?? 'var(--np-primary-500)'} width={76} height={26} />
          </div>
        )}
      </div>
      <div className="np-stat-foot">
        {delta !== undefined && <Delta value={delta} positiveIsGood={deltaGoodWhenUp} />}
        {foot}
      </div>
    </div>
  );
}
