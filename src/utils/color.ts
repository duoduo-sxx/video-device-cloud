import type { Tone } from '@/types/enums';

export const TONE_STYLE: Record<Tone, { color: string; bg: string }> = {
  success: { color: 'var(--np-success)', bg: 'var(--np-success-bg)' },
  warning: { color: 'var(--np-warning)', bg: 'var(--np-warning-bg)' },
  danger: { color: 'var(--np-danger)', bg: 'var(--np-danger-bg)' },
  info: { color: 'var(--np-info)', bg: 'var(--np-info-bg)' },
  purple: { color: 'var(--np-purple)', bg: 'var(--np-purple-bg)' },
  default: { color: 'var(--np-text-tertiary)', bg: 'var(--np-bg-subtle)' },
};

export const CHART_COLORS = [
  '#4B5BF5',
  '#0BA5EC',
  '#17B26A',
  '#F79009',
  '#7A5AF8',
  '#F04438',
  '#0E9384',
  '#E4780C',
  '#667085',
  '#D4537E',
];

export function chartPalette(n: number): string[] {
  return CHART_COLORS.slice(0, n);
}

export function heatColor(ratio: number): string {
  if (ratio <= 0) return 'var(--np-bg-subtle)';
  if (ratio < 0.25) return 'rgba(75, 91, 245, 0.14)';
  if (ratio < 0.5) return 'rgba(75, 91, 245, 0.3)';
  if (ratio < 0.75) return 'rgba(75, 91, 245, 0.5)';
  return 'rgba(75, 91, 245, 0.76)';
}
