import type { ReactNode } from 'react';

export default function ChartCard({
  title,
  desc,
  extra,
  children,
  bodyStyle,
  height,
}: {
  title: ReactNode;
  desc?: string;
  extra?: ReactNode;
  children: ReactNode;
  bodyStyle?: React.CSSProperties;
  height?: number;
}) {
  return (
    <div className="cf-card chart-card">
      <div className="cf-card-head">
        <div>
          <div className="cf-card-title">{title}</div>
          {desc && <div className="cf-card-desc">{desc}</div>}
        </div>
        {extra && <div className="cf-card-extra">{extra}</div>}
      </div>
      <div style={{ ...bodyStyle, minHeight: height }}>{children}</div>
    </div>
  );
}
