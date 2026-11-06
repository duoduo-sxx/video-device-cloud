import type { EChartsOption } from 'echarts';

export const CHART_COLORS = ['#1668FF', '#00B894', '#F59E0B', '#7C5CFF', '#EF4444', '#0EA5E9'];

export const axisLabelStyle = {
  color: '#8A99B0',
  fontSize: 11,
};

export const splitLineStyle = {
  lineStyle: { color: '#EEF2F8', type: 'dashed' as const },
};

export const chartTooltip = {
  backgroundColor: '#fff',
  borderColor: '#E9EEF6',
  borderWidth: 1,
  padding: [8, 12] as [number, number],
  textStyle: { color: '#0F172A', fontSize: 12 },
  extraCssText: 'box-shadow:0 6px 20px rgba(16,24,40,0.1);border-radius:8px;',
};

export const baseOption: EChartsOption = {
  color: CHART_COLORS,
  textStyle: { fontFamily: 'Inter, "PingFang SC", system-ui, sans-serif' },
  tooltip: chartTooltip,
};

export const legendStyle = {
  icon: 'roundRect',
  itemWidth: 8,
  itemHeight: 8,
  textStyle: { color: '#5A6B87', fontSize: 11 },
};
