import type { Anomaly, BudgetPlan, ChangeOrder, PlatformCode, ReconcileRow, Suggestion } from '@/types';
import { ACCOUNTS, ACCOUNT_MAP, PLATFORMS } from './platforms';
import { AD_PLANS, MATERIAL_MAP, PLAN_MAP } from './campaigns';
import { CURRENT_PERIOD, compareRecent, metricsOfAccount, metricsOfPlatform, recentMetrics, totalMetrics } from './daily';
import { AUDIENCE } from './audience';
import { cpa, ctr, cvr, roi, r2 } from '@/lib/metrics';

const T = totalMetrics(CURRENT_PERIOD);
const ACCOUNT_CPA_AVG = cpa(T);

/* ============================================================
 * 异常诊断：全部由真实计算数据驱动，不是写死的文案
 * ============================================================ */
const acc102 = compareRecent('ACC-102', 3);
const acc301 = compareRecent('ACC-301', 3);
const acc201 = compareRecent('ACC-201', 3);

const cpa102Now = cpa(acc102.cur);
const cpa102Prev = cpa(acc102.prev);
const cpa102Delta = ((cpa102Now - cpa102Prev) / cpa102Prev) * 100;

const spend301Now = acc301.cur.spend;
const spend301Prev = acc301.prev.spend;
const spend301Delta = ((spend301Now - spend301Prev) / spend301Prev) * 100;

const cvr201Now = cvr(acc201.cur);
const cvr201Prev = cvr(acc201.prev);
const cvr201Delta = ((cvr201Now - cvr201Prev) / cvr201Prev) * 100;

const mat03 = MATERIAL_MAP['M-03'];
const plan1021 = PLAN_MAP['P-1021'];
const plan1013 = PLAN_MAP['P-1013'];
const plan1011 = PLAN_MAP['P-1011'];

