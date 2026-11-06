import { Tag } from 'antd';
import type { TaskStatus } from '../types';
import { TASK_STATUS_META } from '../mock/tasks';

export default function StatusTag({ status }: { status: TaskStatus }) {
  const meta = TASK_STATUS_META[status];
  return (
    <Tag
      style={{
        color: meta.badge,
        background: `${meta.badge}14`,
        borderColor: `${meta.badge}33`,
        marginInlineEnd: 0,
        fontWeight: 500,
      }}
    >
      {meta.label}
    </Tag>
  );
}

const LEVEL_META: Record<string, { label: string; color: string }> = {
  critical: { label: '严重', color: '#EF4444' },
  warning: { label: '警告', color: '#F59E0B' },
  info: { label: '提示', color: '#1668FF' },
  high: { label: '高危', color: '#EF4444' },
  medium: { label: '中危', color: '#F59E0B' },
  low: { label: '低危', color: '#0EA5E9' },
};

export function LevelTag({ level }: { level: string }) {
  const meta = LEVEL_META[level] ?? { label: level, color: '#8A99B0' };
  return (
    <Tag style={{ color: meta.color, background: `${meta.color}14`, borderColor: `${meta.color}33`, marginInlineEnd: 0 }}>
      {meta.label}
    </Tag>
  );
}

const PROTOCOL_COLORS: Record<string, string> = {
  S3: '#1668FF',
  OSS: '#F59E0B',
  SFTP: '#7C5CFF',
  HTTP: '#0EA5E9',
  Kafka: '#00B894',
  HDFS: '#EF4444',
  NFS: '#5A6B87',
};

export function ProtocolTag({ protocol }: { protocol: string }) {
  const color = PROTOCOL_COLORS[protocol] ?? '#8A99B0';
  return (
    <Tag style={{ color, background: `${color}12`, borderColor: `${color}2A`, marginInlineEnd: 0, fontSize: 11 }}>
      {protocol}
    </Tag>
  );
}
