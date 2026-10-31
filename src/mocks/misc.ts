import type { Payment, Contract, Ticket, AuditLog, AlertItem, ReviewItem, DiscountRequest } from '@/types';
import { BILLS } from './bills';
import { TENANTS } from './tenants';

const TNAME = Object.fromEntries(TENANTS.map((t) => [t.id, t.name]));
const TSHORT = Object.fromEntries(TENANTS.map((t) => [t.id, t.shortName]));

/* ================= 回款 ================= */
export const PAYMENTS: Payment[] = BILLS.filter((b) => b.status === 'settled')
  .slice(0, 80)
  .map((b, i) => ({
    id: `PAY-${String(1000 + i)}`,
    tenantId: b.tenantId,
    billId: b.id,
    billNo: b.billNo,
    amount: b.total,
    paidAt: b.paidAt ?? `${b.period}-18T09:30:00`,
    serialNo: `TXN${b.period.replace('-', '')}${String(100000 + i * 37)}`,
    method: i % 7 === 0 ? 'acceptance' : 'transfer',
    status: 'matched',
  }));

/* ================= 合同 ================= */
export const CONTRACTS: Contract[] = [
  {
    id: 'CT-2026-0012',
    tenantId: 'TEN-0001',
    contractNo: 'YS-HT-2026-0012',
    name: '大数据技术服务框架协议（2026 年度）',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    settlementCycle: '自然月，次月 5 日前确认',
    slaLevel: '99.9% / P1 故障 2 小时响应',
    amount: 3200000,
    status: 'active',
    attachments: ['框架协议正文.pdf', 'SLA 附件.pdf', '数据安全承诺函.pdf'],
  },
  {
    id: 'CT-2025-0087',
    tenantId: 'TEN-0001',
    contractNo: 'YS-HT-2025-0087',
    name: '算力资源预留服务补充协议',
    startDate: '2025-11-18',
    endDate: '2026-11-17',
    settlementCycle: '自然月，预留资源按期结算',
    slaLevel: '99.95% / 资源保障 24 卡',
    amount: 680000,
    status: 'expiring',
    attachments: ['补充协议.pdf'],
  },
];

/* ================= 工单 ================= */
const TICKET_SEED: [string, string, Ticket['priority'], Ticket['status'], string][] = [
  ['TEN-0001', 'A100 实例频繁出现 NCCL 超时', 'high', 'processing', '徐航'],
  ['TEN-0001', '申请将日配额从 500 万提升至 800 万', 'medium', 'resolved', '周敏'],
  ['TEN-0003', '账单明细中脱敏用量与后台不一致', 'high', 'processing', '闫菲'],
  ['TEN-0002', '希望增加抖音平台文案风格模板', 'low', 'open', '周敏'],
  ['TEN-0004', '向量化接口 P99 延迟偏高', 'medium', 'resolved', '徐航'],
  ['TEN-0006', '发票抬头变更，需要重新开具 8 月发票', 'high', 'open', '闫菲'],
  ['TEN-0005', '质检模型微调样本上传失败', 'medium', 'processing', '李昊'],
  ['TEN-0007', '需要开通子账号 5 个', 'low', 'closed', '周敏'],
  ['TEN-0009', 'H100 预留到期后续约报价', 'medium', 'processing', '李昊'],
  ['TEN-0008', '数据源连接后同步一直 pending', 'medium', 'open', '徐航'],
  ['TEN-0010', '试用期延长申请', 'low', 'open', '周敏'],
  ['TEN-0003', '新增开票品目「信息技术服务*数据加工费」', 'low', 'resolved', '闫菲'],
  ['TEN-0002', '批量生成任务积压，队列 200+', 'high', 'processing', '徐航'],
  ['TEN-0006', '跨境场景需要多语言向量模型', 'low', 'open', '李昊'],
  ['TEN-0009', '对账差异 1,240.00 元，申请复核', 'high', 'resolved', '闫菲'],
];

