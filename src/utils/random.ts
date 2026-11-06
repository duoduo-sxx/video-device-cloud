export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Rng {
  private next: () => number;

  constructor(seed = 20261019) {
    this.next = mulberry32(seed);
  }

  float(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  int(min: number, max: number): number {
    return Math.floor(this.float(min, max + 1));
  }

  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  picks<T>(arr: T[], count: number): T[] {
    const copy = [...arr];
    const out: T[] = [];
    for (let i = 0; i < count && copy.length; i += 1) {
      out.push(copy.splice(Math.floor(this.next() * copy.length), 1)[0]);
    }
    return out;
  }

  bool(p = 0.5): boolean {
    return this.next() < p;
  }

  gauss(mean = 0, sigma = 1): number {
    const u1 = Math.max(this.next(), 1e-9);
    const u2 = this.next();
    return mean + sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
}

export const rng = new Rng(20261019);
