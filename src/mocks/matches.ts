import type { MatchTask, MatchPair } from '@/types';

export const MATCH_TASKS: MatchTask[] = [
  {
    id: 'MT-20261028-0012',
    tenantId: 'TEN-0001',
    name: '供应商名录 × 外部工商库对齐',
    datasetA: '供应商主数据_全量',
    datasetB: '外部企业工商库_华北',
    strategy: 'vector',
    threshold: 0.7,
    status: 'success',
    totalPairs: 8240,
    highConf: 6914,
    midConf: 1082,
    lowConf: 244,
    createdAt: '2026-10-28T10:20:00',
    reviewedCount: 320,
  },
  {
    id: 'MT-20261026-0011',
    tenantId: 'TEN-0001',
    name: '客户名录与经销商去重',
    datasetA: '客户与经销商名录',
    datasetB: '客户与经销商名录',
    strategy: 'rule',
    threshold: 0.85,
    status: 'success',
    totalPairs: 2160,
    highConf: 1980,
    midConf: 148,
    lowConf: 32,
    createdAt: '2026-10-26T15:40:00',
    reviewedCount: 2160,
  },
  {
    id: 'MT-20261024-0010',
    tenantId: 'TEN-0001',
    name: '物料同义词归并匹配',
    datasetA: '物料主数据_标准版',
    datasetB: '物料主数据_标准版',
    strategy: 'graph',
    threshold: 0.75,
    status: 'success',
    totalPairs: 5420,
    highConf: 4102,
    midConf: 986,
    lowConf: 332,
    createdAt: '2026-10-24T09:12:00',
    reviewedCount: 1180,
  },
  {
    id: 'MT-20261030-0014',
    tenantId: 'TEN-0001',
    name: '新供应商资质补录匹配',
    datasetA: '供应商主数据_全量',
    datasetB: '外部企业工商库_华北',
    strategy: 'vector',
    threshold: 0.72,
    status: 'running',
    totalPairs: 0,
    highConf: 0,
    midConf: 0,
    lowConf: 0,
    createdAt: '2026-10-30T23:10:00',
    reviewedCount: 0,
  },
  {
    id: 'MT-20261020-0008',
    tenantId: 'TEN-0001',
    name: '售后工单客户实体对齐',
    datasetA: '售后工单语料',
    datasetB: '客户与经销商名录',
    strategy: 'vector',
    threshold: 0.7,
    status: 'success',
    totalPairs: 3860,
    highConf: 2940,
    midConf: 712,
    lowConf: 208,
    createdAt: '2026-10-20T13:05:00',
    reviewedCount: 3860,
  },
  {
    id: 'MT-20261016-0006',
    tenantId: 'TEN-0001',
    name: '质检批次与产线映射',
    datasetA: '产线质检记录_2026Q3',
    datasetB: '物料主数据_标准版',
    strategy: 'rule',
    threshold: 0.9,
    status: 'success',
    totalPairs: 9840,
    highConf: 9712,
    midConf: 108,
    lowConf: 20,
    createdAt: '2026-10-16T11:30:00',
    reviewedCount: 9840,
  },
  {
    id: 'MT-20261011-0004',
    tenantId: 'TEN-0001',
    name: '跨区域供应商重复识别',
    datasetA: '供应商主数据_全量',
    datasetB: '供应商主数据_全量',
    strategy: 'graph',
    threshold: 0.8,
    status: 'failed',
    totalPairs: 0,
    highConf: 0,
    midConf: 0,
    lowConf: 0,
    createdAt: '2026-10-11T16:50:00',
    reviewedCount: 0,
  },
  {
    id: 'MT-20261008-0002',
    tenantId: 'TEN-0001',
    name: '下游客户商机匹配',
    datasetA: '客户与经销商名录',
    datasetB: '外部企业工商库_华北',
    strategy: 'graph',
    threshold: 0.65,
    status: 'success',
    totalPairs: 14620,
    highConf: 8640,
    midConf: 4210,
    lowConf: 1770,
    createdAt: '2026-10-08T10:00:00',
    reviewedCount: 2400,
  },
];

const LEFT_POOL = [
  { name: '宁波精锐汽车紧固件有限公司', code: 'SUP-100238', region: '浙江·宁波', legal: '陈国栋' },
  { name: '苏州恒信精密冲压件股份有限公司', code: 'SUP-100241', region: '江苏·苏州', legal: '沈伟' },
  { name: '东莞联诚金属表面处理有限公司', code: 'SUP-100255', region: '广东·东莞', legal: '梁志强' },
  { name: '常州新程电子线束科技有限公司', code: 'SUP-100262', region: '江苏·常州', legal: '薛明' },
  { name: '青岛海卓橡塑制品有限公司', code: 'SUP-100270', region: '山东·青岛', legal: '王海涛' },
  { name: '天津中锐车用玻璃有限公司', code: 'SUP-100281', region: '天津·滨海', legal: '刘玉海' },
  { name: '重庆立航精密铸造有限公司', code: 'SUP-100294', region: '重庆·九龙坡', legal: '曾令军' },
  { name: '合肥安达汽车内饰件有限公司', code: 'SUP-100301', region: '安徽·合肥', legal: '洪涛' },
  { name: '佛山盛达涂装工程有限公司', code: 'SUP-100318', region: '广东·佛山', legal: '麦建华' },
  { name: '长春一汽配套轴承有限公司', code: 'SUP-100326', region: '吉林·长春', legal: '于洋' },
  { name: '无锡恒力弹簧制造有限公司', code: 'SUP-100334', region: '江苏·无锡', legal: '陆建平' },
  { name: '郑州宏发电子科技有限公司', code: 'SUP-100347', region: '河南·郑州', legal: '王振' },
  { name: '成都飞驰精密机械有限公司', code: 'SUP-100355', region: '四川·成都', legal: '李成' },
  { name: '温州瑞泰锁具有限公司', code: 'SUP-100362', region: '浙江·温州', legal: '郑海波' },
  { name: '烟台华阳密封件有限公司', code: 'SUP-100378', region: '山东·烟台', legal: '宋建国' },
  { name: '武汉长江模具有限公司', code: 'SUP-100385', region: '湖北·武汉', legal: '胡俊' },
];