export const TICKETS: Ticket[] = TICKET_SEED.map((t, i) => ({
  id: `TK-20261${String(100 + i)}`,
  tenantId: t[0],
  tenantName: TNAME[t[0]] ?? '-',
  title: t[1],
  category: ['算力', '账号与权限', '计费对账', '产品能力'][i % 4],
  priority: t[2],
  status: t[3],
  assignee: t[4],
  slaDeadline: `2026-11-0${(i % 5) + 1}T${String(10 + (i % 8)).padStart(2, '0')}:00:00`,
  createdAt: `2026-10-${String(20 + (i % 10)).padStart(2, '0')}T${String(9 + (i % 9)).padStart(2, '0')}:20:00`,
  replies:
    t[3] === 'open'
      ? []
      : [
          { by: '客服机器人', at: `2026-10-${String(20 + (i % 10)).padStart(2, '0')}T09:21:00`, content: '已收到您的工单，正在为您分配专属工程师。' },
          {
            by: t[4],
            at: `2026-10-${String(21 + (i % 9)).padStart(2, '0')}T14:05:00`,
            content:
              t[3] === 'resolved' || t[3] === 'closed'
                ? '问题已定位并处理完成，相关配置已同步生效，请您复核。'
                : '正在排查中，初步怀疑与节点网络抖动有关，预计今日内给出结论。',
          },
        ],
}));

/* ================= 审计日志 ================= */
const ACTIONS = [
  ['登录系统', '账号', 'AUTH'],
  ['确认 2026-09 账单', '账单', 'BILL'],
  ['提交开票申请', '发票', 'INVOICE'],
  ['创建 API 密钥', '密钥', 'APIKEY'],
  ['吊销 API 密钥', '密钥', 'APIKEY'],
  ['新建数据加工任务', '任务', 'JOB'],
  ['导出用量明细', '用量', 'USAGE'],
  ['调整客户信用额度', '客户', 'TENANT'],
  ['修改模型价格策略', '定价', 'PRICING'],
  ['审批折扣申请', '定价', 'PRICING'],
  ['开具增值税专用发票', '发票', 'INVOICE'],
  ['登记回款并核销', '回款', 'PAYMENT'],
  ['停用成员账号', '成员', 'USER'],
  ['发布账单批次', '账单', 'BILL'],
];

const ACTORS = [
  ['陈立', '企业管理员'],
  ['何静', '客户财务'],
  ['闫菲', '平台财务'],
  ['周敏', '平台运营'],
  ['秦朗', '平台超管'],
  ['赵一鸣', '业务使用者'],
];

export const AUDIT_LOGS: AuditLog[] = Array.from({ length: 72 }).map((_, i) => {
  const a = ACTIONS[i % ACTIONS.length];
  const p = ACTORS[i % ACTORS.length];
  return {
    id: `AUD-${String(10000 + i)}`,
    actorName: p[0],
    actorRole: p[1],
    action: a[0],
    targetType: a[1],
    target: ['BILL-202609-0001', 'INV-9001', 'KEY-002', 'JOB-20261030-0041', 'TEN-0003', 'PRICING-TXT-2026Q4'][i % 6],
    ip: i % 3 === 0 ? '120.244.18.77' : i % 3 === 1 ? '10.8.2.114' : '39.156.66.21',
    createdAt: `2026-10-${String(31 - (i % 20)).padStart(2, '0')}T${String(8 + (i % 13)).padStart(2, '0')}:${String((i * 11) % 60).padStart(2, '0')}:00`,
  };
}).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

/* ================= 告警 ================= */
export const ALERTS: AlertItem[] = [
  { id: 'AL-01', level: 'critical', type: 'GPU 温度', message: 'cn-north-2a / node-gpu-047 的 A100 #3 温度达 89°C，已触发降频', target: 'node-gpu-047', status: 'firing', createdAt: '2026-10-31T22:48:00' },
  { id: 'AL-02', level: 'warning', type: '资源水位', message: '华北 2 区 A100 分配率 75.8%，剩余 93 卡，预计 6 天内售罄', target: 'cn-north-2a', status: 'firing', createdAt: '2026-10-31T20:10:00' },
  { id: 'AL-03', level: 'warning', type: '接口延迟', message: 'Vision-Pro-OCR P99 延迟 2,140ms，超过 SLA 阈值 1,800ms', target: 'MDL-03', status: 'firing', createdAt: '2026-10-31T19:32:00' },
  { id: 'AL-04', level: 'info', type: '账单逾期', message: 'TEN-0007 账龄已达 34 天，逾期金额 ¥62,480.00', target: 'TEN-0007', status: 'firing', createdAt: '2026-10-31T09:00:00' },
  { id: 'AL-05', level: 'critical', type: '节点离线', message: 'cn-south-1a / node-gpu-112 心跳丢失 8 分钟', target: 'node-gpu-112', status: 'resolved', createdAt: '2026-10-30T04:12:00' },
  { id: 'AL-06', level: 'info', type: '配额预警', message: 'TEN-0001 日调用配额使用率 63.7%，未超阈值', target: 'TEN-0001', status: 'resolved', createdAt: '2026-10-30T18:00:00' },
];

