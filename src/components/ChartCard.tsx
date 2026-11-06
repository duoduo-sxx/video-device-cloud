import type { ReactNode } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface Props {
  title?: string;
  sub?: string;
  extra?: ReactNode;
  option: EChartsOption;
  height?: number;
  flush?: boolean;
}

export default function ChartCard({ title, sub, extra, option, height = 280, flush }: Props) {
  return (
    <div className="panel" style={flush ? { padding: 0, overflow: 'hidden' } : undefined}>
      {title ? (
        <div className="panel-head" style={flush ? { padding: '16px 20px 0', marginBottom: 0 } : undefined}>
          <div className="panel-title">
            {title}
            {sub ? <span className="panel-sub">{sub}</span> : null}
          </div>
          {extra}
        </div>
      ) : null}
      <ReactECharts
        option={option}
        style={{ height, width: '100%' }}
        notMerge
        lazyUpdate
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
}
