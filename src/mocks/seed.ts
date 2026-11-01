/**
 * 确定性伪随机：同一个种子永远产出同一序列。
 * 目的：数据「看起来随机」但每次刷新完全一致，便于流程演示与截图复核。
 */
export function rnd(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

/** 在 [min, max] 区间内取确定性值 */
export function between(seed: number, min: number, max: number): number {
  return min + rnd(seed) * (max - min);
}

/** 字符串 → 稳定数字种子 */
export function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
  return h;
}