/* ================= 内容审核 ================= */
export const REVIEW_ITEMS: ReviewItem[] = [
  { id: 'RV-001', tenantName: '星野跨境电子商务有限公司', contentType: '商品文案', snippet: '本产品为全网最低价，其他商家均为假货，请认准……', reason: '涉嫌贬低同行 / 绝对化用语', riskLevel: 'high', status: 'pending', createdAt: '2026-10-31T21:12:00' },
  { id: 'RV-002', tenantName: '优鲜生活连锁超市股份有限公司', contentType: '营销图', snippet: '【图片】促销海报含"国家级""最优质"字样', reason: '绝对化用语', riskLevel: 'medium', status: 'pending', createdAt: '2026-10-31T18:40:00' },
  { id: 'RV-003', tenantName: '启明职业教育科技有限公司', contentType: '课程文案', snippet: '30 天包过，不过全额退款并赔偿十倍学费', reason: '虚假承诺', riskLevel: 'high', status: 'pending', createdAt: '2026-10-31T15:05:00' },
  { id: 'RV-004', tenantName: '智联人才服务集团有限公司', contentType: '职位描述', snippet: '限男性，35 岁以下，本地户口优先', reason: '就业歧视', riskLevel: 'high', status: 'rejected', createdAt: '2026-10-30T11:20:00' },
  { id: 'RV-005', tenantName: '康泰医疗信息化服务有限公司', contentType: '科普文案', snippet: '本品可替代药物治疗，三天见效', reason: '医疗功效宣称', riskLevel: 'high', status: 'rejected', createdAt: '2026-10-29T16:44:00' },
  { id: 'RV-006', tenantName: '恒锐新能源汽车零部件有限公司', contentType: '商品文案', snippet: '采用 40Cr 合金钢调质处理，抗拉强度达 1040MPa', reason: '疑似参数夸大，需提供检测报告', riskLevel: 'low', status: 'approved', createdAt: '2026-10-29T10:02:00' },
  { id: 'RV-007', tenantName: '鸿远建设集团有限公司', contentType: '投标文件摘要', snippet: '我司具备特级施工资质，近三年无任何安全事故', reason: '需资质核验', riskLevel: 'medium', status: 'approved', createdAt: '2026-10-28T09:30:00' },
];

/* ================= 折扣审批 ================= */
export const DISCOUNTS: DiscountRequest[] = [
  { id: 'DC-001', tenantName: '中弘新能源科技有限公司', serviceName: '文本生成 Qwen3-72B', basePrice: 0.8, requestRate: 0.68, reason: '年度承诺用量 200 万千 token 以上，申请阶梯折扣', applicant: '孙倩', status: 'pending', createdAt: '2026-10-30T14:20:00' },
  { id: 'DC-002', tenantName: '恒锐新能源汽车零部件有限公司', serviceName: 'GPU A100 80G 预留实例', basePrice: 68, requestRate: 0.85, reason: '续约两年，申请 15% 框架折扣', applicant: '周敏', status: 'pending', createdAt: '2026-10-29T11:05:00' },
  { id: 'DC-003', tenantName: '江城农村商业银行股份有限公司', serviceName: '数据洞察专业版', basePrice: 32000, requestRate: 0.9, reason: '金融行业标杆客户，用于案例宣传', applicant: '李昊', status: 'approved', createdAt: '2026-10-22T09:40:00' },
  { id: 'DC-004', tenantName: '启明职业教育科技有限公司', serviceName: '商品文案生成', basePrice: 2.6, requestRate: 0.6, reason: '创业期客户，采购量小', applicant: '周敏', status: 'rejected', createdAt: '2026-10-18T16:10:00' },
];

/* ================= 平台经营指标 ================= */
export const PLATFORM_MONTHLY = [
  { month: '2026-05', revenue: 1842600, customers: 42, calls: 12840000 },
  { month: '2026-06', revenue: 1988400, customers: 46, calls: 14260000 },
  { month: '2026-07', revenue: 2136400, customers: 49, calls: 15680000 },
  { month: '2026-08', revenue: 2214800, customers: 52, calls: 16420000 },
  { month: '2026-09', revenue: 2388600, customers: 56, calls: 17860000 },
  { month: '2026-10', revenue: 2146800, customers: 58, calls: 16240000 },
];

export function shortNameOf(tenantId: string): string {
  return TSHORT[tenantId] ?? tenantId;
}

export { TNAME as TENANT_NAME_MAP };
