import dayjs from 'dayjs';
import type { Alert, AlertLevel, AlertRule, AlertStatus, AuditLog, SensitiveHit } from '../types';
import { CHANNELS, NODES, USERS } from './base';

const ALERT_LEVELS: AlertLevel[] = ['critical', 'warning', 'warning', 'info', 'info', 'warning'];
const ALERT_STATUS: AlertStatus[] = ['pending', 'pending', 'processing', 'pending', 'resolved', 'pending'];

const ALERT_TEMPLATES = [
  { title: '通道丢包率持续高于阈值', metric: 'packetLoss', value: '2.1%', threshold: '> 1.0% 持续 5 分钟' },
  { title: '节点磁盘使用率接近上限', metric: 'diskUsage', value: '92.4%', threshold: '> 85%' },
  { title: '传输任务连续失败', metric: 'taskFailure', value: '3 次', threshold: '5 分钟内 ≥ 3 次' },
  { title: '通道带宽水位过高', metric: 'bandwidth', value: '94.8%', threshold: '> 90% 持续 10 分钟' },
  { title: '节点心跳超时', metric: 'heartbeat', value: '428 分钟', threshold: '> 5 分钟无心跳' },
  { title: '跨境链路延迟抖动', metric: 'latency', value: '186 ms', threshold: '> 150 ms' },
  { title: '传输校验失败率上升', metric: 'checksumFail', value: '0.8%', threshold: '> 0.3%' },
  { title: '敏感数据外发拦截', metric: 'sensitiveEgress', value: '2 次', threshold: '≥ 1 次' },
];

function buildAlerts(): Alert[] {
  const list: Alert[] = [];
  for (let i = 0; i < 30; i += 1) {
    const tpl = ALERT_TEMPLATES[i % ALERT_TEMPLATES.length];
    const channel = CHANNELS[i % CHANNELS.length];
    const node = NODES[i % NODES.length];
    const status = i === 0 ? 'pending' : ALERT_STATUS[i % ALERT_STATUS.length];
    const level = i === 0 ? 'critical' : ALERT_LEVELS[i % ALERT_LEVELS.length];
    const triggeredAt = dayjs().subtract(i * 47 + 8, 'minute');
    list.push({
      id: `AL-${triggeredAt.format('YYYYMMDD')}-${String(100 + i)}`,
      level,
      title: tpl.title,
      target: i % 2 === 0 ? `${channel.id} ${channel.name}` : `${node.name} (${node.region})`,
      metric: tpl.metric,
      value: tpl.value,
      threshold: tpl.threshold,
      status,
      triggeredAt: triggeredAt.toISOString(),
      durationMin: i * 47 + 8,
      assignee: status === 'pending' ? undefined : USERS[(i % 4) + 1],
      ruleId: `RULE-0${(i % 6) + 1}`,
      description:
        status === 'resolved'
          ? '指标已回落至阈值以下，系统自动关闭该告警。'
          : `监控系统检测到 ${i % 2 === 0 ? '通道' : '节点'} 指标异常，已持续 ${i * 47 + 8} 分钟，建议尽快排查。`,
    });
  }
  return list;
}

export const ALERTS: Alert[] = buildAlerts();

export const ALERT_RULES: AlertRule[] = [
  { id: 'RULE-01', name: '通道丢包率告警', metric: 'packetLoss', operator: '>', threshold: '1.0%', duration: '持续 5 分钟', level: 'warning', channels: ['站内信', '邮件'], enabled: true },
  { id: 'RULE-02', name: '节点磁盘使用率告警', metric: 'diskUsage', operator: '>', threshold: '85%', duration: '持续 10 分钟', level: 'critical', channels: ['站内信', '邮件', 'Webhook'], enabled: true },
  { id: 'RULE-03', name: '任务连续失败告警', metric: 'taskFailure', operator: '>=', threshold: '3 次', duration: '5 分钟内', level: 'critical', channels: ['站内信', 'Webhook'], enabled: true },
  { id: 'RULE-04', name: '通道带宽水位告警', metric: 'bandwidth', operator: '>', threshold: '90%', duration: '持续 10 分钟', level: 'warning', channels: ['站内信'], enabled: true },
  { id: 'RULE-05', name: '节点心跳超时', metric: 'heartbeat', operator: '>', threshold: '5 分钟', duration: '立即触发', level: 'critical', channels: ['站内信', '邮件', 'Webhook'], enabled: true },
  { id: 'RULE-06', name: '跨境链路延迟告警', metric: 'latency', operator: '>', threshold: '150 ms', duration: '持续 15 分钟', level: 'warning', channels: ['邮件'], enabled: false },
];

