import { useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { useUiStore } from '../store/uiStore';
import { registerChartThemes } from './theme';

registerChartThemes();

interface Props {
  option: Record<string, unknown>;
  height?: number | string;
  className?: string;
  onEvents?: Record<string, (params: unknown) => void>;
}

export default function EChart({ option, height = 260, className, onEvents }: Props) {
  const theme = useUiStore((s) => s.theme);
  const collapsed = useUiStore((s) => s.collapsed);
  const ref = useRef<ReactECharts>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const inst = ref.current?.getEchartsInstance();
      inst?.resize();
    }, 260);
    return () => clearTimeout(timer);
  }, [collapsed, theme]);

  return (
    <ReactECharts
      ref={ref}
      option={option}
      theme={theme === 'dark' ? 'cf-dark' : 'cf-light'}
      style={{ height, width: '100%' }}
      className={className}
      notMerge
      lazyUpdate
      onEvents={onEvents}
    />
  );
}
