import type { MediaAsset, SubtitleTrack, ReviewFinding } from '@/types';
import { ASSETS } from './seed/assets';
import { REVIEW_FINDINGS } from './seed/misc';

const OVERRIDE_KEY = 'mf:subtitle-overrides';
const ASSET_PATCH_KEY = 'mf:asset-patches';
const FINDING_KEY = 'mf:finding-patches';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 忽略配额异常 */
  }
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

let assetCache: MediaAsset[] | null = null;

export function getAssets(): MediaAsset[] {
  if (assetCache) return assetCache;
  const overrides = readJson<Record<string, SubtitleTrack[]>>(OVERRIDE_KEY, {});
  const patches = readJson<Record<string, Partial<MediaAsset>>>(ASSET_PATCH_KEY, {});
  assetCache = ASSETS.map((a) => {
    const next = clone(a);
    if (overrides[a.id]) next.subtitleTracks = overrides[a.id];
    if (patches[a.id]) Object.assign(next, patches[a.id]);
    return next;
  });
  return assetCache;
}

export function getAsset(id: string): MediaAsset | undefined {
  return getAssets().find((a) => a.id === id);
}

export function saveSubtitleTrack(assetId: string, track: SubtitleTrack) {
  const asset = getAsset(assetId);
  if (!asset) return;
  const updated = asset.subtitleTracks.some((t) => t.id === track.id)
    ? asset.subtitleTracks.map((t) => (t.id === track.id ? track : t))
    : [...asset.subtitleTracks, track];
  asset.subtitleTracks = updated;
  const overrides = readJson<Record<string, SubtitleTrack[]>>(OVERRIDE_KEY, {});
  overrides[assetId] = updated;
  writeJson(OVERRIDE_KEY, overrides);
}

export function patchAsset(assetId: string, patch: Partial<MediaAsset>) {
  const asset = getAsset(assetId);
  if (!asset) return;
  Object.assign(asset, patch);
  const patches = readJson<Record<string, Partial<MediaAsset>>>(ASSET_PATCH_KEY, {});
  patches[assetId] = { ...(patches[assetId] || {}), ...patch };
  writeJson(ASSET_PATCH_KEY, patches);
}

let findingCache: ReviewFinding[] | null = null;

export function getFindings(): ReviewFinding[] {
  if (findingCache) return findingCache;
  const patches = readJson<Record<string, Partial<ReviewFinding>>>(FINDING_KEY, {});
  findingCache = REVIEW_FINDINGS.map((f) => ({ ...f, ...(patches[f.id] || {}) }));
  return findingCache;
}

export function patchFinding(id: string, patch: Partial<ReviewFinding>) {
  const list = getFindings();
  const item = list.find((f) => f.id === id);
  if (!item) return;
  Object.assign(item, patch);
  const patches = readJson<Record<string, Partial<ReviewFinding>>>(FINDING_KEY, {});
  patches[id] = { ...(patches[id] || {}), ...patch };
  writeJson(FINDING_KEY, patches);
}

export function resetDemoData() {
  localStorage.removeItem(OVERRIDE_KEY);
  localStorage.removeItem(ASSET_PATCH_KEY);
  localStorage.removeItem(FINDING_KEY);
  assetCache = null;
  findingCache = null;
}

/** 汇总：用于多处数据对账 */
export function summary() {
  const assets = getAssets();
  const totalBytes = assets.reduce((s, a) => s + a.sizeBytes, 0);
  return {
    totalAssets: assets.length,
    totalBytes,
    withSubtitle: assets.filter((a) => a.subtitleTracks.length > 0).length,
    reviewed: assets.filter((a) => (a.reviewScore ?? 0) > 0).length,
    pendingReview: assets.filter((a) => a.status === 'pending_review').length,
  };
}
