import type {
  ContractStatus,
  EvidenceStatus,
  EvidenceType,
  JudicialStatus,
  JudicialType,
  RightsCategory,
  RightsStatus,
  RoleCode,
  TxType,
} from '@/types';

export type Tone = 'cyan' | 'blue' | 'violet' | 'green' | 'amber' | 'red' | 'gray';

export const TONE_STYLE: Record<Tone, { color: string; bg: string; border: string }> = {
  cyan: { color: '#7FE7F5', bg: 'rgba(34,211,238,0.12)', border: 'rgba(34,211,238,0.28)' },
  blue: { color: '#9CC2FF', bg: 'rgba(61,125,255,0.13)', border: 'rgba(61,125,255,0.3)' },
  violet: { color: '#C4B5FD', bg: 'rgba(139,92,246,0.14)', border: 'rgba(139,92,246,0.3)' },
  green: { color: '#6EE7C7', bg: 'rgba(45,212,167,0.12)', border: 'rgba(45,212,167,0.28)' },
  amber: { color: '#F7CB7A', bg: 'rgba(245,181,68,0.12)', border: 'rgba(245,181,68,0.28)' },
  red: { color: '#FF9AAD', bg: 'rgba(255,92,122,0.12)', border: 'rgba(255,92,122,0.3)' },
  gray: { color: '#9AA8BF', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' },
};

export const EVIDENCE_TYPE: Record<EvidenceType, { label: string; tone: Tone; ext: string }> = {
  document: { label: '文档', tone: 'blue', ext: 'PDF / DOCX' },
  image: { label: '图片', tone: 'violet', ext: 'JPG / PNG' },
  video: { label: '视频', tone: 'cyan', ext: 'MP4 / MOV' },
  audio: { label: '音频', tone: 'green', ext: 'WAV / MP3' },
  code: { label: '代码', tone: 'amber', ext: 'ZIP / TAR' },
  webpage: { label: '网页', tone: 'blue', ext: 'HTML' },
  design: { label: '设计稿', tone: 'violet', ext: 'PSD / AI' },
  dataset: { label: '数据集', tone: 'cyan', ext: 'JSONL / CSV' },
  text: { label: '文本', tone: 'gray', ext: 'TXT' },
};

export const EVIDENCE_STATUS: Record<EvidenceStatus, { label: string; tone: Tone }> = {
  pending: { label: '待上链', tone: 'gray' },
  confirming: { label: '确认中', tone: 'amber' },
  confirmed: { label: '已确认', tone: 'green' },
  failed: { label: '上链失败', tone: 'red' },
  revoked: { label: '已撤销', tone: 'gray' },
};

export const RIGHTS_CATEGORY: Record<RightsCategory, { label: string; short: string; tone: Tone }> = {
  copyright: { label: '著作权', short: '著作权', tone: 'blue' },
  patent: { label: '专利权', short: '专利', tone: 'violet' },
  trademark: { label: '商标权', short: '商标', tone: 'amber' },
  software: { label: '软件著作权', short: '软著', tone: 'cyan' },
  data_asset: { label: '数据资产', short: '数据资产', tone: 'green' },
  trade_secret: { label: '商业秘密', short: '商业秘密', tone: 'gray' },
};

export const RIGHTS_STATUS: Record<RightsStatus, { label: string; tone: Tone }> = {
  draft: { label: '草稿', tone: 'gray' },
  reviewing: { label: '审核中', tone: 'amber' },
  registered: { label: '已登记', tone: 'cyan' },
  disputed: { label: '有异议', tone: 'red' },
  transferred: { label: '已转让', tone: 'violet' },
  revoked: { label: '已撤销', tone: 'gray' },
};

export const CONTRACT_STATUS: Record<ContractStatus, { label: string; tone: Tone }> = {
  draft: { label: '草稿', tone: 'gray' },
  pending: { label: '待发起', tone: 'gray' },
  signing: { label: '签署中', tone: 'amber' },
  completed: { label: '已完成', tone: 'green' },
  cancelled: { label: '已撤销', tone: 'gray' },
  expired: { label: '已过期', tone: 'red' },
};

export const JUDICIAL_TYPE: Record<JudicialType, { label: string; price: number; days: string }> = {
  notary: { label: '公证书', price: 1200, days: '5–7 个工作日' },
  appraisal: { label: '司法鉴定意见书', price: 3800, days: '7–15 个工作日' },
  report: { label: '区块链存证报告', price: 680, days: '1–2 个工作日' },
};

export const JUDICIAL_STATUS: Record<JudicialStatus, { label: string; tone: Tone }> = {
  submitted: { label: '已提交', tone: 'gray' },
  reviewing: { label: '材料初审', tone: 'amber' },
  accepted: { label: '机构受理', tone: 'blue' },
  issued: { label: '已出具', tone: 'green' },
  delivered: { label: '已寄送', tone: 'cyan' },
};

export const TX_TYPE: Record<TxType, { label: string; tone: Tone }> = {
  evidence: { label: '存证上链', tone: 'cyan' },
  rights: { label: '权属确权', tone: 'blue' },
  contract: { label: '合同存证', tone: 'violet' },
  license: { label: '授权许可', tone: 'green' },
  asset: { label: '资产登记', tone: 'amber' },
  other: { label: '其他', tone: 'gray' },
};

export const ROLE_META: Record<RoleCode, { label: string; desc: string; tone: Tone }> = {
  platform_admin: { label: '平台运营', desc: '全平台数据与链上治理权限', tone: 'violet' },
  org_admin: { label: '企业管理员', desc: '本组织全部业务与账单权限', tone: 'blue' },
  creator: { label: '创作者', desc: '仅管理本人创建的资产与记录', tone: 'cyan' },
  legal: { label: '法务 / 维权', desc: '取证、出证与合同签署权限', tone: 'amber' },
  auditor: { label: '审核员', desc: '权属审核与异议处理权限', tone: 'green' },
  viewer: { label: '只读访客', desc: '全部数据只读', tone: 'gray' },
};

export const ORGS = [
  '杭州拾光文创有限公司',
  '北京云枢数据科技有限公司',
  '上海砚山文化传播有限公司',
  '深圳前海数元信息技术有限公司',
  '成都锦官城动漫设计工作室',
  '广州南澜品牌管理有限公司',
  '苏州墨白建筑设计事务所有限公司',
  '南京千帆教育科技有限公司',
];

export const PERSONS = [
  '陈默',
  '林知远',
  '苏念',
  '周砚',
  '许清和',
  '沈亦舟',
  '顾南枝',
  '程屿',
  '宋清野',
  '叶怀山',
];

export const RIGHT_SCOPES = [
  '复制权',
  '发行权',
  '信息网络传播权',
  '改编权',
  '汇编权',
  '放映权',
  '展览权',
  '翻译权',
];

export const DEPARTMENTS = ['内容中心', '法务合规部', '品牌市场部', '技术研发部', '数据运营部', '财务部'];

export const EVIDENCE_TAGS = [
  '版权',
  '原创',
  '设计稿',
  '商用素材',
  '核心资产',
  '季度归档',
  '重点作品',
  '客户交付',
  '内部审计',
];

export const SUB_CATEGORIES: Record<RightsCategory, string[]> = {
  copyright: ['文字作品', '美术作品', '摄影作品', '视听作品', '音乐作品', '图形作品'],
  patent: ['发明专利', '实用新型', '外观设计'],
  trademark: ['第 9 类', '第 35 类', '第 41 类', '第 42 类'],
  software: ['应用软件', '嵌入式软件', '系统软件'],
  data_asset: ['数据集', '数据模型', '数据产品'],
  trade_secret: ['技术秘密', '经营秘密'],
};

export const NODE_LIST = [
  { id: 'n1', name: '北京主节点', region: '北京', role: 'consensus' as const },
  { id: 'n2', name: '杭州共识节点', region: '杭州', role: 'consensus' as const },
  { id: 'n3', name: '深圳共识节点', region: '深圳', role: 'consensus' as const },
  { id: 'n4', name: '成都共识节点', region: '成都', role: 'consensus' as const },
  { id: 'n5', name: '贵阳灾备节点', region: '贵阳', role: 'backup' as const },
  { id: 'n6', name: '司法鉴定中心节点', region: '北京', role: 'observer' as const },
  { id: 'n7', name: '杭州西湖公证处节点', region: '杭州', role: 'observer' as const },
];

export const CONTRACT_TEMPLATES = [
  {
    id: 'tpl-01',
    name: '作品著作权转让合同',
    category: '版权转让',
    desc: '适用于原创作品著作权全部或部分权利转让，含权利范围、对价与违约责任条款。',
    usage: 128,
    updatedAt: '2026-09-18',
  },
  {
    id: 'tpl-02',
    name: '作品授权许可使用合同',
    category: '授权许可',
    desc: '约定独占 / 排他 / 普通许可类型、使用地域、期限与分成方式。',
    usage: 246,
    updatedAt: '2026-09-02',
  },
  {
    id: 'tpl-03',
    name: '数据资产授权使用协议',
    category: '数据授权',
    desc: '面向数据资产使用方的授权协议，明确使用目的、范围与二次分发限制。',
    usage: 87,
    updatedAt: '2026-08-27',
  },
  {
    id: 'tpl-04',
    name: '保密协议（NDA）',
    category: '保密',
    desc: '双向保密协议，适用于项目合作、素材交付前的保密约定。',
    usage: 312,
    updatedAt: '2026-07-14',
  },
  {
    id: 'tpl-05',
    name: '委托创作合同',
    category: '创作委托',
    desc: '约定委托创作成果的权属归属、验收标准与付款节点。',
    usage: 164,
    updatedAt: '2026-09-25',
  },
  {
    id: 'tpl-06',
    name: '侵权和解协议',
    category: '争议解决',
    desc: '针对已发生的侵权事实，约定停止侵害、赔偿与道歉方式。',
    usage: 42,
    updatedAt: '2026-06-30',
  },
  {
    id: 'tpl-07',
    name: '知识产权服务协议',
    category: '服务',
    desc: '平台存证、确权、取证等技术服务的服务条款与 SLA 约定。',
    usage: 198,
    updatedAt: '2026-10-08',
  },
  {
    id: 'tpl-08',
    name: '数据合规承诺书',
    category: '合规',
    desc: '数据来源合法性、脱敏处理与使用边界的单方承诺文件。',
    usage: 73,
    updatedAt: '2026-08-11',
  },
];

export const API_ENDPOINTS = [
  { method: 'POST', path: '/v1/evidence', name: '创建存证', qps: 20, desc: '提交文件哈希与元数据，返回存证编号与交易哈希' },
  { method: 'GET', path: '/v1/evidence/{id}', name: '查询存证', qps: 50, desc: '按存证编号查询存证详情与链上状态' },
  { method: 'POST', path: '/v1/evidence/batch', name: '批量存证', qps: 5, desc: '单次最多 100 条，异步返回批次号' },
  { method: 'POST', path: '/v1/verify/hash', name: '哈希核验', qps: 50, desc: '校验文件哈希是否已存在于链上' },
  { method: 'POST', path: '/v1/rights', name: '权属登记', qps: 10, desc: '提交权属登记申请，需先完成实名认证' },
  { method: 'POST', path: '/v1/contract', name: '发起合同', qps: 10, desc: '基于模板创建合同并发起签署流程' },
  { method: 'POST', path: '/v1/forensics/web', name: '网页取证', qps: 5, desc: '创建网页取证任务，异步回调取证结果' },
  { method: 'POST', path: '/v1/judicial', name: '出证申请', qps: 3, desc: '基于证据包申请公证书或鉴定意见书' },
];

export const ACTION_LABELS: Record<string, string> = {
  login: '登录系统',
  evidence_create: '创建存证',
  evidence_revoke: '撤销存证',
  rights_register: '登记权属',
  rights_transfer: '转让权属',
  rights_review: '审核权属',
  contract_sign: '签署合同',
  contract_create: '发起合同',
  forensics_create: '发起取证',
  judicial_create: '申请出证',
  member_invite: '邀请成员',
  member_disable: '停用成员',
  key_create: '创建密钥',
  key_disable: '禁用密钥',
  export: '导出数据',
};
