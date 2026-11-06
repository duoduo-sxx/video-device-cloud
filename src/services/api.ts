/** Mock 服务层：全部为本地异步函数，不产生任何真实网络请求 */
export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export interface ConnectionResult {
  ok: boolean;
  rttMs: number;
  message: string;
}

export const testConnection = async (endpoint: string): Promise<ConnectionResult> => {
  await sleep(900 + Math.random() * 500);
  if (endpoint.includes('error')) {
    return { ok: false, rttMs: 0, message: '连接超时，请检查凭证与白名单配置' };
  }
  return { ok: true, rttMs: Math.round(8 + Math.random() * 42), message: '连通正常' };
};

export const probeLinks = async (count: number): Promise<number> => {
  await sleep(1200);
  return count;
};

export const testConnector = async (name: string): Promise<{ ok: boolean; message: string }> => {
  await sleep(1200);
  if (name.includes('MinIO')) return { ok: false, message: '凭证校验失败（Access Key 无效）' };
  return { ok: true, message: '连接成功，握手耗时 42ms' };
};
