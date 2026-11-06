import type { ReviewFinding, UsageRecord, ApiCallLog, AuditLog } from '@/types';
import { ASSETS } from './assets';
import { USERS } from './people';
import { hashString, mulberry32, clamp } from '@/utils/format';

const DIMENSIONS: { key: ReviewFinding['dimension']; name: string; snippets: string[]; advice: string }[] = [
  { key: 'porn', name: '涉黄', snippets: ['画面出现大面积裸露皮肤，置信度较高', '疑似低俗着装，需人工复核'], advice: '建议打码或删除该片段' },
  { key: 'violence', name: '暴力画面', snippets: ['出现打斗与流血画面', '道具刀具有挥砍动作'], advice: '建议删除片段 02:14–02:19' },
  { key: 'politics', name: '涉政', snippets: ['背景出现不当标识', '字幕包含敏感表述'], advice: '建议删除并回溯同批次素材' },
  { key: 'terror', name: '暴恐', snippets: ['疑似管制器械特写', '出现极端组织旗帜图案'], advice: '建议直接删除并上报' },
  { key: 'sensitive_word', name: '敏感词', snippets: ['语音中出现"最低价""绝对有效"等违禁词', '字幕含绝对化用语'], advice: '建议替换为合规表述' },
  { key: 'logo', name: '第三方 Logo', snippets: ['画面右下角出现竞品 Logo', '背景出现未授权品牌标识'], advice: '建议打码或去水印' },
];

export const REVIEW_FINDINGS: ReviewFinding[] = (() => {
  const list: ReviewFinding[] = [];
  const videos = ASSETS.filter((a) => a.type === 'video');
  for (let i = 0; i < 46; i++) {
    const rnd = mulberry32(hashString(`rv-${i}`));
    const asset = videos[i % videos.length];
    const dim = DIMENSIONS[i % DIMENSIONS.length];
    const maxStart = Math.max(6, asset.duration - 30);
    const start = Math.round(rnd() * maxStart);
    const level: ReviewFinding['level'] = rnd() > 0.72 ? 'high' : rnd() > 0.4 ? 'medium' : 'low';
    list.push({
      id: `rf_${String(i + 1).padStart(3, '0')}`,
      assetId: asset.id,
      start,
      end: start + 4 + Math.round(rnd() * 14),
      dimension: dim.key,
      level,
      confidence: Number((0.62 + rnd() * 0.36).toFixed(3)),
      snippet: dim.snippets[Math.floor(rnd() * dim.snippets.length)],
      suggestion: dim.advice,
      handled: i % 5 === 0,
      action: i % 5 === 0 ? (['pass', 'delete', 'mask', 'whitelist'] as const)[i % 4] : undefined,
    });
  }
  return list;
})();

const USAGE_PRICE: { cap: UsageRecord['capability']; price: number; unit: string; base: number }[] = [
  { cap: 'cap_asr', price: 0.35, unit: '分钟', base: 640 },
  { cap: 'cap_subtitle', price: 0.2, unit: '分钟', base: 420 },
  { cap: 'cap_translate', price: 0.8, unit: '分钟', base: 180 },
  { cap: 'cap_review', price: 0.3, unit: '分钟', base: 260 },
  { cap: 'cap_enhance', price: 2.4, unit: '分钟', base: 96 },
  { cap: 'cap_tts', price: 1.2, unit: '千字', base: 62 },
];

export const USAGE_RECORDS: UsageRecord[] = (() => {
  const rows: UsageRecord[] = [];
  const today = new Date();
  for (let d = 0; d < 90; d++) {
    const day = new Date(today.getTime() - d * 86400_000);
    const date = day.toISOString().slice(0, 10);
    USAGE_PRICE.forEach((u, k) => {
      const rnd = mulberry32(hashString(`${date}-${u.cap}`));
      const weekday = day.getDay();
      const factor = weekday === 0 || weekday === 6 ? 0.55 : 1;
      const amount = Math.round(u.base * factor * (0.62 + rnd() * 0.82));
      const task = ASSETS[(d + k) % ASSETS.length];
      rows.push({
        id: `us_${date}_${k}`,
        date,
        capability: u.cap,
        amount,
        unit: u.unit,
        price: u.price,
        taskId: `tsk_${date.replace(/-/g, '')}_${(hashString(date + k) % 0xffff).toString(16).padStart(4, '0')}`,
      });
      void task;
    });
  }
  return rows;
})();

