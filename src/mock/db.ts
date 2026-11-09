import type {
  Annotation, Badcase, KnowledgeItem, LogRecord, MetricPoint, Notice, Session, TodoItem, User,
} from '@/types';
import {
  genBadcases, genKnowledge, genLogs, genMetrics, genNotices, genSessions, genTodos, genUsers,
} from './generators';

export interface DB {
  users: User[];
  sessions: Session[];
  knowledge: KnowledgeItem[];
  logs: LogRecord[];
  metrics: MetricPoint[];
  todos: TodoItem[];
  notices: Notice[];
  badcases: Badcase[];
  annotations: Annotation[];
  params: {
    sessionTimeout: number;
    fallbackText: string;
    sensitiveWords: string[];
    transferThreshold: number;
  };
}

const DB_KEY = 'iiup_db_v1';

function generate(): DB {
  const sessions = genSessions();
  return {
    users: genUsers(),
    sessions,
    knowledge: genKnowledge(),
    logs: genLogs(),
    metrics: genMetrics(),
    todos: genTodos(),
    notices: genNotices(),
    badcases: genBadcases(sessions),
    annotations: [],
    params: {
      sessionTimeout: 30,
      fallbackText: '抱歉，这个问题我暂时没有学习到，已为您记录并转人工处理。',
      sensitiveWords: ['诈骗', '博彩', '违禁品', '洗钱', '暴力催收'],
      transferThreshold: 60,
    },
  };
}

let cache: DB | null = null;

export function loadDB(): DB {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      cache = JSON.parse(raw) as DB;
      return cache;
    }
  } catch {
    /* ignore */
  }
  cache = generate();
  saveDB();
  return cache;
}

export function saveDB(): void {
  if (cache) localStorage.setItem(DB_KEY, JSON.stringify(cache));
}

export function mutate<T>(fn: (db: DB) => T): T {
  const db = loadDB();
  const result = fn(db);
  saveDB();
  return result;
}

export function resetDB(): void {
  localStorage.removeItem(DB_KEY);
  cache = null;
}
