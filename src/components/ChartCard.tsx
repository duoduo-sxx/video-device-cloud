import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { Card } from 'antd';

interface Props {
  option: echarts.EChartsOption;
  height?: number;
  title?: React.ReactNode;
  extra?: React.ReactNode;
  style?: React.CSSProperties;
}

// 统一 ECharts 封装
export const ChartCard: React.FC<Props> = ({ option, height = 320, title, extra, style }) => {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (!chartRef.current) {
      chartRef.current = echarts.init(ref.current);
      const onResize = () => chartRef.current?.resize();
      window.addEventListener('resize', onResize);
      return () => {
        window.removeEventListener('resize', onResize);
        chartRef.current?.dispose();
        chartRef.current = null;
      };
    }
    return undefined;
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, true);
  }, [option]);

  const chart = <div ref={ref} style={{ height, width: '100%' }} />;
  if (title === undefined && extra === undefined) return <div style={style}>{chart}</div>;
  return (
    <Card size="small" title={title} extra={extra} style={style}>
      {chart}
    </Card>
  );
};