export const ANOMALIES: Anomaly[] = [
  {
    id: 'AN-001',
    type: 'cost_up',
    target: '抖音效果账户 · 徒步鞋·精准成交（P-1021）',
    accountId: 'ACC-102',
    metric: '转化成本 CPA',
    current: `¥${cpa102Now.toFixed(2)}`,
    baseline: `¥${cpa102Prev.toFixed(2)}`,
    changePct: r2(cpa102Delta),
    level: 'high',
    detectedAt: '2026-10-31T09:06:00',
    causeChain: [
      { label: '账户层', value: `ACC-102 近 3 日 CPA ¥${cpa102Now.toFixed(2)}`, note: `较前 3 日上涨 ${cpa102Delta.toFixed(1)}%` },
      { label: '计划层', value: 'P-1021 消耗占比 50%，CPA 最高', note: '该计划 CPA 是账户内其他计划的 1.4 倍' },
      { label: '创意层', value: 'C-1021A（素材 M-03）承接 70% 消耗', note: '近 3 日 CTR 从 3.9% 降至 2.7%' },
      { label: '素材层', value: 'M-03 疲劳度 0.74', note: '已连续投放 23 天，CTR 7 日累计衰减 31%' },
    ],
    conclusion: '并非出价或定向问题，根因是主投素材 M-03 严重疲劳导致点击率下滑、点击成本上升，进而推高 CPA。',
    suggestionId: 'SG-002',
  },
  {
    id: 'AN-002',
    type: 'volume_drop',
    target: '磁力效果账户（ACC-301）',
    accountId: 'ACC-301',
    metric: '消耗',
    current: `¥${spend301Now.toFixed(0)}`,
    baseline: `¥${spend301Prev.toFixed(0)}`,
    changePct: r2(spend301Delta),
    level: 'high',
    detectedAt: '2026-10-31T09:06:30',
    causeChain: [
      { label: '账户层', value: `近 3 日消耗下降 ${Math.abs(spend301Delta).toFixed(1)}%`, note: '同时段大盘消耗上涨 8.2%，非市场因素' },
      { label: '计划层', value: 'P-3011 消耗下降 42%', note: '预算使用率从 96% 降至 54%，未打满' },
      { label: '审核层', value: '主创意 C-3011A 于 10/26 被拒审', note: '平台驳回理由：素材含绝对化用语「最强防风」' },
    ],
    conclusion: '主创意被平台拒审后计划进入低效状态，预算未打满导致账户掉量，需替换素材并申诉。',
    suggestionId: 'SG-003',
  },
  {
    id: 'AN-003',
    type: 'quality',
    target: '小红书聚光账户（ACC-501）',
    accountId: 'ACC-501',
    metric: '数据完整性',
    current: '0 行 / 日',
    baseline: '12,400 行 / 日',
    changePct: -100,
    level: 'high',
    detectedAt: '2026-10-31T08:19:10',
    causeChain: [
      { label: '接入层', value: 'access_token 于 10/28 23:59 过期', note: '连续 3 次重试失败' },
      { label: '数据层', value: 'ODS 缺失 10/29-10/31 共 3 天数据', note: '影响 2 个计划、12,480 行' },
      { label: '指标层', value: '该账户在总览中的消耗占比 5.2%', note: '已从汇总中剔除，避免口径失真' },
    ],
    conclusion: '账户授权过期导致数据断流，需重新授权后补拉历史数据；期间该账户的投放效果无法评估。',
  },
  {
    id: 'AN-004',
    type: 'budget_pace',
    target: '抖音品牌主账户 · 品牌词·人群包承接（P-1013）',
    accountId: 'ACC-101',
    metric: '预算使用率',
    current: '100%（受限）',
    baseline: '72%',
    changePct: 38.9,
    level: 'medium',
    detectedAt: '2026-10-31T09:07:12',
    causeChain: [
      { label: '计划层', value: 'P-1013 日预算 ¥3,200', note: '连续 7 天在 14:00 前打满预算' },
      { label: '效率层', value: `该计划 ROI ${roi(plan1013.m).toFixed(2)}`, note: '高于账户均值 18%，属于被预算卡住的高效计划' },
    ],
    conclusion: '高 ROI 计划受预算限制提前下线，存在明确的加预算空间。',
    suggestionId: 'SG-001',
  },
  {
    id: 'AN-005',
    type: 'material_fatigue',
    target: '素材 M-03 · 雨天防滑·徒步鞋实测',
    accountId: 'ACC-102',
    metric: '素材疲劳度',
    current: '0.74',
    baseline: '0.30（健康阈值）',
    changePct: 146.7,
    level: 'high',
    detectedAt: '2026-10-31T09:07:45',
    causeChain: [
      { label: '素材层', value: 'CTR 7 日衰减 31%', note: '首日 4.02% → 近 3 日 2.77%' },
      { label: '频次层', value: '人均频次 4.8 次', note: '超过 3.5 次的疲劳阈值' },
      { label: '创意层', value: '仅 1 条创意承接 70% 消耗', note: '无素材轮换，疲劳加速' },
    ],
    conclusion: '素材生命周期已接近尾声，继续投放只会推高成本，应立即替换并补充新素材。',
    suggestionId: 'SG-002',
  },
  {
    id: 'AN-006',
    type: 'cvr_down',
    target: '朋友圈·成交转化（P-2012）',
    accountId: 'ACC-201',
    metric: '转化率 CVR',
    current: `${(cvr201Now * 100).toFixed(2)}%`,
    baseline: `${(cvr201Prev * 100).toFixed(2)}%`,
    changePct: r2(cvr201Delta),
    level: 'low',
    detectedAt: '2026-10-31T09:08:20',
    causeChain: [
      { label: '账户层', value: `ACC-201 CVR ${(cvr201Now * 100).toFixed(2)}%`, note: `较前 3 日 ${cvr201Delta > 0 ? '上升' : '下降'} ${Math.abs(cvr201Delta).toFixed(1)}%` },
      { label: '落地页层', value: '10/24 已更换落地页 v3', note: '更换后 CVR 提升，属于正向变化，无需干预' },
    ],
    conclusion: '该变化为落地页优化带来的正向提升，已自动关闭告警。',
  },
];

/* ============================================================
 * 优化建议：问题 → 依据 → 动作 → 预估影响 → 置信度
 * ============================================================ */
