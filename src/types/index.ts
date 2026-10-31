/* ============ 通用 ============ */
export type ID = string;

export type RoleCode =
  | 'tenant_admin'
  | 'tenant_member'
  | 'tenant_finance'
  | 'ops'
  | 'ops_compute'
  | 'finance'
  | 'super_admin';

export interface Role {
  code: RoleCode;
  name: string;
  scope: 'console' | 'admin' | 'finance';
  desc: string;
  permissions: string[];
}

/* ============ 租户 / 用户 ============ */
export type TenantLevel = 'A' | 'B' | 'C';

export interface Tenant {
  id: ID;
  name: string;
  shortName: string;
  industry: string;
  level: TenantLevel;
  taxNo: string;
  address: string;
  phone: string;
  bankName: string;
  bankAccount: string;
  contactName: string;
  contactPhone: string;
  creditLimit: number;
  balance: number;
  status: 'active' | 'frozen' | 'trial';
  createdAt: string;
  salesOwner: string;
  monthlyAvg: number;
}

export interface User {
  id: ID;
  tenantId: ID;
  name: string;
  email: string;
  phone: string;
  role: RoleCode;
  department: string;
  status: 'active' | 'disabled';
  lastLoginAt: string;
}

/* ============ 服务与模型 ============ */
export type ServiceCategory =
  | 'compute'
  | 'model'
  | 'data'
  | 'match'
  | 'generate'
  | 'subscription';

export const CATEGORY_LABEL: Record<ServiceCategory, string> = {
  compute: '算力资源',
  model: '模型调用',
  data: '数据处理',
  match: '智能匹配',
  generate: '内容生成',
  subscription: '订阅服务',
};

export interface PriceTier {
  from: number;
  to: number | null;
  price: number;
}

export interface ServiceItem {
  id: ID;
  category: ServiceCategory;
  name: string;
  code: string;
  unit: string;
  billingMode: 'usage' | 'reserved' | 'subscription';
  unitPrice: number;
  priceTiers?: PriceTier[];
  status: 'online' | 'offline';
  description: string;
}

export type ModelType = 'text' | 'embedding' | 'multimodal' | 'audio' | 'structured';

export interface ModelInfo {
  id: ID;
  serviceItemId: ID;
  name: string;
  vendor: string;
  version: string;
  type: ModelType;
  capabilityTags: string[];
  contextWindow: string;
  inputPrice: number;
  outputPrice: number;
  qpsLimit: number;
  sla: string;
  avgLatency: number;
  status: 'online' | 'offline' | 'beta';
  intro: string;
  params: { name: string; type: string; required: boolean; def: string; desc: string }[];
  benchmark: { label: string; score: number }[];
}

/* ============ 算力 ============ */
export interface ComputeSpec {
  id: ID;
  gpuModel: string;
  memoryGB: number;
  computeTFLOPS: number;
  region: string;
  zone: string;
  unitPrice: number;
  totalCards: number;
  allocatedCards: number;
  status: 'available' | 'tight' | 'soldout';
  image: string;
}

export interface ComputeInstance {
  id: ID;
  tenantId: ID;
  specId: ID;
  specName: string;
  image: string;
  cardCount: number;
  billingMode: 'usage' | 'reserved';
  region: string;
  status: 'running' | 'stopped' | 'creating' | 'released';
  createdAt: string;
  hoursUsed: number;
  monthlyCost: number;
}

export interface Quota {
  id: ID;
  tenantId: ID;
  specName: string;
  cards: number;
  usedCards: number;
  expireAt: string;
}

/* ============ 数据 ============ */
export interface DataSource {
  id: ID;
  tenantId: ID;
  name: string;
  type: 'mysql' | 'oss' | 'api' | 'file';
  host: string;
  status: 'connected' | 'error' | 'pending';
  lastSyncAt: string;
  tables: number;
}

export interface Dataset {
  id: ID;
  tenantId: ID;
  name: string;
  sourceId: ID;
  rowCount: number;
  fieldCount: number;
  version: string;
  qualityScore: number;
  updatedAt: string;
  schema: { field: string; type: string; desc: string; nullable: boolean }[];
}

export type JobStatus = 'running' | 'success' | 'failed' | 'waiting';

export interface JobOperator {
  name: string;
  costMs: number;
  status: 'success' | 'running' | 'waiting' | 'failed';
  detail: string;
}

export interface DataJob {
  id: ID;
  tenantId: ID;
  name: string;
  datasetId: ID;
  datasetName: string;
  operators: JobOperator[];
  status: JobStatus;
  progress: number;
  inputRows: number;
  outputRows: number;
  durationMs: number;
  cost: number;
  startedAt: string;
  finishedAt: string | null;
  quality: { label: string; score: number }[];
  logs: { time: string; level: 'INFO' | 'WARN' | 'ERROR'; msg: string }[];
}

