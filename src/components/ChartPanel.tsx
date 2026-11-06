import { useRef, type ReactNode } from 'react';
import { Button, Spin } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import type { EChartsOption, EChartsType } from 'echarts';
import { EChart, chartToPng } from './EChart';
import { EmptyBlock, Panel } from './ui';

interface ChartPanelProps {
  title: ReactNode;
  sub?: ReactNode;
  extra?: ReactNode;
  option: EChartsOption;
  height?: number;
  loading?: boolean;
  empty?: boolean;
  filename?: string;
  unitHint?: string;
}

export function ChartPanel({
  title,
  sub,
  extra,
  option,
  height = 260,
  loading,
  empty,
  filename = 'chart',
  unitHint,
}: ChartPanelProps) {
  const chartRef = useRef<EChartsType | null>(null);

  return (
    <Panel
      title={title}
      sub={sub}
      extra={
        <>
          {unitHint ? <span className="axis-note">{unitHint}</span> : null}
          {extra}
          <Button
            size="small"
            type="text"
            icon={<DownloadOutlined />}
            title="下载 PNG"
            onClick={() => chartToPng(chartRef.current, `${filename}.png`)}
          />
        </>
      }
    >
      {loading ? (
        <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin />
        </div>
      ) : empty ? (
        <EmptyBlock height={height} />
      ) : (
        <EChart option={option} height={height} onReady={(chart) => (chartRef.current = chart)} />
      )}
    </Panel>
  );
}
