// 全局类型定义
export type RoleKey = 'admin' | 'agent' | 'knowledge' | 'analyst';

export interface User {
  id: string;
  workNo: string;
  name: string;
  role: RoleKey;
  dept: string;
  status: 'enabled' | 'disabled';
  lastLogin: string;
}

export interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  time: string;
  intent?: string;
  confidence?: number;
  latency?: number;
  sentiment?: '正面' | '中性' | '负面';
  feedback?: 'up' | 'down';
}

export interface Session {
  id: string;
  title: string;
  userName: string;
  channel: 'Web' | 'App' | '小程序' | '电话';
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export interface Intent {
  id: string;
  name: string;
  code: string;
  group: string;
  keywords: string[];
  examples: string[];
  answers: string[];
  status: 'enabled' | 'disabled';
}

export interface KnowledgeItem {
  id: string;
  title: string;
  category: string;
  question: string;
  similar: string[];
  answer: string;
  intentCode?: string;
  status: 'enabled' | 'disabled';
  updatedAt: string;
}

export interface Entity {
  text: string;
  type: '时间' | '金额' | '电话' | '订单号' | '产品' | '地点';
}

export interface AnalysisResult {
  id: string;
  text: string;
  time: string;
  mainIntent: string;
  mainIntentCode: string;
  confidence: number;
  candidates: { name: string; confidence: number }[];
  entities: Entity[];
  sentiment: '正面' | '中性' | '负面';
  sentimentScore: number;
  keywords: string[];
  sensitive: string[];
}

export interface LogRecord {
  id: string;
  time: string;
  user: string;
  module: string;
  action: '新增' | '更新' | '删除' | '查询' | '登录' | '导出' | '导入';
  detail: string;
}

export interface Badcase {
  id: string;
  sessionId: string;
  summary: string;
  type: '意图误识别' | '知识缺失' | '话术不当' | '未命中兜底';
  status: '待处理' | '处理中' | '已解决';
  owner: string;
  note?: string;
  createdAt: string;
}

export interface Annotation {
  id: string;
  sessionId: string;
  msgId: string;
  result: '正确' | '部分正确' | '错误';
  errorType?: string;
  note?: string;
  time: string;
}

export interface MetricPoint {
  date: string;
  sessions: number;
  messages: number;
  hitRate: number; // 0-100
}

export interface TodoItem {
  id: string;
  title: string;
  status: '待处理' | '处理中' | '已完成';
  due: string;
}

export interface Notice {
  id: string;
  title: string;
  date: string;
  content: string;
}

export interface FlowNode {
  id: string;
  type: '开始' | '意图判断' | '回复' | '转人工' | '结束';
  name: string;
  desc: string;
  x: number;
  y: number;
}

export interface ApiResult<T> {
  code: number;
  data: T;
  message: string;
}
