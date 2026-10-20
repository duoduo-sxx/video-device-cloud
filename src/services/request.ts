import type { ApiResponse, PageResult, QueryParams } from '@/types/api';

const isDev = import.meta.env.DEV;

function traceId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export interface MockOptions {
  delay?: [number, number];
  failRate?: number;
}

let slowNetwork = false;

export function setSlowNetwork(v: boolean) {
  slowNetwork = v;
}

export function isSlowNetwork() {
  return slowNetwork;
}

export function mockRequest<T>(resolver: () => T, options: MockOptions = {}): Promise<ApiResponse<T>> {
  const [min, max] = options.delay ?? [180, 520];
  const base = Math.round(min + Math.random() * (max - min));
  const delay = slowNetwork ? base * 4 : base;

  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (options.failRate && Math.random() < options.failRate) {
        reject(new Error('服务暂时不可用，请稍后重试'));
        return;
      }
      try {
        const data = resolver();
        resolve({ code: 0, message: 'ok', data, traceId: traceId() });
      } catch (e) {
        if (isDev) {
          // eslint-disable-next-line no-console
          console.error('[mock] resolver error', e);
        }
        reject(e instanceof Error ? e : new Error('数据加载失败'));
      }
    }, delay);
  });
}

export function paginate<T>(list: T[], params: QueryParams = {}): PageResult<T> {
  const page = Number(params.page ?? 1);
  const pageSize = Number(params.pageSize ?? 20);
  const start = (page - 1) * pageSize;
  return {
    list: list.slice(start, start + pageSize),
    total: list.length,
    page,
    pageSize,
  };
}

export function sortBy<T>(list: T[], key: keyof T | string, order: 'asc' | 'desc' = 'desc'): T[] {
  return [...list].sort((a, b) => {
    const av = a[key as keyof T];
    const bv = b[key as keyof T];
    if (typeof av === 'number' && typeof bv === 'number') {
      return order === 'asc' ? av - bv : bv - av;
    }
    const as = String(av ?? '');
    const bs = String(bv ?? '');
    return order === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as);
  });
}

export function matchKeyword(value: unknown, keyword?: string): boolean {
  if (!keyword) return true;
  return String(value ?? '')
    .toLowerCase()
    .includes(keyword.toLowerCase());
}
