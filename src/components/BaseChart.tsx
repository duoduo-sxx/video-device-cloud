import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart, GaugeChart, LineChart, PieChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  MarkPointComponent,
  TooltipComponent,
  TitleComponent,
  GraphicComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
import { useResolvedTheme } from '@/stores/uiStore';

echarts.use([
  LineChart,
  BarChart,
  PieChart,
  GaugeChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  MarkLineComponent,
  MarkPointComponent,
  GraphicComponent,
  CanvasRenderer,
]);

export function BaseChart({
  option,
  height = 260,
  loading = false,
  onEvents,
}: {
  option: EChartsOption;
  height?: number;
  loading?: boolean;
  onEvents?: Record<string, (params: unknown) => void>;
}) {
  const theme = useResolvedTheme();
  const isDark = theme === 'dark';

  const merged = useMemo<EChartsOption>(() => {
    const axisColor = isDark ? '#6E7887' : '#8A94A6';
    const gridColor = isDark ? '#222A35' : '#EEF0F4';
    const textColor = isDark ? '#A7B0BE' : '#475467';

    return {
      backgroundColor: 'transparent',
      textStyle: { fontFamily: 'inherit', color: textColor, fontSize: 11 },
      animationDuration: 480,
      animationEasing: 'cubicOut',
      grid: { left: 8, right: 12, top: 28, bottom: 4, containLabel: true },
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? '#1C232C' : '#FFFFFF',
        borderColor: isDark ? '#2A313C' : '#E7EAF0',
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: isDark ? '#E6EAF0' : '#101828', fontSize: 12 },
        axisPointer: { type: 'line', lineStyle: { color: axisColor, type: 'dashed' } },
        extraCssText: 'box-shadow: 0 4px 12px rgba(16,24,40,.08); border-radius: 8px;',
      },
      legend: {
        icon: 'roundRect',
        itemWidth: 8,
        itemHeight: 8,
        itemGap: 16,
        textStyle: { color: textColor, fontSize: 11 },
        top: 0,
        right: 0,
      },
      ...option,
      xAxis: option.xAxis
        ? (Array.isArray(option.xAxis)
            ? option.xAxis
            : {
                ...option.xAxis,
                axisLine: { lineStyle: { color: gridColor } },
                axisTick: { show: false },
                axisLabel: { color: axisColor, fontSize: 11, margin: 10 },
              })
        : undefined,
      yAxis: option.yAxis
        ? (Array.isArray(option.yAxis)
            ? option.yAxis.map((y) => ({
                ...y,
                splitLine: { lineStyle: { color: gridColor, type: 'dashed' as const } },
                axisLabel: { color: axisColor, fontSize: 11 },
              }))
            : {
                ...option.yAxis,
                splitLine: { lineStyle: { color: gridColor, type: 'dashed' as const } },
                axisLabel: { color: axisColor, fontSize: 11 },
              })
        : undefined,
    };
  }, [option, isDark]);

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={merged}
      style={{ height, width: '100%' }}
      showLoading={loading}
      notMerge
      lazyUpdate
      onEvents={onEvents}
    />
  );
}

export { echarts };
