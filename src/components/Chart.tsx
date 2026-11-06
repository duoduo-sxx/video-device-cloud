import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { useAppStore } from '@/stores/app';

export function Chart({ option, height = 260, className }: { option: echarts.EChartsOption; height?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: 'canvas' });
    chartRef.current = chart;
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, true);
  }, [option, theme]);

  return <div ref={ref} className={className} style={{ width: '100%', height }} />;
}

export function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function baseAxis() {
  return {
    axisLine: { lineStyle: { color: cssVar('--border') } },
    axisTick: { show: false },
    axisLabel: { color: cssVar('--text-tertiary'), fontSize: 11 },
    splitLine: { lineStyle: { color: cssVar('--border'), type: 'dashed' as const } },
  };
}

export function tooltipStyle() {
  return {
    backgroundColor: cssVar('--bg-panel'),
    borderColor: cssVar('--border-strong'),
    borderWidth: 1,
    textStyle: { color: cssVar('--text-primary'), fontSize: 12 },
    extraCssText: 'box-shadow: 0 8px 24px rgba(0,0,0,.28); border-radius:8px;',
  };
}
