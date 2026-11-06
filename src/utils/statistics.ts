export function mean(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function std(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / (arr.length - 1));
}

export function rms(arr: number[]): number {
  if (!arr.length) return 0;
  return Math.sqrt(arr.reduce((a, b) => a + b * b, 0) / arr.length);
}

export function minOf(arr: number[]): number {
  return arr.reduce((a, b) => Math.min(a, b), Number.POSITIVE_INFINITY);
}

export function maxOf(arr: number[]): number {
  return arr.reduce((a, b) => Math.max(a, b), Number.NEGATIVE_INFINITY);
}

export function peakToPeak(arr: number[]): number {
  return maxOf(arr) - minOf(arr);
}

export function skewness(arr: number[]): number {
  const n = arr.length;
  if (n < 3) return 0;
  const m = mean(arr);
  const s = std(arr);
  if (s === 0) return 0;
  return (n / ((n - 1) * (n - 2))) * arr.reduce((a, b) => a + ((b - m) / s) ** 3, 0);
}

export function kurtosis(arr: number[]): number {
  const n = arr.length;
  if (n < 4) return 0;
  const m = mean(arr);
  const s = std(arr);
  if (s === 0) return 0;
  const sum = arr.reduce((a, b) => a + ((b - m) / s) ** 4, 0);
  return (n * (n + 1) * sum) / ((n - 1) * (n - 2) * (n - 3)) - (3 * (n - 1) ** 2) / ((n - 2) * (n - 3));
}

export function histogram(arr: number[], bins = 24): { x: number; count: number }[] {
  const min = minOf(arr);
  const max = maxOf(arr);
  const width = (max - min) / bins || 1;
  const counts = new Array(bins).fill(0);
  arr.forEach((v) => {
    const idx = Math.min(bins - 1, Math.floor((v - min) / width));
    counts[idx] += 1;
  });
  return counts.map((count, i) => ({ x: min + width * (i + 0.5), count }));
}

export function normalCurve(arr: number[], points = 60): { x: number; y: number }[] {
  const m = mean(arr);
  const s = std(arr) || 1;
  const min = minOf(arr);
  const max = maxOf(arr);
  return Array.from({ length: points }, (_, i) => {
    const x = min + ((max - min) * i) / (points - 1);
    const y = (1 / (s * Math.sqrt(2 * Math.PI))) * Math.exp(-((x - m) ** 2) / (2 * s * s));
    return { x, y };
  });
}

export function correlation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const ma = mean(a.slice(0, n));
  const mb = mean(b.slice(0, n));
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i += 1) {
    const x = a[i] - ma;
    const y = b[i] - mb;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  return num / Math.sqrt(da * db || 1);
}
