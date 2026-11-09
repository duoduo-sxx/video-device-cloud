import type {
  KnowledgeItem, LogRecord, MetricPoint, Notice, Session, TodoItem, User,
  Badcase, Message, RoleKey,
} from '@/types';
import { CHANNELS } from '@/constants';
import { INTENTS } from './intents';
import { pick, pickN, randInt, rng } from './rng';

export const USER_NAMES = ['张伟', '李娜', '王强', '陈晓', '刘洋', '赵敏', '孙磊', '周琳', '吴昊', '郑雨桐', '冯静', '许志远', '何嘉怡', '罗建军', '高翔'];
export const DEPTS = ['客服一部', '客服二部', '数据运营部', '产品部', '技术支持部', '商务部'];

// 时间工具：全部基于当前系统时间相对生成
export function timeAgo(daysAgo: number, hour?: number, minute?: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour ?? randInt(9, 20), minute ?? randInt(0, 59), randInt(0, 59), 0);
  return formatTime(d);
}
export function formatTime(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
export function dateStr(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function genUsers(): User[] {
  const roles: RoleKey[] = ['admin', 'agent', 'agent', 'agent', 'knowledge', 'knowledge', 'analyst', 'analyst', 'agent', 'agent', 'agent', 'admin'];
  return USER_NAMES.slice(0, 12).map((name, i) => ({
    id: `u${String(i + 1).padStart(3, '0')}`,
    workNo: `II${1000 + i}`,
    name,
    role: roles[i],
    dept: DEPTS[i % DEPTS.length],
    status: i === 11 ? 'disabled' : 'enabled',
    lastLogin: timeAgo(randInt(0, 3)),
  }));
}

export function genKnowledge(): KnowledgeItem[] {
  const items: KnowledgeItem[] = [];
  const categoryMap: Record<string, string> = {
    基础闲聊: '服务流程', 产品: '产品咨询', 售后: '售后退款', 账务: '账务发票',
    活动: '会员活动', 技术: '技术支持', 服务: '服务流程', 风险: '服务流程',
    商务: '商务合作', 咨询: '服务流程', 账号: '服务流程',
  };
  const similarTemplates = [
    (q: string) => `${q.replace(/[?？!！。]$/, '')}，麻烦解答下`,
    (q: string) => `请教一下：${q}`,
    (q: string) => `你好，${q}`,
    (q: string) => q.replace(/怎么|如何/, '要如何'),
    (q: string) => `${q} 在线等，挺急的`,
  ];
  INTENTS.forEach((intent, idx) => {
    const n = idx % 3 === 0 ? 3 : 2;
    for (let k = 0; k < n; k++) {
      const q = intent.examples[k % intent.examples.length];
      const simCount = randInt(2, 4);
      items.push({
        id: `k${String(items.length + 1).padStart(3, '0')}`,
        title: `${intent.name}｜${q.slice(0, 18)}`,
        category: categoryMap[intent.group] ?? '服务流程',
        question: q,
        similar: pickN(similarTemplates, simCount).map((f) => f(q)),
        answer: intent.answers[0],
        intentCode: intent.code,
        status: rng() > 0.12 ? 'enabled' : 'disabled',
        updatedAt: timeAgo(randInt(0, 30)),
      });
    }
  });
  return items;
}

function genDialogue(): Message[] {
  const intent = pick(INTENTS);
  const rounds = randInt(2, 5);
  const msgs: Message[] = [];
  let t = timeAgo(randInt(0, 14));
  const base = new Date(t.replace(/-/g, '/'));
  for (let r = 0; r < rounds; r++) {
    const userQ = pick(intent.examples);
    base.setMinutes(base.getMinutes() + randInt(1, 3));
    msgs.push({ id: `m${r}u`, role: 'user', content: userQ, time: formatTime(base) });
    base.setSeconds(base.getSeconds() + randInt(3, 15));
    const lowConf = rng() > 0.85;
    msgs.push({
      id: `m${r}b`, role: 'bot',
      content: lowConf ? '抱歉，这个问题我还在学习中，已为您记录并转人工处理，请稍候。' : intent.answers[r % intent.answers.length],
      time: formatTime(base),
      intent: lowConf ? undefined : intent.name,
      confidence: lowConf ? randInt(28, 55) : randInt(72, 97),
      latency: randInt(280, 1400),
      sentiment: r === 0 ? (rng() > 0.75 ? '负面' : rng() > 0.5 ? '正面' : '中性') : undefined,
      feedback: rng() > 0.8 ? (rng() > 0.35 ? 'up' : 'down') : undefined,
    });
    if (r === 1 && rng() > 0.6) {
      base.setMinutes(base.getMinutes() + 1);
      msgs.push({ id: `m${r}u2`, role: 'user', content: '好的，谢谢！', time: formatTime(base) });
      base.setSeconds(base.getSeconds() + 3);
      msgs.push({ id: `m${r}b2`, role: 'bot', content: '不客气，随时为您效劳～', time: formatTime(base), intent: '感谢告别', confidence: 96, latency: 320 });
      break;
    }
  }
  return msgs;
}

export function genSessions(): Session[] {
  const sessions: Session[] = [];
  for (let i = 0; i < 42; i++) {
    const msgs = genDialogue();
    const daysAgo = Math.min(29, Math.floor(i / 1.5) + randInt(0, 2));
    const first = new Date(msgs[0].time.replace(/-/g, '/'));
    first.setDate(new Date().getDate() - daysAgo);
    const start = formatTime(first);
    const end = new Date(msgs[msgs.length - 1].time.replace(/-/g, '/'));
    sessions.push({
      id: `s${String(1000 + i)}`,
      title: msgs[0].content.slice(0, 20),
      userName: pick(USER_NAMES),
      channel: pick([...CHANNELS]),
      createdAt: start,
      updatedAt: formatTime(end),
      messages: msgs,
    });
  }
  return sessions.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

const LOG_TEMPLATES: [string, LogRecord['action'], (n: string) => string][] = [
  ['知识库', '更新', (n: string) => `${n} 更新了知识条目「${pick(INTENTS).name}相关问答」`],
  ['知识库', '新增', (n: string) => `${n} 新增了知识条目「退款进度查询」`],
  ['对话中心', '导出', (n: string) => `${n} 导出了会话记录（30 条）`],
  ['语义理解', '查询', (n: string) => `${n} 执行了批量语义分析（120 条）`],
  ['系统管理', '更新', (n: string) => `${n} 修改了角色「${pick(['普通坐席', '知识管理员', '数据分析员'])}」的权限配置`],
  ['系统管理', '新增', (n: string) => `${n} 创建了用户账号 II10${randInt(0, 9)}`],
  ['场景配置', '更新', (n: string) => `${n} 调整了机器人「小智」的兜底话术`],
  ['质量评测', '更新', (n: string) => `${n} 将 Badcase #${randInt(100, 999)} 标记为已解决`],
  ['数据分析', '导出', (n: string) => `${n} 导出了运营周报 CSV`],
  ['场景配置', '导入', (n: string) => `${n} 批量导入了 25 条意图话术`],
];

export function genLogs(): LogRecord[] {
  const logs: LogRecord[] = [];
  for (let i = 0; i < 120; i++) {
    const [module, action, detail] = pick(LOG_TEMPLATES);
    logs.push({
      id: `l${String(i + 1).padStart(4, '0')}`,
      time: timeAgo(randInt(0, 14), randInt(9, 19)),
      user: pick(USER_NAMES),
      module,
      action,
      detail: detail(pick(USER_NAMES)),
    });
  }
  return logs.sort((a, b) => (a.time < b.time ? 1 : -1));
}

export function genMetrics(): MetricPoint[] {
  const points: MetricPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    const trend = (30 - i) * 1.8;
    const sessions = Math.round((weekend ? 380 : 620) + trend + Math.sin(i / 3) * 60 + randInt(-40, 40));
    points.push({
      date: dateStr(d),
      sessions,
      messages: Math.round(sessions * (4.2 + rng() * 1.6)),
      hitRate: Math.round((88 + rng() * 8) * 10) / 10,
    });
  }
  return points;
}

export function genTodos(): TodoItem[] {
  return [
    { id: 't1', title: '审核 3 条待上线知识条目', status: '待处理', due: '今天 18:00' },
    { id: 't2', title: '处理 Badcase：退款流程误识别', status: '处理中', due: '今天 16:30' },
    { id: 't3', title: '确认 v2.3.1 灰度升级计划', status: '待处理', due: '明天 10:00' },
    { id: 't4', title: '复核本月意图命中率报告', status: '已完成', due: '昨天' },
  ];
}

export function genNotices(): Notice[] {
  return [
    { id: 'n1', title: 'v2.3.1 版本意图模型更新上线', date: timeAgo(1), content: '新增语音情感识别与 12 个行业意图模板，意图命中率预期提升 2.3 个百分点。' },
    { id: 'n2', title: '双 11 技术狂欢季活动开启', date: timeAgo(3), content: '新购满 1 万减 1200，老客户续费享 85 折，活动截至本月底。' },
    { id: 'n3', title: '关于运营大屏数据口径调整的通知', date: timeAgo(6), content: '「解决率」统计口径由会话维度调整为消息维度，历史数据已同步重算。' },
  ];
}

export function genBadcases(sessions: Session[]): Badcase[] {
  const list: Badcase[] = [];
  const types: Badcase['type'][] = ['意图误识别', '知识缺失', '话术不当', '未命中兜底'];
  const owners = ['李娜', '王强', '赵敏', '孙磊'];
  for (let i = 0; i < 18; i++) {
    const s = pick(sessions);
    const status = i < 6 ? '待处理' : i < 13 ? '处理中' : '已解决';
    list.push({
      id: `bc${200 + i}`,
      sessionId: s.id,
      summary: s.messages.find((m) => m.role === 'user')?.content ?? '低置信度回复',
      type: pick(types),
      status,
      owner: pick(owners),
      createdAt: timeAgo(randInt(0, 20)),
    });
  }
  return list;
}