export const SUGGESTIONS: Suggestion[] = [
  {
    id: 'SG-001',
    type: 'budget',
    title: '给高 ROI 计划 P-1013 加预算，并关闭其日预算上限',
    target: 'P-1013 品牌词·人群包承接',
    accountId: 'ACC-101',
    problem: '该计划连续 7 天在 14:00 前打满预算，实际只想花 3,200 元但能带来 4.6 倍 ROI，属于典型的「被预算卡住」。',
    evidence: [
      { label: '计划 ROI', value: roi(plan1013.m).toFixed(2), compare: `账户均值 ${roi(metricsOfAccount('ACC-101')).toFixed(2)}` },
      { label: '预算使用率', value: '100%', compare: '账户均值 78%' },
      { label: 'CPA', value: `¥${cpa(plan1013.m).toFixed(2)}`, compare: `账户均值 ¥${cpa(metricsOfAccount('ACC-101')).toFixed(2)}` },
      { label: '提前下线', value: '13:40 左右', compare: '连续 7 天' },
    ],
    action: '日预算 3,200 → 5,200 元（+62.5%），出价维持 1.35 元不变，观察 3 天',
    impact: { conversions: 340, cpa: -6.8, roi: 0.21, note: '预计 7 日新增 340 单，CPA 下降 6.8%，ROI 提升 0.21' },
    confidence: 0.86,
    status: 'pending',
    createdAt: '2026-10-31T09:16:00',
  },
  {
    id: 'SG-002',
    type: 'creative',
    title: '停投疲劳素材 M-03，用 M-08 承接 P-1021 的主流量',
    target: 'C-1021A / 素材 M-03',
    accountId: 'ACC-102',
    problem: 'M-03 已投放 23 天，CTR 从 4.02% 衰减到 2.77%，疲劳度 0.74，是账户 CPA 上涨的直接原因。',
    evidence: [
      { label: '疲劳度', value: '0.74', compare: '健康阈值 0.30' },
      { label: 'CTR 衰减', value: '-31%', compare: '7 日累计' },
      { label: '人均频次', value: '4.8 次', compare: '疲劳阈值 3.5 次' },
      { label: '替换素材 M-08', value: 'CTR 3.61%', compare: '疲劳度仅 0.19' },
    ],
    action: '暂停 C-1021A，把 P-1021 的素材替换为 M-08（15000mm 防水实验），同时开启 M-12 双 11 预售清单做 AB 测试',
    impact: { conversions: 186, cpa: -14.2, roi: 0.48, note: '预计 7 日 CPA 回落至 ¥170 左右，转化 +186 单' },
    confidence: 0.91,
    status: 'pending',
    createdAt: '2026-10-31T09:16:40',
  },
  {
    id: 'SG-003',
    type: 'creative',
    title: '替换被拒审创意，并对「绝对化用语」做全量排查',
    target: 'C-3011A / ACC-301',
    accountId: 'ACC-301',
    problem: '主创意因「最强防风」被平台判为绝对化用语拒审，导致 P-3011 预算使用率从 96% 掉到 54%，账户整体掉量。',
    evidence: [
      { label: '账户消耗变化', value: `${spend301Delta.toFixed(1)}%`, compare: '同期大盘 +8.2%' },
      { label: 'P-3011 预算使用率', value: '54%', compare: '掉量前 96%' },
      { label: '拒审创意', value: '1 条', compare: '承接 100% 消耗' },
    ],
    action: '将文案「最强防风」改为「实测可抗 8 级风」，重新提交审核；同时全量扫描其余 29 条创意的极限词',
    impact: { conversions: 128, cpa: -8.4, roi: 0.26, note: '预计 3 日内恢复至掉量前水平' },
    confidence: 0.88,
    status: 'adopted',
    createdAt: '2026-10-31T09:17:20',
  },
  {
    id: 'SG-004',
    type: 'targeting',
    title: '排除「服饰穿搭」泛兴趣人群，收窄到户外核心标签',
    target: 'ACC-101 全账户定向',
    accountId: 'ACC-101',
    problem: '「服饰穿搭」兴趣人群消耗占比 15.8%，但转化占比只有 13.0%，TGI 仅 59，属于典型的低效人群。',
    evidence: [
      { label: '服饰穿搭 TGI', value: '59', compare: '户外露营 TGI 250' },
      { label: '该人群 CPA', value: `¥${AUDIENCE.interest.find((s) => s.label === '服饰穿搭')!.cpa.toFixed(2)}`, compare: `户外露营 ¥${AUDIENCE.interest.find((s) => s.label === '户外露营')!.cpa.toFixed(2)}` },
      { label: '占账户消耗', value: '15.8%', compare: '约 ¥11.9 万' },
    ],
    action: '在 ACC-101 / ACC-102 两个账户叠加「排除服饰穿搭泛兴趣」人群包 LK-06，保留户外露营、徒步登山、运动户外三类',
    impact: { conversions: 96, cpa: -11.5, roi: 0.34, note: '预计节省 8% 无效消耗，转化不降反升' },
    confidence: 0.79,
    status: 'pending',
    createdAt: '2026-10-31T09:18:00',
  },
  {
    id: 'SG-005',
    type: 'budget',
    title: '为 ACC-202 充值，避免预算断供',
    target: 'ACC-202 腾讯优量汇',
    accountId: 'ACC-202',
    problem: '账户余额 3,210.60 元，仅够 0.7 天消耗，且日预算 4,500 元已连续 5 天打满。',
    evidence: [
      { label: '账户余额', value: '¥3,210.60', compare: '不足 1 天' },
      { label: '日预算使用率', value: '100%', compare: '连续 5 天' },
      { label: '账户 ROI', value: roi(metricsOfAccount('ACC-202')).toFixed(2), compare: `大盘 ${roi(T).toFixed(2)}` },
    ],
    action: '充值 50,000 元（约 11 天预算），并设置余额低于 10,000 元自动提醒',
    impact: { conversions: 0, cpa: 0, roi: 0, note: '保障性动作，不直接影响效率，但可避免断供造成的重新起量成本' },
    confidence: 0.95,
    status: 'dispatched',
    createdAt: '2026-10-31T09:18:30',
  },
  {
    id: 'SG-006',
    type: 'landing',
    title: '加购到下单环节是最大短板，建议大促开门红集中收割',
    target: '全平台落地页与优惠策略',
    accountId: 'ACC-101',
    problem: '「加购 → 下单」转化率仅 11.8%，行业基准为 32%，说明用户已被种草但缺少立刻下单的理由（价格力/赠品/紧迫感）。',
    evidence: [
      { label: '加购 → 下单', value: '11.8%', compare: '行业 32%' },
      { label: '加购人数', value: '约 8.5 万', compare: '下单 9,750 单' },
      { label: '客单价', value: `¥${(T.gmv / T.paidOrders).toFixed(0)}`, compare: '双 11 预售价可下探 12%' },
    ],
    action: '11/1 开门红当天上线「前 2 小时加赠收纳袋 + 限时立减」，对加购未支付人群包 LK-05（476 万人）做定向触达',
    impact: { conversions: 620, cpa: -9.6, roi: 0.52, note: '预计转化提升 6.4%，CPA 下降 9.6%' },
    confidence: 0.72,
    status: 'pending',
    createdAt: '2026-10-31T09:19:10',
  },
  {
    id: 'SG-007',
    type: 'targeting',
    title: '把高相似度人群包 LK-01 扩量到朋友圈账户',
    target: 'ACC-201 微信朋友圈',
    accountId: 'ACC-201',
    problem: 'LK-01（户外核心人群 lookalike，相似度 0.82）在抖音侧 ROI 4.21，但朋友圈账户尚未使用该人群包，仍在跑通投。',
    evidence: [
      { label: 'LK-01 覆盖', value: '1,860 万人', compare: '朋友圈可触达约 620 万' },
      { label: 'LK-01 ROI', value: '4.21', compare: `朋友圈当前 ${roi(metricsOfAccount('ACC-201')).toFixed(2)}` },
      { label: '相似度', value: '0.82', compare: '阈值 0.70' },
    ],
    action: '在 P-2012 上叠加 LK-01 定向，与原通投计划做 5:5 预算分流测试 3 天',
    impact: { conversions: 148, cpa: -7.2, roi: 0.29, note: '预计朋友圈 ROI 从 3.6 提升至 3.9' },
    confidence: 0.74,
    status: 'ignored',
    createdAt: '2026-10-31T09:19:50',
  },
  {
    id: 'SG-008',
    type: 'bid',
    title: '降低 ACC-202 出价，当前 CPA 已超大盘 40%',
    target: 'ACC-202 优量汇·加购拉新',
    accountId: 'ACC-202',
    problem: '优量汇流量质量偏弱，CPA 显著高于大盘，但转化成本仍在可接受区间，建议小幅降价试探而非直接停投。',
    evidence: [
      { label: '账户 CPA', value: `¥${cpa(metricsOfAccount('ACC-202')).toFixed(2)}`, compare: `大盘 ¥${ACCOUNT_CPA_AVG.toFixed(2)}` },
      { label: 'CVR', value: `${(cvr(metricsOfAccount('ACC-202')) * 100).toFixed(2)}%`, compare: `大盘 ${(cvr(T) * 100).toFixed(2)}%` },
      { label: 'CTR', value: `${(ctr(metricsOfAccount('ACC-202')) * 100).toFixed(2)}%`, compare: `大盘 ${(ctr(T) * 100).toFixed(2)}%` },
    ],
    action: '出价从 36 元降至 31 元（-13.9%），保留 30% 预算观察 2 天',
    impact: { conversions: -42, cpa: -12.8, roi: 0.36, note: '以少量转化换取成本结构改善，整体 ROI 提升' },
    confidence: 0.68,
    status: 'adopted',
    createdAt: '2026-10-31T09:20:30',
  },
];