/* ============ 匹配 ============ */
export interface MatchTask {
  id: ID;
  tenantId: ID;
  name: string;
  datasetA: string;
  datasetB: string;
  strategy: 'rule' | 'vector' | 'graph';
  threshold: number;
  status: JobStatus;
  totalPairs: number;
  highConf: number;
  midConf: number;
  lowConf: number;
  createdAt: string;
  reviewedCount: number;
}

export interface MatchPair {
  id: ID;
  taskId: ID;
  left: Record<string, string>;
  right: Record<string, string>;
  confidence: number;
  basis: string;
  reviewStatus: 'pending' | 'approved' | 'rejected';
}

/* ============ 生成 ============ */
export interface GenRecord {
  id: ID;
  tenantId: ID;
  modelName: string;
  template: string;
  content: string;
  units: number;
  unitLabel: string;
  cost: number;
  status: 'success' | 'failed' | 'reviewing' | 'blocked';
  createdAt: string;
  latencyMs: number;
}

/* ============ API ============ */
export interface ApiKey {
  id: ID;
  tenantId: ID;
  name: string;
  prefix: string;
  maskedKey: string;
  quotaDaily: number;
  usedToday: number;
  ipWhitelist: string[];
  status: 'active' | 'revoked';
  createdAt: string;
  lastUsedAt: string;
}

export interface ApiCallLog {
  id: ID;
  tenantId: ID;
  requestId: string;
  serviceName: string;
  apiKeyName: string;
  latencyMs: number;
  tokens: number;
  statusCode: number;
  cost: number;
  occurredAt: string;
  ip: string;
}

/* ============ 用量 ============ */
export interface UsageRecord {
  id: ID;
  tenantId: ID;
  period: string;
  serviceItemId: ID;
  serviceName: string;
  category: ServiceCategory;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  occurredAt: string;
}

/* ============ 账单 ============ */
export type BillStatus =
  | 'draft'
  | 'pending_confirm'
  | 'confirmed'
  | 'invoiced'
  | 'settled'
  | 'disputed';

export const BILL_STATUS_LABEL: Record<BillStatus, string> = {
  draft: '待出账',
  pending_confirm: '待确认',
  confirmed: '已确认',
  invoiced: '已开票',
  settled: '已回款',
  disputed: '有异议',
};

export interface BillItem {
  id: ID;
  billId: ID;
  seq: number;
  category: ServiceCategory;
  serviceName: string;
  billingMode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  remark?: string;
}

export interface Bill {
  id: ID;
  billNo: string;
  tenantId: ID;
  period: string;
  status: BillStatus;
  subtotal: number;
  discount: number;
  netAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  itemCount: number;
  generatedAt: string;
  confirmedAt: string | null;
  invoiceId: ID | null;
  paidAt: string | null;
  overdueDays: number;
}

/* ============ 发票 ============ */
export type InvoiceStatus = 'pending' | 'issued' | 'sent' | 'void';

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  pending: '待开票',
  issued: '已开票',
  sent: '已寄出',
  void: '已作废',
};

export interface Invoice {
  id: ID;
  invoiceNo: string;
  invoiceCode: string;
  tenantId: ID;
  billIds: ID[];
  period: string;
  title: string;
  taxNo: string;
  address: string;
  bankName: string;
  itemName: string;
  taxRate: number;
  amount: number;
  taxAmount: number;
  total: number;
  type: 'special' | 'normal';
  status: InvoiceStatus;
  issuedAt: string | null;
  issuedBy: string;
  payee: string;
  reviewer: string;
  drawer: string;
}

/* ============ 回款 / 合同 ============ */
export interface Payment {
  id: ID;
  tenantId: ID;
  billId: ID;
  billNo: string;
  amount: number;
  paidAt: string;
  serialNo: string;
  method: 'transfer' | 'acceptance' | 'offset';
  status: 'matched' | 'unmatched';
}

export interface Contract {
  id: ID;
  tenantId: ID;
  contractNo: string;
  name: string;
  startDate: string;
  endDate: string;
  settlementCycle: string;
  slaLevel: string;
  amount: number;
  status: 'active' | 'expiring' | 'expired';
  attachments: string[];
}

/* ============ 工单 / 公告 / 审计 ============ */
export interface Ticket {
  id: ID;
  tenantId: ID;
  tenantName: string;
  title: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'processing' | 'resolved' | 'closed';
  assignee: string;
  slaDeadline: string;
  createdAt: string;
  replies: { by: string; at: string; content: string }[];
}

export interface AuditLog {
  id: ID;
  actorName: string;
  actorRole: string;
  action: string;
  target: string;
  targetType: string;
  ip: string;
  createdAt: string;
}

export interface AlertItem {
  id: ID;
  level: 'critical' | 'warning' | 'info';
  type: string;
  message: string;
  target: string;
  status: 'firing' | 'resolved';
  createdAt: string;
}

export interface ReviewItem {
  id: ID;
  tenantName: string;
  contentType: string;
  snippet: string;
  reason: string;
  riskLevel: 'high' | 'medium' | 'low';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface DiscountRequest {
  id: ID;
  tenantName: string;
  serviceName: string;
  basePrice: number;
  requestRate: number;
  reason: string;
  applicant: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}
