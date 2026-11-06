import { useMemo } from 'react';
import { mulberry32 } from '@/utils/format';

export function peaks(seed: number, n = 120): number[] {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, (_, i) => {
    const env = Math.sin((i / n) * Math.PI) * 0.45 + 0.55;
    const beat = i % 7 === 0 ? 0.28 : 0;
    return Math.min(1, (0.18 + rnd() * 0.62 + beat) * env + 0.06);
  });
}

export function Waveform({
  seed,
  progress = 0,
  height = 48,
  bars = 140,
  color = 'var(--accent)',
  dim = 'var(--border-strong)',
}: {
  seed: number;
  progress?: number;
  height?: number;
  bars?: number;
  color?: string;
  dim?: string;
}) {
  const data = useMemo(() => peaks(seed, bars), [seed, bars]);
  const w = 100 / bars;
  return (
    <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      {data.map((v, i) => {
        const h = Math.max(1.2, v * (height - 4));
        const active = i / bars <= progress;
        return (
          <rect
            key={i}
            x={i * w + w * 0.18}
            y={(height - h) / 2}
            width={w * 0.64}
            height={h}
            rx={0.5}
            fill={active ? color : dim}
            opacity={active ? 0.95 : 0.55}
          />
        );
      })}
    </svg>
  );
}
