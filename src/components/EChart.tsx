import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption, EChartsType } from 'echarts';

interface EChartProps {
  option: EChartsOption;
  height?: number | string;
  onReady?: (chart: EChartsType) => void;
}

export function EChart({ option, height = 260, onReady }: EChartProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsType | null>(null);

  useEffect(() => {
    if (!boxRef.current) return undefined;
    const chart = echarts.init(boxRef.current, undefined, { renderer: 'canvas' });
    chartRef.current = chart;
    onReady?.(chart);
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(boxRef.current);
    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, true);
  }, [option]);

  return <div ref={boxRef} className="chart-box" style={{ height }} />;
}

export function chartToPng(chart: EChartsType | null, filename: string) {
  if (!chart) return;
  const url = chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#ffffff' });
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
}