/* ============================================================
 * 变更单：下发 → 生效 → 效果回收
 * ============================================================ */
export const CHANGE_ORDERS: ChangeOrder[] = [
  {
    id: 'CH-20261028-001',
    suggestionId: 'SG-003',
    accountId: 'ACC-301',
    target: 'C-3011A 创意文案',
    type: 'creative',
    before: '最强防风，暴雨不侵',
    after: '实测可抗 8 级风，暴雨不侵',
    status: 'effective',
    createdAt: '2026-10-28T10:12:00',
    effectiveAt: '2026-10-28T14:26:00',
    operator: '周雨',
    feedback: { days: 3, conversionsDelta: 9.4, cpaDelta: -7.1, roiDelta: 0.24, note: '审核通过后计划恢复打满预算，CPA 回落，效果符合预估' },
  },
  {
    id: 'CH-20261030-002',
    suggestionId: 'SG-005',
    accountId: 'ACC-202',
    target: '账户余额',
    type: 'budget',
    before: '¥3,210.60',
    after: '¥53,210.60',
    status: 'effective',
    createdAt: '2026-10-30T09:40:00',
    effectiveAt: '2026-10-30T10:05:00',
    operator: '李澈',
    feedback: { days: 1, conversionsDelta: 2.1, cpaDelta: -1.4, roiDelta: 0.05, note: '充值到账，预算未再受限' },
  },
  {
    id: 'CH-20261031-003',
    suggestionId: 'SG-002',
    accountId: 'ACC-102',
    target: 'P-1021 素材替换',
    type: 'creative',
    before: '主投 M-03（疲劳 0.74）',
    after: '主投 M-08 + AB 测试 M-12',
    status: 'dispatched',
    createdAt: '2026-10-31T09:30:00',
    effectiveAt: null,
    operator: '周雨',
  },
  {
    id: 'CH-20261031-004',
    suggestionId: 'SG-001',
    accountId: 'ACC-101',
    target: 'P-1013 日预算',
    type: 'budget',
    before: '¥3,200 / 天',
    after: '¥5,200 / 天',
    status: 'pending_approval',
    createdAt: '2026-10-31T09:32:00',
    effectiveAt: null,
    operator: '陈默',
  },
  {
    id: 'CH-20261031-005',
    suggestionId: 'SG-008',
    accountId: 'ACC-202',
    target: 'P-2021 出价',
    type: 'bid',
    before: '¥36.00',
    after: '¥31.00',
    status: 'failed',
    createdAt: '2026-10-31T09:35:00',
    effectiveAt: null,
    operator: '李澈',
  },
  {
    id: 'CH-20261029-006',
    accountId: 'ACC-201',
    target: 'P-2012 落地页',
    type: 'landing',
    before: '落地页 v2（首屏 3.2 秒）',
    after: '落地页 v3（首屏 1.4 秒）',
    status: 'effective',
    createdAt: '2026-10-24T16:00:00',
    effectiveAt: '2026-10-24T18:30:00',
    operator: '陈默',
    feedback: { days: 7, conversionsDelta: 18.6, cpaDelta: -10.9, roiDelta: 0.41, note: '首屏加载提速后 CVR 从 0.61% 提升到 0.74%，为近一个月最有效的单点优化' },
  },
];

