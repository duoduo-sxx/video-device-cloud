import * as echarts from 'echarts';

let registered = false;

const baseAxis = (lineColor: string, labelColor: string, splitColor: string) => ({
  axisLine: { lineStyle: { color: lineColor } },
  axisTick: { show: false },
  axisLabel: { color: labelColor, fontSize: 11 },
  splitLine: { show: false, lineStyle: { color: splitColor } },
});

export const registerChartThemes = (): void => {
  if (registered) return;
  registered = true;

  echarts.registerTheme('cf-light', {
    color: ['#2563EB', '#06B6D4', '#16A34A', '#F59E0B', '#8B5CF6', '#EF4444', '#0EA5E9', '#64748B'],
    backgroundColor: 'transparent',
    textStyle: { fontFamily: 'inherit', color: '#475569' },
    title: { textStyle: { color: '#0F172A', fontSize: 13, fontWeight: 600 } },
    legend: { textStyle: { color: '#475569', fontSize: 12 }, itemWidth: 8, itemHeight: 8, icon: 'roundRect' },
    tooltip: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E5E9F2',
      borderWidth: 1,
      textStyle: { color: '#0F172A', fontSize: 12 },
      extraCssText: 'box-shadow: 0 6px 20px rgba(15,23,42,.12); border-radius: 8px; padding: 10px 12px;',
      axisPointer: { lineStyle: { color: '#CBD5E1' }, crossStyle: { color: '#CBD5E1' } },
    },
    categoryAxis: baseAxis('#E5E9F2', '#94A3B8', '#EEF2F7'),
    valueAxis: { ...baseAxis('#E5E9F2', '#94A3B8', '#EEF2F7'), axisLine: { show: false } },
    timeAxis: baseAxis('#E5E9F2', '#94A3B8', '#EEF2F7'),
    line: { symbol: 'none', lineStyle: { width: 2 } },
    bar: { barMaxWidth: 22 },
    pie: { label: { color: '#475569' } },
  });

  echarts.registerTheme('cf-dark', {
    color: ['#3B82F6', '#22D3EE', '#22C55E', '#FBBF24', '#A78BFA', '#F87171', '#38BDF8', '#94A3B8'],
    backgroundColor: 'transparent',
    textStyle: { fontFamily: 'inherit', color: '#94A3B8' },
    title: { textStyle: { color: '#E2E8F0', fontSize: 13, fontWeight: 600 } },
    legend: { textStyle: { color: '#94A3B8', fontSize: 12 }, itemWidth: 8, itemHeight: 8, icon: 'roundRect' },
    tooltip: {
      backgroundColor: '#16233A',
      borderColor: '#24344D',
      borderWidth: 1,
      textStyle: { color: '#E2E8F0', fontSize: 12 },
      extraCssText: 'box-shadow: 0 6px 20px rgba(0,0,0,.4); border-radius: 8px; padding: 10px 12px;',
      axisPointer: { lineStyle: { color: '#334155' }, crossStyle: { color: '#334155' } },
    },
    categoryAxis: baseAxis('#24344D', '#64748B', '#1E2B40'),
    valueAxis: { ...baseAxis('#24344D', '#64748B', '#1E2B40'), axisLine: { show: false } },
    timeAxis: baseAxis('#24344D', '#64748B', '#1E2B40'),
    line: { symbol: 'none', lineStyle: { width: 2 } },
    bar: { barMaxWidth: 22 },
    pie: { label: { color: '#94A3B8' } },
  });
};