const AUDIT_ACTIONS = [
  { action: '创建传输任务', object: 'TSK-20261019-1021', key: 'task' },
  { action: '暂停传输任务', object: 'TSK-20261018-1014', key: 'task' },
  { action: '修改通道带宽', object: 'CH-04 法兰克福 ↔ 华东1 跨境', key: 'channel' },
  { action: '删除优化策略', object: 'PL-09 临时测试策略', key: 'policy' },
  { action: '登录系统', object: 'Web 控制台', key: 'session' },
  { action: '导出成本报表', object: '2026-09 月度报表', key: 'report' },
  { action: '更新用户角色', object: 'U-008 王砚', key: 'user' },
  { action: '轮换加密密钥', object: 'KEY-2026-09', key: 'key' },
  { action: '下载数据集', object: 'DS-0101 订单事实表', key: 'dataset' },
  { action: '修改访问白名单', object: '安全合规 / 访问控制', key: 'access' },
];

function detailOf(key: string, i: number): AuditLog['detail'] {
  switch (key) {
    case 'task':
      return { before: { status: 'running', priority: 'medium' }, after: { status: 'paused', priority: 'medium' } };
    case 'channel':
      return { before: { bandwidthMbps: 200, qos: 'low' }, after: { bandwidthMbps: 300 + i, qos: 'normal' } };
    case 'policy':
      return { before: { name: '临时测试策略', dedup: 'none' }, after: { deleted: true } };
    case 'user':
      return { before: { role: 'member', status: '正常' }, after: { role: 'ops', status: '已禁用' } };
    case 'access':
      return { before: { ipWhitelist: '10.12.0.0/16' }, after: { ipWhitelist: '10.12.0.0/16, 10.30.0.0/16' } };
    default:
      return { before: { result: 'n/a' }, after: { result: 'ok' } };
  }
}

function buildAudit(): AuditLog[] {
  return Array.from({ length: 80 }).map((_, i) => {
    const entry = AUDIT_ACTIONS[i % AUDIT_ACTIONS.length];
    const time = dayjs().subtract(i * 37 + 5, 'minute');
    return {
      id: `LOG-${time.format('YYYYMMDD')}-${String(2000 + i)}`,
      time: time.toISOString(),
      user: USERS[(i * 5) % USERS.length],
      action: entry.action,
      object: entry.object,
      ip: `10.${12 + (i % 4)}.${(i * 7) % 255}.${(i * 13) % 255}`,
      result: i % 17 === 0 ? 'failed' : 'success',
      detail: detailOf(entry.key, i),
    };
  });
}

export const AUDIT_LOGS: AuditLog[] = buildAudit();

const SENSITIVE_RULES = [
  { rule: '身份证号', level: 'high' as const, sample: '310***********1234' },
  { rule: '手机号', level: 'medium' as const, sample: '138****6721' },
  { rule: '银行卡号', level: 'high' as const, sample: '6222 **** **** 9031' },
  { rule: '邮箱地址', level: 'low' as const, sample: 'z***@xinglan-tech.com' },
  { rule: '地址信息', level: 'medium' as const, sample: '杭州市余杭区****路 ** 号' },
  { rule: '病历号', level: 'high' as const, sample: 'MR-2026-****-88' },
];

const DATASOURCES = ['生产订单库', '用户中心库', '影像归档桶', '客服录音桶', '财务凭证库', '风控事件流'];

export const SENSITIVE_HITS: SensitiveHit[] = Array.from({ length: 24 }).map((_, i) => {
  const r = SENSITIVE_RULES[i % SENSITIVE_RULES.length];
  return {
    id: `SH-${String(3001 + i)}`,
    datasource: DATASOURCES[i % DATASOURCES.length],
    path: `/data/${['orders', 'users', 'images', 'calls', 'finance', 'risk'][i % 6]}/partition_${2026}${String((i % 12) + 1).padStart(2, '0')}/`,
    rule: r.rule,
    level: r.level,
    sample: r.sample,
    scannedAt: dayjs().subtract(i * 3 + 1, 'hour').toISOString(),
    status: i % 7 === 0 ? '已处置' : i % 11 === 0 ? '已忽略' : '待处理',
  };
});
