import dayjs from 'dayjs';
import type { ApiKey } from '../types';

export const API_KEYS: ApiKey[] = [
  { id: 'KEY-01', name: '数据同步服务', prefix: 'sk-live-a1b2', scope: '任务读写 / 通道只读', createdAt: dayjs().subtract(210, 'day').toISOString(), lastUsedAt: dayjs().subtract(2, 'minute').toISOString(), status: '启用' },
  { id: 'KEY-02', name: 'BI 报表拉取', prefix: 'sk-live-c3d4', scope: '报表只读', createdAt: dayjs().subtract(160, 'day').toISOString(), lastUsedAt: dayjs().subtract(6, 'hour').toISOString(), status: '启用' },
  { id: 'KEY-03', name: '外部合作伙伴集成', prefix: 'sk-live-e5f6', scope: '指定空间只读', createdAt: dayjs().subtract(92, 'day').toISOString(), lastUsedAt: dayjs().subtract(3, 'day').toISOString(), status: '启用' },
  { id: 'KEY-04', name: '旧版采集器', prefix: 'sk-live-g7h8', scope: '任务写入', createdAt: dayjs().subtract(320, 'day').toISOString(), lastUsedAt: dayjs().subtract(64, 'day').toISOString(), status: '已吊销' },
  { id: 'KEY-05', name: '监控告警回调', prefix: 'sk-live-i9j0', scope: '告警只读', createdAt: dayjs().subtract(45, 'day').toISOString(), lastUsedAt: dayjs().subtract(28, 'minute').toISOString(), status: '启用' },
];
