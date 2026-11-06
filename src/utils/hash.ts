/** 确定性伪随机哈希生成：相同 seed 永远得到相同结果 */
function xmur3(str: string) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

export function hexHash(seed: string, bytes = 32): string {
  const rand = xmur3(seed);
  let out = '';
  for (let i = 0; i < bytes; i += 4) {
    out += rand().toString(16).padStart(8, '0');
  }
  return `0x${out.slice(0, bytes * 2)}`;
}

export function addressOf(seed: string): string {
  return `0x${hexHash(seed, 20).slice(2)}`;
}

export function didOf(seed: string): string {
  return `did:xh:${addressOf(seed)}`;
}

/** 真实文件哈希（浏览器支持 crypto.subtle 时使用 SHA-256） */
export async function fileHash(file: File): Promise<string> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const buf = await file.arrayBuffer();
      const digest = await crypto.subtle.digest('SHA-256', buf);
      return (
        '0x' +
        Array.from(new Uint8Array(digest))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
      );
    }
  } catch {
    /* 忽略，走降级 */
  }
  const fake = `${file.name}-${file.size}-${file.lastModified}`;
  return hexHash(fake);
}

export function textHash(text: string): string {
  return hexHash(text || 'empty');
}
