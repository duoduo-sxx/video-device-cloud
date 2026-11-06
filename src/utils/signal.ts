import { Rng } from './random';

export interface Telemetry {
  t: number[];
  gx: number[];
  gy: number[];
  gz: number[];
  ax: number[];
  ay: number[];
  az: number[];
  temp: number[];
}

export interface TelemetryOptions {
  seed?: number;
  count?: number;
  seconds?: number;
  sampleRate?: number;
  gxBias?: number;
  gyBias?: number;
  gzBias?: number;
  noise?: number;
  amplitude?: number;
}

export function generateTelemetry(options: TelemetryOptions = {}): Telemetry {
  const {
    seed = 20261019,
    count = 600,
    seconds = 60,
    sampleRate = 200,
    gxBias = 0.0021,
    gyBias = -0.0014,
    gzBias = 0.0032,
    noise = 0.012,
    amplitude = 0.05,
  } = options;
  const rng = new Rng(seed);
  const t: number[] = [];
  const gx: number[] = [];
  const gy: number[] = [];
  const gz: number[] = [];
  const ax: number[] = [];
  const ay: number[] = [];
  const az: number[] = [];
  const temp: number[] = [];

  let walkX = 0;
  let walkY = 0;
  let walkZ = 0;
  let markov = 0;
  const dt = seconds / count;

  for (let i = 0; i < count; i += 1) {
    const time = (i / count) * seconds;
    markov = markov * Math.exp(-dt / 120) + rng.gauss(0, noise * 0.22);
    walkX += rng.gauss(0, noise * 0.02);
    walkY += rng.gauss(0, noise * 0.018);
    walkZ += rng.gauss(0, noise * 0.022);
    const drift = amplitude * Math.sin((2 * Math.PI * time) / 1800) + 0.012 * Math.sin((2 * Math.PI * time) / 47);

    gx.push(gxBias + drift + markov + walkX + rng.gauss(0, noise));
    gy.push(gyBias + drift * 0.72 + markov * 0.08 + walkY + rng.gauss(0, noise));
    gz.push(gzBias + drift * 0.41 + markov * -0.06 + walkZ + rng.gauss(0, noise));

    ax.push(0.0042 + rng.gauss(0, 0.0016) + walkX * 0.004);
    ay.push(-0.0031 + rng.gauss(0, 0.0015) + walkY * 0.004);
    az.push(1 + 0.0018 + rng.gauss(0, 0.0014) + walkZ * 0.003);

    temp.push(23.4 + 0.8 * Math.sin((2 * Math.PI * time) / 2400) + rng.gauss(0, 0.02));
    t.push(Number(time.toFixed(2)));
    void sampleRate;
  }

  return { t, gx, gy, gz, ax, ay, az, temp };
}

export function generateSpectrum(seed = 20261019): { freq: number[]; amp: number[] } {
  const rng = new Rng(seed);
  const freq: number[] = [];
  const amp: number[] = [];
  for (let f = 0.5; f <= 100; f += 0.5) {
    const base = 0.004 / Math.sqrt(f);
    const peaks =
      0.06 * Math.exp(-((f - 12.5) ** 2) / 0.4) +
      0.035 * Math.exp(-((f - 25) ** 2) / 0.6) +
      0.02 * Math.exp(-((f - 50) ** 2) / 0.9);
    freq.push(Number(f.toFixed(1)));
    amp.push(Number((base + peaks + rng.float(0, 0.002)).toFixed(5)));
  }
  return { freq, amp };
}

export interface TrajectoryPoint {
  t: number;
  lat: number;
  lon: number;
  alt: number;
  roll: number;
  pitch: number;
  yaw: number;
  vN: number;
  vE: number;
  vD: number;
  north: number;
  east: number;
}

export function generateTrajectory(seed = 20261019, count = 900): TrajectoryPoint[] {
  const rng = new Rng(seed);
  const points: TrajectoryPoint[] = [];
  let north = 0;
  let east = 0;
  let alt = 42;
  let yaw = 36;
  let speed = 0;
  let roll = 0;
  let pitch = 0;
  let t = 0;
  const dt = 0.1;

  for (let i = 0; i < count; i += 1) {
    t += dt;
    if (i < 120) {
      speed = 0;
    } else if (i < 300) {
      speed = Math.min(18, speed + 0.12);
      pitch = 2.4 * Math.sin(i / 26);
    } else if (i < 620) {
      speed = 18 + 2.2 * Math.sin(i / 90);
      yaw += 0.16 + 0.05 * Math.sin(i / 40);
      roll = 12 * Math.sin(i / 34);
    } else if (i < 780) {
      speed = Math.max(0, speed - 0.1);
      pitch = -1.8;
      roll *= 0.96;
    } else {
      speed = 0;
      pitch *= 0.92;
      roll *= 0.92;
    }
    yaw += rng.gauss(0, 0.02);
    north += speed * Math.cos((yaw * Math.PI) / 180) * dt;
    east += speed * Math.sin((yaw * Math.PI) / 180) * dt;
    alt += Math.sin(i / 70) * 0.02 * (speed / 18);

    points.push({
      t: Number(t.toFixed(1)),
      lat: 39.9042 + north / 111320,
      lon: 116.4074 + east / (111320 * Math.cos((39.9 * Math.PI) / 180)),
      alt: Number(alt.toFixed(1)),
      roll: Number((roll + rng.gauss(0, 0.08)).toFixed(2)),
      pitch: Number((pitch + rng.gauss(0, 0.06)).toFixed(2)),
      yaw: Number((((yaw % 360) + 360) % 360).toFixed(2)),
      vN: Number((speed * Math.cos((yaw * Math.PI) / 180)).toFixed(2)),
      vE: Number((speed * Math.sin((yaw * Math.PI) / 180)).toFixed(2)),
      vD: Number((Math.sin(i / 70) * 0.04).toFixed(2)),
      north: Number(north.toFixed(1)),
      east: Number(east.toFixed(1)),
    });
  }
  return points;
}