const RIGHT_POOL = [
  { name: '宁波精锐汽车紧固件有限公司', credit: '91330206MA2AB3X41K', reg: '2009-04-16', cap: '5,000.00 万元' },
  { name: '苏州恒信精密冲压件股份有限公司', credit: '91320505MA1YQ7T62D', reg: '2011-08-22', cap: '8,600.00 万元' },
  { name: '东莞市联诚金属表面处理有限公司', credit: '91441900MA4WL9K85R', reg: '2014-03-05', cap: '1,200.00 万元' },
  { name: '常州新程电子线束科技有限公司', credit: '91320411MA1MB2N74T', reg: '2016-11-30', cap: '2,000.00 万元' },
  { name: '青岛海卓橡塑制品有限公司', credit: '91370214MA3CQ8P52H', reg: '2010-06-18', cap: '3,500.00 万元' },
  { name: '天津中锐车用玻璃科技有限公司', credit: '91120116MA06L4W33N', reg: '2013-02-27', cap: '6,800.00 万元' },
  { name: '重庆立航精密铸造有限公司', credit: '91500107MA5U8R6Q2F', reg: '2008-09-11', cap: '4,200.00 万元' },
  { name: '合肥安达汽车内饰件有限公司', credit: '91340100MA2RX9T15M', reg: '2015-05-19', cap: '1,800.00 万元' },
  { name: '佛山市盛达涂装工程有限公司', credit: '91440605MA51K7Y48P', reg: '2012-12-03', cap: '900.00 万元' },
  { name: '长春一汽配套轴承有限公司', credit: '91220101MA0Y3L7N9C', reg: '2006-07-14', cap: '12,000.00 万元' },
  { name: '无锡恒力弹簧制造有限公司', credit: '91320214MA1XP5R63B', reg: '2010-10-08', cap: '2,600.00 万元' },
  { name: '郑州宏发电子科技有限公司', credit: '91410100MA3X8N2K7D', reg: '2017-04-21', cap: '1,500.00 万元' },
  { name: '成都飞驰精密机械有限公司', credit: '91510100MA6C2W9K3T', reg: '2013-09-26', cap: '3,100.00 万元' },
  { name: '温州市瑞泰锁具有限公司', credit: '91330304MA2A6Q7L5P', reg: '2011-01-17', cap: '2,200.00 万元' },
  { name: '烟台华阳密封件有限公司', credit: '91370600MA3D8R4N2M', reg: '2009-11-09', cap: '4,800.00 万元' },
  { name: '武汉长江模具有限公司', credit: '91420100MA4KX8P35D', reg: '2007-03-22', cap: '9,300.00 万元' },
];

const BASIS = [
  '统一社会信用代码完全一致 + 名称相似度 0.98',
  '统一社会信用代码完全一致',
  '名称相似度 0.96 + 注册地一致 + 法定代表人一致',
  '名称相似度 0.88 + 注册地一致',
  '统一社会信用代码一致（尾号校验通过）',
  '名称相似度 0.82 + 注册资本一致',
  '法定代表人一致 + 注册地一致',
];

const pairs: MatchPair[] = [];
for (let i = 0; i < 80; i++) {
  const L = LEFT_POOL[i % LEFT_POOL.length];
  const R = RIGHT_POOL[i % RIGHT_POOL.length];
  const base = 0.62 + ((i * 17) % 37) / 100;
  const confidence = Math.min(0.997, Math.round(base * 1000) / 1000);
  pairs.push({
    id: `MP-${String(i + 1).padStart(3, '0')}`,
    taskId: 'MT-20261028-0012',
    left: { 名称: L.name, 编码: L.code, 注册地: L.region, 法定代表人: L.legal },
    right: { 企业名称: R.name, 统一社会信用代码: R.credit, 成立日期: R.reg, 注册资本: R.cap },
    confidence,
    basis: BASIS[i % BASIS.length],
    reviewStatus: i < 12 ? 'approved' : 'pending',
  });
}

export const MATCH_PAIRS = pairs;

export function pairsOf(taskId: string): MatchPair[] {
  return MATCH_PAIRS.filter((p) => p.taskId === taskId);
}

export function tasksOf(tenantId: string): MatchTask[] {
  return MATCH_TASKS.filter((t) => t.tenantId === tenantId);
}

/** 匹配效果趋势 */
export const MATCH_TREND = [
  { week: 'W36', recall: 0.86, precision: 0.91, approve: 0.88 },
  { week: 'W37', recall: 0.88, precision: 0.92, approve: 0.89 },
  { week: 'W38', recall: 0.87, precision: 0.93, approve: 0.9 },
  { week: 'W39', recall: 0.9, precision: 0.93, approve: 0.91 },
  { week: 'W40', recall: 0.91, precision: 0.94, approve: 0.92 },
  { week: 'W41', recall: 0.92, precision: 0.95, approve: 0.93 },
  { week: 'W42', recall: 0.93, precision: 0.95, approve: 0.94 },
  { week: 'W43', recall: 0.94, precision: 0.96, approve: 0.95 },
];
