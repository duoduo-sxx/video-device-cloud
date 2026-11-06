import { Rng } from './random';

export interface AllanPoint {
  tau: number;
  sigma: number;
}

export interface AllanParams {
  q: number;
  n: number;
  b: number;
  k: number;
  r: number;
}

const TAU_MIN = 0.01;
const TAU_MAX = 10000;
const POINT_COUNT = 60;

export function allanParamsOf(arw: number, biasInstability: number): AllanParams {
  return {
    q: 2.5e-7,
    n: arw / 60,
    b: biasInstability / (3600 * 0.6643),
    k: 4.0e-8 * (0.6 + arw * 12),
    r: 1.0e-11 * (0.6 + biasInstability * 8),
  };
}

export function allanSeries(arw: number, biasInstability: number, seed = 20261019): AllanPoint[] {
  const p = allanParamsOf(arw, biasInstability);
  const rng = new Rng(seed);
  const points: AllanPoint[] = [];
  for (let i = 0; i < POINT_COUNT; i += 1) {
    const tau = TAU_MIN * (TAU_MAX / TAU_MIN) ** (i / (POINT_COUNT - 1));
    const variance =
      (3 * p.q * p.q) / (tau * tau) +
      (p.n * p.n) / tau +
      (2 * Math.LN2 * p.b * p.b) / Math.PI +
      (p.k * p.k * tau) / 3 +
      (p.r * p.r * tau * tau) / 2;
    const sigma = Math.sqrt(variance) * (1 + rng.float(-0.03, 0.03));
    points.push({ tau, sigma: sigma * 3600 });
  }
  return points;
}

export function allanMinimum(points: AllanPoint[]): AllanPoint {
  return points.reduce((best, cur) => (cur.sigma < best.sigma ? cur : best), points[0]);
}

export function allanDerived(points: AllanPoint[]) {
  const min = allanMinimum(points);
  return {
    q: points[0] ? points[0].sigma * points[0].tau * 1000 : 0,
    n: min.sigma * Math.sqrt(min.tau) * 3600,
    b: min.sigma,
    k: min.sigma / Math.sqrt(min.tau) * 3600,
    r: min.sigma,
  };
}

export function slopeBands(points: AllanPoint[]) {
  const n = points.length;
  return [
    { label: '−1（量化噪声）', from: 0, to: Math.floor(n * 0.18) },
    { label: '−1/2（角度随机游走）', from: Math.floor(n * 0.18), to: Math.floor(n * 0.45) },
    { label: '0（零偏不稳定性）', from: Math.floor(n * 0.45), to: Math.floor(n * 0.62) },
    { label: '+1/2（速率随机游走）', from: Math.floor(n * 0.62), to: Math.floor(n * 0.82) },
    { label: '+1（速率斜坡）', from: Math.floor(n * 0.82), to: n - 1 },
  ].map((band) => ({
    ...band,
    x0: points[band.from].tau,
    x1: points[Math.min(band.to, n - 1)].tau,
  }));
}