export const API_CALL_LOGS: ApiCallLog[] = (() => {
  const list: ApiCallLog[] = [];
  const endpoints = ['POST /v1/asr/transcribe', 'POST /v1/subtitle/generate', 'POST /v1/review/scan', 'GET /v1/tasks/{id}', 'POST /v1/translate/subtitle', 'POST /v1/enhance/video'];
  for (let i = 0; i < 326; i++) {
    const rnd = mulberry32(hashString(`api-${i}`));
    const roll = rnd();
    const status = roll > 0.94 ? 500 : roll > 0.9 ? 429 : roll > 0.87 ? 401 : 200;
    list.push({
      id: `call_${i}`,
      time: new Date(Date.now() - i * 12 * 60_000).toISOString(),
      endpoint: endpoints[i % endpoints.length],
      status,
      ms: status === 200 ? Math.round(120 + rnd() * 2400) : Math.round(30 + rnd() * 200),
      requestId: `req_${hashString(`r-${i}`).toString(16).padStart(8, '0')}`,
      ip: `10.24.${8 + (i % 6)}.${20 + (i % 180)}`,
    });
  }
  return list;
})();

const AUDIT_ACTIONS = ['创建任务', '修改字幕', '删除素材', '导出字幕', '创建 API Key', '更新流水线', '邀请成员', '登录', '修改配额', '吊销 Key'];

export const AUDIT_LOGS: AuditLog[] = Array.from({ length: 132 }, (_, i) => {
  const rnd = mulberry32(hashString(`audit-${i}`));
  const user = USERS[i % USERS.length];
  const action = AUDIT_ACTIONS[i % AUDIT_ACTIONS.length];
  return {
    id: `log_${String(i + 1).padStart(4, '0')}`,
    time: new Date(Date.now() - i * 2.6 * 3600_000).toISOString(),
    userId: user.id,
    action,
    objectType: action.includes('字幕') ? '字幕轨' : action.includes('Key') ? 'API Key' : action.includes('成员') ? '成员' : action.includes('流水线') ? '流水线' : '媒体资产',
    objectName: action.includes('字幕')
      ? '发布会主会场 中文 v3'
      : action.includes('素材')
        ? ASSETS[i % ASSETS.length].title
        : action.includes('Key')
          ? '内容中台-生产'
          : action.includes('流水线')
            ? '发布会多语分发'
            : action.includes('成员')
              ? user.name
              : ASSETS[(i + 3) % ASSETS.length].title,
    ip: `10.24.${8 + (i % 6)}.${20 + (i % 180)}`,
    result: rnd() > 0.93 ? 'failed' : 'success',
    before: { 状态: '待处理', 版本: 2 },
    after: { 状态: '已完成', 版本: 3 },
  } as AuditLog;
});

export const TODAY_HOURS = Array.from({ length: 14 }, (_, i) => {
  const rnd = mulberry32(hashString(`trend-${i}`));
  const d = new Date(Date.now() - (13 - i) * 86400_000);
  return {
    date: `${d.getMonth() + 1}/${d.getDate()}`,
    hours: Math.round(820 + rnd() * 620),
    tasks: Math.round(180 + rnd() * 160),
  };
});

export const CAP_DISTRIBUTION = [
  { name: '转写', value: 32, color: '#5B6CFF' },
  { name: '字幕', value: 21, color: '#22D3EE' },
  { name: '剪辑', value: 15, color: '#A78BFA' },
  { name: '增强', value: 11, color: '#34D399' },
  { name: '审核', value: 9, color: '#FBBF24' },
  { name: '其他', value: 12, color: '#64748B' },
];

export const GPU_NODES = [
  { id: 'GPU-01', task: '4x 超分 - 校园宣传片', progress: 68, util: 92, eta: '6 分 12 秒', mem: '18.4 / 24 GB' },
  { id: 'GPU-02', task: '转写 - 季度全员会', progress: 41, util: 78, eta: '12 分 40 秒', mem: '9.2 / 24 GB' },
  { id: 'GPU-03', task: '审核 - 夏日防晒测评', progress: 23, util: 64, eta: '3 分 02 秒', mem: '6.8 / 24 GB' },
  { id: 'GPU-04', task: '空闲', progress: 0, util: 4, eta: '—', mem: '0.6 / 24 GB' },
];

export const REVIEW_QUEUE_IDS = ['ast_0012', 'ast_0057', 'ast_0022'];
