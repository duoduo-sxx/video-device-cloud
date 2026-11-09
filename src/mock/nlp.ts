import type { AnalysisResult } from '@/types';
import { INTENTS } from './intents';
import { SENSITIVE_WORDS } from '@/constants';
import { randInt, pick } from './rng';

const PRODUCTS = ['智能交互与理解平台', '语义引擎', '对话机器人', '语音助手', '知识库平台'];
const PLACES = ['北京', '上海', '广州', '深圳', '杭州', '成都'];

const POSITIVE = ['好', '不错', '满意', '快', '专业', '感谢', '赞', '棒', '顺利', '喜欢'];
const NEGATIVE = ['差', '慢', '不满', '投诉', '垃圾', '糟', '无语', '失望', '太烂', '气人', '烦'];

function extractEntities(text: string): AnalysisResult['entities'] {
  const entities: AnalysisResult['entities'] = [];
  const push = (m: RegExpExecArray | null, type: AnalysisResult['entities'][number]['type']) => {
    if (m) entities.push({ text: m[0], type });
  };
  push(/(\d+(\.\d+)?)\s*(元|块|万)/.exec(text), '金额');
  push(/1[3-9]\d{9}/.exec(text), '电话');
  push(/[A-Z]{2,4}\d{6,}/.exec(text), '订单号');
  push(/(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}日?|\d+月\d+[日号]|今天|明天|昨天|后天|上周|下周|本月底|前天)/.exec(text), '时间');
  const product = PRODUCTS.find((p) => text.includes(p.split('')[0]) && text.includes(p.slice(-2)));
  if (product && text.includes(product.slice(0, 2))) entities.push({ text: product.slice(0, Math.min(product.length, 6)), type: '产品' });
  const place = PLACES.find((p) => text.includes(p));
  if (place) entities.push({ text: place, type: '地点' });
  return entities;
}

function matchIntents(text: string) {
  const lower = text.toLowerCase();
  const scored = INTENTS.filter((i) => i.status === 'enabled')
    .map((i) => {
      const hits = i.keywords.filter((k) => lower.includes(k.toLowerCase()));
      return { intent: i, hits: hits.length, firstHit: hits[0] };
    })
    .filter((s) => s.hits > 0)
    .sort((a, b) => b.hits - a.hits);
  return scored;
}

export function analyzeText(text: string): AnalysisResult {
  const trimmed = text.trim();
  const scored = matchIntents(trimmed);
  const entities = extractEntities(trimmed);
  const posHits = POSITIVE.filter((w) => trimmed.includes(w)).length;
  const negHits = NEGATIVE.filter((w) => trimmed.includes(w)).length;
  let sentiment: AnalysisResult['sentiment'] = '中性';
  let sentimentScore = 0.5;
  if (negHits > posHits) {
    sentiment = '负面';
    sentimentScore = Math.min(0.95, 0.55 + negHits * 0.12);
  } else if (posHits > negHits) {
    sentiment = '正面';
    sentimentScore = Math.min(0.95, 0.55 + posHits * 0.12);
  } else if (sentiment === '中性') {
    sentimentScore = 0.4 + Math.random() * 0.2;
  }
  const candidates = scored.slice(0, 3).map((s, i) => ({
    name: s.intent.name,
    code: s.intent.code,
    confidence: Math.max(30, Math.min(97, s.hits * 34 - i * 12 + randInt(-4, 6))),
  }));
  const main = candidates[0];
  const sensitive = SENSITIVE_WORDS.filter((w) => trimmed.includes(w));
  const keywords = [
    ...(main ? [main.name] : []),
    ...entities.map((e) => e.text),
    ...scored.flatMap((s) => (s.firstHit ? [s.firstHit] : [])),
  ].slice(0, 6);
  return {
    id: `a${Date.now()}${randInt(100, 999)}`,
    text: trimmed,
    time: new Date().toLocaleString('zh-CN', { hour12: false }),
    mainIntent: main?.name ?? '未知意图（兜底）',
    mainIntentCode: main?.code ?? 'fallback',
    confidence: main?.confidence ?? randInt(20, 45),
    candidates: candidates.length ? candidates : [{ name: '未知意图（兜底）', confidence: randInt(20, 45) }],
    entities,
    sentiment,
    sentimentScore: Math.round(sentimentScore * 100) / 100,
    keywords: [...new Set(keywords)],
    sensitive,
  };
}

// 对话回复：意图匹配 -> 话术 / 兜底
export function matchReply(text: string): { content: string; intent?: string; confidence: number } {
  const scored = matchIntents(text);
  if (scored.length === 0) {
    return {
      content: '抱歉，这个问题我暂时没有学习到，已为您记录。您可以换个说法描述，或输入「转人工」由真人客服为您处理～',
      intent: undefined,
      confidence: randInt(22, 45),
    };
  }
  const best = scored[0];
  const confidence = Math.min(97, best.hits * 33 + randInt(-3, 10));
  return {
    content: pick(best.intent.answers),
    intent: best.intent.name,
    confidence,
  };
}