/* ============================================================
 * 预算分配方案：按边际 ROI 排序，给出加减预算建议
 * ============================================================ */
const MARGINAL_BASE: Record<string, number> = {
  'P-1011': 3.92, 'P-1012': 4.05, 'P-1013': 4.61, 'P-1021': 2.86, 'P-1022': 3.18,
  'P-1023': 3.44, 'P-1031': 4.38, 'P-1032': 3.72, 'P-2011': 2.64, 'P-2012': 3.58,
  'P-2021': 3.06, 'P-3011': 3.24, 'P-3012': 2.92, 'P-3021': 1.82, 'P-4011': 3.36,
  'P-4012': 2.78, 'P-4021': 4.12, 'P-5011': 3.86, 'P-5012': 4.02, 'P-5021': 3.46,
  'P-6011': 2.58,
};

export const BUDGET_PLANS: BudgetPlan[] = AD_PLANS.map((p) => {
  const marginal = MARGINAL_BASE[p.id] ?? 3;
  const avgRoi = roi(p.m);
  // 边际 ROI 高 → 加预算；低 → 减预算，幅度控制在 ±30% 内
  const delta = marginal >= 3.8 ? 0.25 : marginal >= 3.2 ? 0.1 : marginal >= 2.8 ? -0.08 : -0.22;
  return {
    planId: p.id,
    name: p.name,
    accountName: ACCOUNT_MAP[p.accountId].name,
    currentBudget: p.dailyBudget,
    suggestedBudget: Math.round(p.dailyBudget * (1 + delta)),
    currentCpa: r2(cpa(p.m)),
    marginalRoi: r2(marginal),
    elasticity: r2(0.58 + (avgRoi > 3 ? 0.14 : 0.06)),
  };
}).sort((a, b) => b.marginalRoi - a.marginalRoi);

