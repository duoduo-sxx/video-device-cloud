import type {
  AnalysisResult, ApiResult, KnowledgeItem, LogRecord, Message, MetricPoint, Notice, Session,
  TodoItem, User, RoleKey, Badcase, Annotation, Entity,
} from '@/types';
import type { DB } from '@/mock/db';
import { loadDB, mutate } from '@/mock/db';
import { analyzeText, matchReply } from '@/mock/nlp';
import { randInt, uid, pick } from '@/mock/rng';
import { formatTime } from '@/mock/generators';
import { INTENTS } from '@/mock/intents';

// 统一接口层：Promise + { code, data, message } 风格，模拟真实后端
function ok<T>(data: T): ApiResult<T> {
  return { code: 0, data, message: 'ok' };
}
const delay = <T>(data: T, ms = randInt(120, 320)): Promise<ApiResult<T>> =>
  new Promise((resolve) => setTimeout(() => resolve(ok(data)), ms));

// ---------- 认证 ----------
export async function login(account: string, _password: string, role: RoleKey): Promise<ApiResult<User>> {
  const db = loadDB();
  const existing = db.users.find((u) => u.status === 'enabled');
  const user: User = {
    id: 'u001',
    workNo: 'II1000',
    name: account || '管理员',
    role,
    dept: existing?.dept ?? '产品部',
    status: 'enabled',
    lastLogin: formatTime(new Date()),
  };
  return delay(user, 500);
}

// ---------- 工作台 ----------
export async function getMetrics(): Promise<ApiResult<MetricPoint[]>> {
  return delay(loadDB().metrics);
}
export async function getTodos(): Promise<ApiResult<TodoItem[]>> {
  return delay(loadDB().todos);
}
export async function getNotices(): Promise<ApiResult<Notice[]>> {
  return delay(loadDB().notices);
}
export async function getRecentSessions(): Promise<ApiResult<Session[]>> {
  return delay(loadDB().sessions.slice(0, 8));
}

// ---------- 对话中心 ----------
export async function listSessions(keyword = ''): Promise<ApiResult<Session[]>> {
  const kw = keyword.trim();
  const list = loadDB().sessions.filter((s) => !kw || s.title.includes(kw) || s.userName.includes(kw));
  return delay(list);
}
export async function getSession(id: string): Promise<ApiResult<Session | undefined>> {
  return delay(loadDB().sessions.find((s) => s.id === id));
}
export async function createSession(title: string, userName: string): Promise<ApiResult<Session>> {
  const now = formatTime(new Date());
  const session: Session = { id: uid('s'), title: title.slice(0, 20) || '新会话', userName, channel: 'Web', createdAt: now, updatedAt: now, messages: [] };
  return delay(mutate((db) => {
    db.sessions.unshift(session);
    return session;
  }));
}
export async function updateSession(id: string, patch: Partial<Session>): Promise<ApiResult<boolean>> {
  return delay(mutate((db) => {
    const s = db.sessions.find((x) => x.id === id);
    if (s) Object.assign(s, patch);
    return true;
  }));
}
export async function deleteSession(id: string): Promise<ApiResult<boolean>> {
  return delay(mutate((db) => {
    db.sessions = db.sessions.filter((s) => s.id !== id);
    return true;
  }));
}
export async function sendMessage(sessionId: string, text: string, userName: string): Promise<ApiResult<{ userMsg: Message; botMsg: Message }>> {
  const now = Date.now();
  const mk = (offset: number): string => formatTime(new Date(now + offset));
  const userMsg: Message = { id: uid('m'), role: 'user', content: text, time: mk(0) };
  const reply = matchReply(text);
  const botMsg: Message = {
    id: uid('m'), role: 'bot', content: reply.content, time: mk(300),
    intent: reply.intent, confidence: reply.confidence, latency: randInt(280, 1400),
    sentiment: analyzeText(text).sentiment,
  };
  mutate((db) => {
    const s = db.sessions.find((x) => x.id === sessionId);
    if (s) {
      s.messages.push(userMsg, botMsg);
      s.updatedAt = botMsg.time;
      if (s.messages.length <= 2) s.title = text.slice(0, 20);
    }
    return true;
  });
  void userName;
  return delay({ userMsg, botMsg }, 400);
}
export async function rateMessage(sessionId: string, msgId: string, feedback: 'up' | 'down'): Promise<ApiResult<boolean>> {
  return delay(mutate((db) => {
    const s = db.sessions.find((x) => x.id === sessionId);
    const m = s?.messages.find((x) => x.id === msgId);
    if (m) m.feedback = feedback;
    return true;
  }));
}

// ---------- 语义理解 ----------
export async function analyze(text: string): Promise<ApiResult<AnalysisResult>> {
  return delay(analyzeText(text), 350);
}

