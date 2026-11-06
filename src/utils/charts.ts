import type { EChartsOption } from 'echarts';

export const CHART_COLORS = ['#1668dc', '#13c2c2', '#722ed1', '#faad14', '#f5222d', '#52c41a'];

export const axisLabel = { color: '#8a94a6', fontSize: 11 };
export const axisLine = { lineStyle: { color: '#dfe5ee' } };
export const splitLine = { lineStyle: { color: '#eef2f7', type: 'dashed' as const } };

export const tooltipBase = {
  backgroundColor: '#ffffff',
  borderColor: '#e5e9f0',
  borderWidth: 1,
  padding: [8, 12] as [number, number],
  textStyle: { color: '#1f2733', fontSize: 12 },
  extraCssText: 'box-shadow: 0 4px 14px rgba(16,30,54,0.10); border-radius: 6px;',
};

export const gridBase = { left: 52, right: 20, top: 36, bottom: 34 };

export function baseOption(overrides: EChartsOption = {}): EChartsOption {
  return {
    color: CHART_COLORS,
    grid: gridBase,
    textStyle: { fontFamily: 'inherit' },
    tooltip: { ...tooltipBase, trigger: 'axis' },
    ...overrides,
  } as EChartsOption;
}

export function categoryAxis(data: (string | number)[], name?: string) {
  return {
    type: 'category' as const,
    data,
    name,
    nameTextStyle: { color: '#8a94a6', fontSize: 11 },
    axisLabel,
    axisLine,
    axisTick: { show: false },
  };
}

export function valueAxis(name?: string, extra: Record<string, unknown> = {}) {
  return {
    type: 'value' as const,
    name,
    nameTextStyle: { color: '#8a94a6', fontSize: 11, padding: [0, 0, 0, 0] },
    axisLabel,
    axisLine: { show: false },
    splitLine,
    ...extra,
  };
}