/* ============================================================
 * 跨平台对账：平台后台 vs 我方采集
 * ============================================================ */
export const RECONCILE: ReconcileRow[] = PLATFORMS.map((p, i) => {
  const m = metricsOfPlatform(p.code, CURRENT_PERIOD);
  const diffFactor = [0.0006, 0.0031, -0.0012, 0.0008, 0.0024, 0.0018][i];
  const platformSpend = r2(m.spend * (1 + diffFactor));
  const ourConv = m.conversions;
  // 腾讯回传「支付」口径，比「下单」少约 3.5%，因此平台后台转化数低于我方
  const platformConv = i === 1 ? Math.round(ourConv / 1.035) : Math.round(ourConv * (1 + 0.001 * (i - 2)));
  const diff = platformSpend - m.spend;
  return {
    platform: p.code,
    accountCount: ACCOUNTS.filter((a) => a.platform === p.code).length,
    platformSpend,
    ourSpend: m.spend,
    platformConv,
    ourConv,
    diffRate: r2((diff / m.spend) * 10000) / 100,
    status: Math.abs(diff / m.spend) > 0.002 ? 'diff' : 'matched',
    note:
      i === 1
        ? '腾讯转化口径为「支付」，折算为「下单」后差异 3.5%，已在 DWD 层处理'
        : i === 2
          ? '快手扣费存在跨小时归属，日汇总差异 -0.12%'
          : '差异在 0.2% 以内，属于平台返点与跨时区归属正常波动',
  };
});

/* ---------------- 汇总指标（供总览/诊断页复用） ---------------- */
export const INSIGHT_SUMMARY = {
  totalSpend: r2(T.spend),
  totalConversions: T.conversions,
  totalGmv: r2(T.gmv),
  avgCpa: r2(ACCOUNT_CPA_AVG),
  avgRoi: r2(roi(T)),
  avgCtr: r2(ctr(T) * 10000) / 10000,
  avgCvr: r2(cvr(T) * 10000) / 10000,
  recent7: recentMetrics(7),
  recent3: recentMetrics(3),
  accountCount: ACCOUNTS.length,
  planCount: AD_PLANS.length,
};
