import dayjs from 'dayjs';
import type { TrendData } from '../types';
import { mulberry32 } from '../utils/common';

export function genTrend(range: '24h' | '7d' | '30d'): TrendData {
  const seed = range === '24h' ? 7051 : range === '7d' ? 3329 : 9917;
  const rnd = mulberry32(seed);
  const count = range === '24h' ? 24 : range === '7d' ? 7 : 30;
  const labels: string[] = [];
  const volume: number[] = [];
  const rate: number[] = [];

  for (let i = 0; i < count; i += 1) {
    if (range === '24h') {
      labels.push(`${String(i).padStart(2, '0')}:00`);
    } else {
      labels.push(dayjs().subtract(count - 1 - i, 'day').format('MM-DD'));
    }
    const wave = Math.sin((i / count) * Math.PI * 2) * 0.35 + 1;
    const base = range === '24h' ? 6.4 : range === '7d' ? 148 : 142;
    volume.push(Number((base * wave * (0.82 + rnd() * 0.36)).toFixed(1)));
    rate.push(Number((98.6 + rnd() * 1.2).toFixed(2)));
  }
  return { labels, volume, rate };
}

export function genSpeedSeries(points = 60, base = 380): { labels: string[]; values: number[] } {
  const rnd = mulberry32(base * 31);
  const labels: string[] = [];
  const values: number[] = [];
  for (let i = points - 1; i >= 0; i -= 1) {
    labels.push(dayjs().subtract(i, 'minute').format('HH:mm'));
    const drift = Math.sin(i / 7) * 0.1;
    values.push(Number((base * (0.86 + rnd() * 0.28 + drift)).toFixed(0)));
  }
  return { labels, values };
}

export function genSpark(seed: number, count = 12, base = 50): number[] {
  const rnd = mulberry32(seed);
  return Array.from({ length: count }).map((_, i) => Number((base * (0.7 + rnd() * 0.6) + Math.sin(i / 2) * base * 0.12).toFixed(1)));
}

export function genHeatmap(): { data: [number, number, number][]; nodes: string[]; hours: string[] } {
  const nodes = ['hz-prod-01', 'hz-relay-02', 'bj-prod-01', 'bj-relay-02', 'bj-compute-03', 'sz-edge-07', 'sz-hub-03', 'cd-compute-03', 'sg-gw-01', 'sg-relay-02', 'fra-archive-01', 'fra-gw-02'];
  const hours = Array.from({ length: 24 }).map((_, i) => `${String(i).padStart(2, '0')}时`);
  const rnd = mulberry32(20261019);
  const data: [number, number, number][] = [];
  nodes.forEach((_, ni) => {
    hours.forEach((__, hi) => {
      const peak = Math.max(0, Math.sin(((hi - 8) / 24) * Math.PI * 2)) * 38;
      data.push([hi, ni, Math.round(18 + peak + rnd() * 34)]);
    });
  });
  return { data, nodes, hours };
}

export const REGION_COST = [
  { name: '华东1', value: 42, amount: 52480, volume: 128.4 },
  { name: '华北2', value: 26, amount: 32480, volume: 82.1 },
  { name: '华南1', value: 18, amount: 22470, volume: 56.8 },
  { name: '海外', value: 14, amount: 17480, volume: 41.2 },
];

export const CHANNEL_QUALITY = [
  { id: 'CH-02', name: '华北2 ↔ 华东1 内网', latency: 18, loss: 0.01, success: 99.98, score: 'A' },
  { id: 'CH-07', name: '华东1 内网归档', latency: 4, loss: 0, success: 99.99, score: 'A' },
  { id: 'CH-11', name: '华北2 分析集群总线', latency: 3, loss: 0, success: 99.97, score: 'A' },
  { id: 'CH-01', name: '华东1 ↔ 新加坡 专线', latency: 62, loss: 0.02, success: 99.92, score: 'A' },
  { id: 'CH-05', name: '华南1 → 新加坡 专线', latency: 48, loss: 0.03, success: 99.88, score: 'B' },
  { id: 'CH-08', name: '西南1 → 华东1 内网', latency: 36, loss: 0.05, success: 99.81, score: 'B' },
  { id: 'CH-06', name: '华北2 → 法兰克福 跨境', latency: 172, loss: 0.42, success: 99.32, score: 'B' },
  { id: 'CH-10', name: '新加坡 → 法兰克福 跨境', latency: 168, loss: 0.31, success: 99.41, score: 'B' },
  { id: 'CH-04', name: '法兰克福 ↔ 华东1 跨境', latency: 186, loss: 1.2, success: 98.24, score: 'C' },
  { id: 'CH-03', name: '深圳边缘 → 华南1 汇聚', latency: 24, loss: 2.1, success: 97.63, score: 'C' },
];

export const REPORT_ROWS = [
  { region: '华东1', volume: 128.4, tasks: 96, speed: 512, cost: 52480, price: 0.41, delta: 12.3 },
  { region: '华北2', volume: 82.1, tasks: 74, speed: 486, cost: 32480, price: 0.40, delta: 8.1 },
  { region: '华南1', volume: 56.8, tasks: 52, speed: 402, cost: 22470, price: 0.40, delta: -2.4 },
  { region: '西南1', volume: 24.6, tasks: 28, speed: 328, cost: 9840, price: 0.40, delta: 5.6 },
  { region: '亚太东南1', volume: 28.2, tasks: 34, speed: 296, cost: 18620, price: 0.66, delta: 18.9 },
  { region: '欧洲中部1', volume: 13.0, tasks: 18, speed: 214, cost: 14260, price: 1.10, delta: -1.2 },
];