// ---------- 知识库 ----------
export async function listKnowledge(params: { keyword?: string; category?: string; status?: string } = {}): Promise<ApiResult<KnowledgeItem[]>> {
  const { keyword, category, status } = params;
  const list = loadDB().knowledge.filter((k) =>
    (!keyword || k.title.includes(keyword) || k.question.includes(keyword) || k.similar.some((s) => s.includes(keyword))) &&
    (!category || k.category === category) &&
    (!status || k.status === status));
  return delay(list);
}
export async function saveKnowledge(item: KnowledgeItem): Promise<ApiResult<boolean>> {
  return delay(mutate((db) => {
    const idx = db.knowledge.findIndex((k) => k.id === item.id);
    if (idx >= 0) db.knowledge[idx] = { ...item, updatedAt: formatTime(new Date()) };
    else db.knowledge.unshift({ ...item, id: uid('k'), updatedAt: formatTime(new Date()) });
    return true;
  }));
}
export async function deleteKnowledge(ids: string[]): Promise<ApiResult<boolean>> {
  return delay(mutate((db) => {
    db.knowledge = db.knowledge.filter((k) => !ids.includes(k.id));
    return true;
  }));
}
export async function toggleKnowledge(ids: string[], status: 'enabled' | 'disabled'): Promise<ApiResult<boolean>> {
  return delay(mutate((db) => {
    db.knowledge.forEach((k) => { if (ids.includes(k.id)) k.status = status; });
    return true;
  }));
}
export async function importKnowledge(count: number): Promise<ApiResult<KnowledgeItem[]>> {
  const items: KnowledgeItem[] = Array.from({ length: count }, (_, i) => {
    const intent = INTENTS[randInt(0, INTENTS.length - 1)];
    return {
      id: uid('k'), title: `${intent.name}｜批量导入${i + 1}`, category: '服务流程',
      question: intent.examples[0], similar: intent.examples.slice(1),
      answer: intent.answers[0], intentCode: intent.code, status: 'enabled',
      updatedAt: formatTime(new Date()),
    };
  });
  return delay(mutate((db) => {
    db.knowledge.unshift(...items);
    return items;
  }), 700);
}
export async function searchKnowledgeSimilar(question: string): Promise<ApiResult<{ item: KnowledgeItem; score: number; method: string }[]>> {
  const db = loadDB();
  const kw = question.trim();
  const scored = db.knowledge
    .map((item) => {
      let score = 0;
      if (item.question.includes(kw)) score += 60;
      if (kw.includes(item.question.slice(0, 4))) score += 20;
      if (item.similar.some((s) => s.includes(kw))) score += 35;
      if (item.title.includes(kw)) score += 15;
      return { item, score, method: score >= 60 ? '标准问法命中' : score >= 35 ? '相似问法命中' : '语义召回' };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((x) => ({ item: x.item, score: Math.min(98, x.score + randInt(0, 8)), method: x.method }));
  if (scored.length === 0) {
    return delay(db.knowledge.slice(0, 3).map((item) => ({ item, score: randInt(30, 55), method: '语义召回' })), 500);
  }
  return delay(scored, 500);
}

// ---------- 系统管理 ----------
export async function listUsers(): Promise<ApiResult<User[]>> {
  return delay(loadDB().users);
}
export async function saveUser(user: User): Promise<ApiResult<boolean>> {
  return delay(mutate((db) => {
    const idx = db.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) db.users[idx] = user;
    else db.users.unshift(user);
    return true;
  }));
}
export async function deleteUser(id: string): Promise<ApiResult<boolean>> {
  return delay(mutate((db) => {
    db.users = db.users.filter((u) => u.id !== id);
    return true;
  }));
}
export async function listLogs(filters: { user?: string; module?: string } = {}): Promise<ApiResult<LogRecord[]>> {
  const list = loadDB().logs.filter((l) =>
    (!filters.user || l.user === filters.user) && (!filters.module || l.module === filters.module));
  return delay(list);
}
export async function getBadcases(): Promise<ApiResult<Badcase[]>> {
  return delay(loadDB().badcases);
}
export async function updateBadcase(id: string, patch: Partial<Badcase>): Promise<ApiResult<boolean>> {
  return delay(mutate((db) => {
    const b = db.badcases.find((x) => x.id === id);
    if (b) Object.assign(b, patch);
    return true;
  }));
}
export async function saveAnnotation(a: Annotation): Promise<ApiResult<boolean>> {
  return delay(mutate((db) => {
    db.annotations.unshift(a);
    return true;
  }));
}
export async function getAnnotations(): Promise<ApiResult<Annotation[]>> {
  return delay(loadDB().annotations);
}
export async function getParams(): Promise<ApiResult<DB['params']>> {
  return delay(loadDB().params);
}
export async function saveParams(params: DB['params']): Promise<ApiResult<boolean>> {
  return delay(mutate((db) => {
    db.params = params;
    return true;
  }));
}

// ---------- 语音（全模拟） ----------
export async function ttsSynthesize(_text: string, _opts: Record<string, unknown>): Promise<ApiResult<{ duration: number; waveform: number[] }>> {
  const waveform = Array.from({ length: 80 }, () => randInt(10, 100));
  return delay({ duration: Math.max(2, Math.min(20, _text.length / 4)), waveform }, 800);
}
export interface AsrSegment { time: string; text: string; lowConfidenceWords: string[] }
export async function asrRecognize(): Promise<ApiResult<AsrSegment[]>> {
  const scripts: AsrSegment[][] = [
    [
      { time: '00:00', text: '你好，我想咨询一下你们的智能客服产品', lowConfidenceWords: [] },
      { time: '00:03', text: '主要是想用在我们的电商平台上面', lowConfidenceWords: ['电商'] },
      { time: '00:06', text: '大概每天会有三千多条咨询量', lowConfidenceWords: [] },
    ],
    [
      { time: '00:00', text: '我上一笔订单退款到现在还没有到账', lowConfidenceWords: [] },
      { time: '00:04', text: '订单号是 SD2026110201 麻烦帮我查一下', lowConfidenceWords: ['麻烦'] },
    ],
    [
      { time: '00:00', text: '这个月的账单好像多扣了费用', lowConfidenceWords: ['好像'] },
      { time: '00:03', text: '帮我核对一下最近三笔扣款记录', lowConfidenceWords: [] },
    ],
  ];
  return delay(pick(scripts), 2600);
}

export function extractEntitiesOf(text: string): Entity[] {
  return analyzeText(text).entities;
}
