import type {
  Asset,
  AppNotification,
  AuditLog,
  Client,
  ConvertParams,
  IssueFrame,
  Job,
  JobLog,
  JobStage,
  JobStatus,
  Node,
  Order,
  OrderStatus,
  OutputFormat,
  Preset,
  Project,
  ProjectStatus,
  QaMetrics,
  TeamMember,
  Ticket,
  TicketPriority,
  TicketStatus,
} from '../types'
import { STAGE_META, ERROR_LIBRARY } from '../lib/constants'
import { estimateSeconds, jobCost, orderTotals, weightedProgress } from '../lib/calc'
import { addDays, addMinutes, at, chance, float, int, NOW, pick, rnd } from './seed'

/* ------------------------------------------------------------------ 客户 */

export const clients: Client[] = [
  {
    id: 'cli_001',
    name: '星野文化传媒（北京）有限公司',
    shortName: '星野文化',
    industry: '纪录片',
    level: 'strategic',
    contact: { name: '罗静', title: '制片总监', phone: '138 0112 8801', email: 'luojing@xingye-media.cn' },
    address: '北京市朝阳区建国路 88 号 SOHO 现代城 B 座 2103',
    taxNo: '91110105MA01K7X23F',
    paymentTermDays: 45,
    since: '2023-04-18',
    stats: { projects: 0, deliveredMinutes: 0, totalSpendCNY: 0, openTickets: 0 },
    tags: ['4K 修复', '年度框架', '长期合作'],
    note: '年度框架客户，季度结算，每批次交付需附质检报告。',
  },
  {
    id: 'cli_002',
    name: '蓝湾影视制作有限公司',
    shortName: '蓝湾影视',
    industry: '广告',
    level: 'key',
    contact: { name: '韩沐', title: '后期总监', phone: '139 2201 7745', email: 'hanmu@bluebay-film.com' },
    address: '上海市静安区南京西路 1266 号恒隆广场 2 期 18 层',
    taxNo: '91310106MA1FY9K72B',
    paymentTermDays: 30,
    since: '2024-01-09',
    stats: { projects: 0, deliveredMinutes: 0, totalSpendCNY: 0, openTickets: 0 },
    tags: ['TVC', '加急多'],
  },
  {
    id: 'cli_003',
    name: '云图数字科技（上海）有限公司',
    shortName: '云图数字',
    industry: '展陈',
    level: 'key',
    contact: { name: '张一舟', title: '技术负责人', phone: '137 6120 3391', email: 'zhangyz@yuntu-digital.com' },
    address: '上海市徐汇区龙腾大道 2555 号西岸智塔 12 层',
    taxNo: '91310104MA1FR2P88N',
    paymentTermDays: 30,
    since: '2023-09-22',
    stats: { projects: 0, deliveredMinutes: 0, totalSpendCNY: 0, openTickets: 0 },
    tags: ['环幕', '展馆大屏'],
  },
  {
    id: 'cli_004',
    name: '启明教育科技有限公司',
    shortName: '启明教育',
    industry: '教育',
    level: 'normal',
    contact: { name: '李珊', title: '内容中心主管', phone: '186 1188 2043', email: 'lishan@qiming-edu.cn' },
    address: '北京市海淀区中关村大街 27 号 1 号楼 9 层',
    taxNo: '91110108MA01P4T51C',
    paymentTermDays: 30,
    since: '2024-06-11',
    stats: { projects: 0, deliveredMinutes: 0, totalSpendCNY: 0, openTickets: 0 },
    tags: ['课程内容', '批量交付'],
  },
  {
    id: 'cli_005',
    name: '山海文旅集团股份有限公司',
    shortName: '山海文旅',
    industry: '文旅',
    level: 'strategic',
    contact: { name: '王峻', title: '数字内容部部长', phone: '135 8890 6612', email: 'wangjun@shanhai-tourism.com' },
    address: '杭州市西湖区文三路 90 号东部软件园 6 号楼',
    taxNo: '91330106MA2B7YQ34K',
    paymentTermDays: 60,
    since: '2022-11-03',
    stats: { projects: 0, deliveredMinutes: 0, totalSpendCNY: 0, openTickets: 0 },
    tags: ['沉浸剧场', '现场驻场', '战略合作'],
    note: '含驻场技术支援条款，现场问题 4 小时内响应。',
  },
  {
    id: 'cli_006',
    name: '光屿视觉工作室',
    shortName: '光屿视觉',
    industry: '广告',
    level: 'normal',
    contact: { name: '赵可', title: '创始人', phone: '188 0162 9930', email: 'zhaoke@lightisle.studio' },
    address: '广州市天河区珠江新城华夏路 16 号 2806',
    taxNo: '91440101MA5CJ7L29Q',
    paymentTermDays: 15,
    since: '2025-03-27',
    stats: { projects: 0, deliveredMinutes: 0, totalSpendCNY: 0, openTickets: 0 },
    tags: ['短片', '快周转'],
  },
  {
    id: 'cli_007',
    name: '国家地理中文版编辑部',
    shortName: '国家地理中文版',
    industry: '纪录片',
    level: 'key',
    contact: { name: '孙宁', title: '影像主编', phone: '136 0103 5528', email: 'sunning@ngchina.com.cn' },
    address: '北京市东城区东长安街 1 号东方广场 W2 座 11 层',
    taxNo: '91110101MA001M8X4R',
    paymentTermDays: 45,
    since: '2023-02-14',
    stats: { projects: 0, deliveredMinutes: 0, totalSpendCNY: 0, openTickets: 0 },
    tags: ['8K', '自然题材', '高标准'],
  },
  {
    id: 'cli_008',
    name: '拾光纪录文化传播有限公司',
    shortName: '拾光纪录',
    industry: '纪录片',
    level: 'normal',
    contact: { name: '周立', title: '制片人', phone: '133 6654 7712', email: 'zhouli@shiguang-doc.com' },
    address: '成都市武侯区天府大道中段 666 号 2 栋 1704',
    taxNo: '91510107MA6CQ3W21D',
    paymentTermDays: 30,
    since: '2024-08-05',
    stats: { projects: 0, deliveredMinutes: 0, totalSpendCNY: 0, openTickets: 0 },
    tags: ['非遗', '系列短片'],
  },
  {
    id: 'cli_009',
    name: '未末文化演艺有限公司',
    shortName: '未末文化',
    industry: '演出',
    level: 'normal',
    contact: { name: '吴桐', title: '项目经理', phone: '185 2109 4478', email: 'wutong@weimo-live.com' },
    address: '上海市黄浦区西藏南路 1200 号 5 层',
    taxNo: '91310101MA1G6R8T3P',
    paymentTermDays: 30,
    since: '2023-12-01',
    stats: { projects: 0, deliveredMinutes: 0, totalSpendCNY: 0, openTickets: 0 },
    tags: ['现场回放', '低照度'],
  },
  {
    id: 'cli_010',
    name: '澄明博物馆数字化中心',
    shortName: '澄明博物馆',
    industry: '展陈',
    level: 'key',
    contact: { name: '郑楠', title: '数字化中心副主任', phone: '137 7712 6634', email: 'zhengnan@chengming-museum.org' },
    address: '南京市玄武区中山东路 321 号',
    taxNo: '12320100MB1K7C8X2L',
    paymentTermDays: 60,
    since: '2024-04-16',
    stats: { projects: 0, deliveredMinutes: 0, totalSpendCNY: 0, openTickets: 0 },
    tags: ['文物题材', '高精度'],
  },
  {
    id: 'cli_011',
    name: '星轨互动娱乐有限公司',
    shortName: '星轨互动',
    industry: '演出',
    level: 'normal',
    contact: { name: '钱伟', title: '内容制作负责人', phone: '189 2288 1105', email: 'qianwei@stargate-ent.cn' },
    address: '深圳市南山区科苑南路 2666 号 3 栋 12 层',
    taxNo: '91440300MA5FQ2H76Y',
    paymentTermDays: 30,
    since: '2025-07-08',
    stats: { projects: 0, deliveredMinutes: 0, totalSpendCNY: 0, openTickets: 0 },
    tags: ['主题乐园', 'CG 混合'],
  },
  {
    id: 'cli_012',
    name: '甲乙丙丁品牌咨询有限公司',
    shortName: '甲乙丙丁',
    industry: '广告',
    level: 'normal',
    contact: { name: '冯佳', title: '客户总监', phone: '132 8890 5561', email: 'fengjia@jybc-brand.com' },
    address: '上海市长宁区愚园路 1258 号 4 层',
    taxNo: '91310105MA1FL9Q62E',
    paymentTermDays: 30,
    since: '2025-05-20',
    stats: { projects: 0, deliveredMinutes: 0, totalSpendCNY: 0, openTickets: 0 },
    tags: ['品牌片'],
  },
]

/* ------------------------------------------------------------------ 团队 */

export const team: TeamMember[] = [
  { id: 'usr_001', name: '陈知远', role: '制片', email: 'chenzhiyuan@spacescape.io', phone: '138 0013 2201', online: true, jobsToday: 4, avatarHue: 214 },
  { id: 'usr_002', name: '林澈', role: '制片', email: 'linche@spacescape.io', phone: '139 0087 4412', online: true, jobsToday: 3, avatarHue: 262 },
  { id: 'usr_003', name: '唐未', role: '制片', email: 'tangwei@spacescape.io', phone: '137 1120 9083', online: false, jobsToday: 1, avatarHue: 190 },
  { id: 'usr_004', name: '周予安', role: '操作员', email: 'zhouyuan@spacescape.io', phone: '186 2231 7742', online: true, jobsToday: 8, avatarHue: 152 },
  { id: 'usr_005', name: '苏见川', role: '操作员', email: 'sujianchuan@spacescape.io', phone: '185 6612 3390', online: true, jobsToday: 6, avatarHue: 24 },
  { id: 'usr_006', name: '何叙', role: '操作员', email: 'hexu@spacescape.io', phone: '133 4408 1126', online: false, jobsToday: 2, avatarHue: 340 },
  { id: 'usr_007', name: '沈暮', role: '操作员', email: 'shenmu@spacescape.io', phone: '135 7781 2244', online: true, jobsToday: 5, avatarHue: 46 },
  { id: 'usr_008', name: '白榆', role: '操作员', email: 'baiyu@spacescape.io', phone: '188 9902 3315', online: true, jobsToday: 7, avatarHue: 288 },
  { id: 'usr_009', name: '顾清和', role: '管理员', email: 'guqinghe@spacescape.io', phone: '136 0011 8890', online: true, jobsToday: 2, avatarHue: 206 },
  { id: 'usr_010', name: '程野', role: '管理员', email: 'chengye@spacescape.io', phone: '130 2244 6671', online: false, jobsToday: 0, avatarHue: 12 },
  { id: 'usr_011', name: '许砚', role: '操作员', email: 'xuyan@spacescape.io', phone: '131 5566 2038', online: true, jobsToday: 3, avatarHue: 108 },
  { id: 'usr_012', name: '温以宁', role: '只读', email: 'wenyining@spacescape.io', phone: '150 3322 7781', online: false, jobsToday: 0, avatarHue: 320 },
]

/* ------------------------------------------------------------------ 预设 */

const baseParams: ConvertParams = {
  depthModel: 'SpaceScape-Depth V3',
  disparity: 45,
  convergence: 0,
  temporalSmooth: 70,
  edgePreserve: 60,
  depthDetail: 55,
  faceProtect: true,
  deflicker: true,
}

export const presets: Preset[] = [
  {
    id: 'prs_001',
    name: '纪录片柔和平移',
    scene: '纪录片 / 访谈',
    desc: '克制的视差与强时域平滑，适合长镜头与人物访谈，优先保证观看舒适度。',
    params: { ...baseParams, disparity: 38, convergence: -4, temporalSmooth: 82, edgePreserve: 68, depthDetail: 48 },
    isDefault: true,
    usageCount: 68,
    createdAt: at(180, 10, 12),
    updatedAt: at(21, 15, 40),
  },
  {
    id: 'prs_002',
    name: '广告强出屏',
    scene: 'TVC / 品牌片',
    desc: '高视差、前置收敛，强调主体出屏冲击力，需配合质检逐帧确认窗口违规。',
    params: { ...baseParams, disparity: 72, convergence: 12, temporalSmooth: 58, edgePreserve: 74, depthDetail: 66, faceProtect: true },
    isDefault: false,
    usageCount: 41,
    createdAt: at(164, 9, 30),
    updatedAt: at(12, 11, 5),
  },
  {
    id: 'prs_003',
    name: '展陈大屏沉浸',
    scene: '展馆 / 环幕',
    desc: '针对 6 米以上观看距离优化，允许更大的负视差，突出纵深感。',
    params: { ...baseParams, disparity: 64, convergence: -14, temporalSmooth: 74, edgePreserve: 62, depthDetail: 60 },
    isDefault: false,
    usageCount: 33,
    createdAt: at(150, 14, 0),
    updatedAt: at(30, 16, 20),
  },
  {
    id: 'prs_004',
    name: '人物特写保护',
    scene: '访谈 / 剧情',
    desc: '人脸与发丝区域强制深度引导，降低边缘撕裂，视差上限受限。',
    params: { ...baseParams, disparity: 32, convergence: 2, temporalSmooth: 88, edgePreserve: 86, depthDetail: 42, faceProtect: true },
    isDefault: false,
    usageCount: 27,
    createdAt: at(138, 11, 15),
    updatedAt: at(8, 10, 2),
  },
  {
    id: 'prs_005',
    name: '风景深景深',
    scene: '自然 / 航拍',
    desc: '保留远景层次，深度细节拉满，适合大景别航拍与自然题材。',
    params: { ...baseParams, disparity: 56, convergence: -8, temporalSmooth: 66, edgePreserve: 54, depthDetail: 78, deflicker: true },
    isDefault: false,
    usageCount: 22,
    createdAt: at(120, 16, 45),
    updatedAt: at(26, 9, 18),
  },
  {
    id: 'prs_006',
    name: '快速预览（低质）',
    scene: '内部审片',
    desc: '降采样深度推理，速度快 4 倍，仅用于客户确认构图与视差意图。',
    params: { ...baseParams, depthModel: 'SpaceScape-Depth V2 Lite', disparity: 45, temporalSmooth: 40, edgePreserve: 30, depthDetail: 32 },
    isDefault: false,
    usageCount: 96,
    createdAt: at(200, 10, 0),
    updatedAt: at(45, 14, 12),
  },
  {
    id: 'prs_007',
    name: '8K 影院级',
    scene: '影院 / 高端交付',
    desc: '8K 双视图全流程，深度模型使用 DepthPro，编码码率不低于 400 Mbps。',
    params: { ...baseParams, depthModel: 'DepthPro-Studio', disparity: 52, convergence: -2, temporalSmooth: 80, edgePreserve: 78, depthDetail: 84 },
    isDefault: false,
    usageCount: 9,
    createdAt: at(96, 9, 20),
    updatedAt: at(15, 17, 30),
  },
  {
    id: 'prs_008',
    name: '演唱会广角',
    scene: '演出 / 现场',
    desc: '针对低照度与大量舞台灯光优化，启用去闪烁与强边缘保护。',
    params: { ...baseParams, disparity: 60, convergence: -6, temporalSmooth: 76, edgePreserve: 80, depthDetail: 50, deflicker: true },
    isDefault: false,
    usageCount: 18,
    createdAt: at(74, 20, 10),
    updatedAt: at(5, 13, 44),
  },
]

/* ------------------------------------------------------------------ 项目 */

type ProjectSeed = {
  id: string
  name: string
  clientId: string
  type: Project['type']
  status: ProjectStatus
  ownerId: string
  minutes: number
  budget: number
  progress: number
  description: string
}

const projectSeeds: ProjectSeed[] = [
  {
    id: 'prj_001',
    name: '《山河故人》4K 修复空间化',
    clientId: 'cli_001',
    type: '纪录片',
    status: 'active',
    ownerId: 'usr_001',
    minutes: 86,
    budget: 36000,
    progress: 62,
    description: '12 集人文纪录片，已完成 4K 修复，需逐集转为 MV-HEVC 空间版本，用于 Vision Pro 点映。',
  },
  {
    id: 'prj_002',
    name: '丝路数字展陈 A 厅环幕',
    clientId: 'cli_003',
    type: '展陈',
    status: 'active',
    ownerId: 'usr_002',
    minutes: 42,
    budget: 18000,
    progress: 74,
    description: 'A 厅 270° 环幕，6 台投影融合，需按环幕视锥重新计算视差与收敛面。',
  },
  {
    id: 'prj_003',
    name: '「溯」汽车品牌 TVC 空间版',
    clientId: 'cli_002',
    type: '广告',
    status: 'pending_acceptance',
    ownerId: 'usr_001',
    minutes: 3,
    budget: 8600,
    progress: 96,
    description: '60s + 30s + 15s 三版 TVC，强调车身线条出屏，客户要求窗口违规帧为零。',
  },
  {
    id: 'prj_004',
    name: '非遗手作系列短片 12 集',
    clientId: 'cli_008',
    type: '纪录片',
    status: 'active',
    ownerId: 'usr_003',
    minutes: 96,
    budget: 42000,
    progress: 48,
    description: '每集 8 分钟，大量手部特写与浅景深，需启用人物特写保护预设。',
  },
  {
    id: 'prj_005',
    name: '山海经沉浸剧场 180°',
    clientId: 'cli_005',
    type: '文旅',
    status: 'active',
    ownerId: 'usr_002',
    minutes: 128,
    budget: 96000,
    progress: 35,
    description: '180° 沉浸剧场，含 CG 与实拍混合素材，需统一深度尺度，避免 CG 段视差跳变。',
  },
  {
    id: 'prj_006',
    name: '「回声」音乐现场 VR 回放',
    clientId: 'cli_009',
    type: '演出',
    status: 'delivered',
    ownerId: 'usr_001',
    minutes: 74,
    budget: 28000,
    progress: 100,
    description: '低照度多机位现场，已完成交付，客户追加 4 条短视频剪辑版本。',
  },
  {
    id: 'prj_007',
    name: '中学地理课程立体化',
    clientId: 'cli_004',
    type: '教育',
    status: 'delivered',
    ownerId: 'usr_003',
    minutes: 210,
    budget: 58000,
    progress: 100,
    description: '36 节课程，标准化批量转换，统一参数预设，交付含质检报告。',
  },
  {
    id: 'prj_008',
    name: '城市影像档案 2026',
    clientId: 'cli_007',
    type: '纪录片',
    status: 'delivered',
    ownerId: 'usr_002',
    minutes: 156,
    budget: 72000,
    progress: 100,
    description: '含 1990 年代胶片扫描素材，扫描件存在抖动与划痕，需先做稳定化处理。',
  },
  {
    id: 'prj_009',
    name: '澄明博物馆「宋韵」常设展',
    clientId: 'cli_010',
    type: '展陈',
    status: 'active',
    ownerId: 'usr_001',
    minutes: 56,
    budget: 24000,
    progress: 58,
    description: '文物特写为主，要求极低视差、零窗口违规，保证近距离观看不眩晕。',
  },
  {
    id: 'prj_010',
    name: '星轨「银河」主题乐园预告',
    clientId: 'cli_011',
    type: '演出',
    status: 'active',
    ownerId: 'usr_003',
    minutes: 12,
    budget: 9600,
    progress: 66,
    description: 'CG 与实拍混合，需匹配乐园球幕投影比例。',
  },
  {
    id: 'prj_011',
    name: '光屿 × 美妆品牌 15s 空间广告',
    clientId: 'cli_006',
    type: '广告',
    status: 'active',
    ownerId: 'usr_002',
    minutes: 6,
    budget: 4800,
    progress: 72,
    description: '产品微距特写，需强出屏效果，客户已确认首版视差强度。',
  },
  {
    id: 'prj_012',
    name: '甲乙丙丁 年度品牌片',
    clientId: 'cli_012',
    type: '广告',
    status: 'pending_acceptance',
    ownerId: 'usr_001',
    minutes: 18,
    budget: 12600,
    progress: 92,
    description: '3 分钟品牌片 + 6 条竖版切条，竖版需单独重算视差。',
  },
  {
    id: 'prj_013',
    name: '山海文旅「夜游」投影秀',
    clientId: 'cli_005',
    type: '文旅',
    status: 'delivered',
    ownerId: 'usr_003',
    minutes: 48,
    budget: 32000,
    progress: 100,
    description: '户外建筑投影，已交付，现场调试由驻场工程师完成。',
  },
  {
    id: 'prj_014',
    name: '星野「极地」纪录片 8K 版',
    clientId: 'cli_001',
    type: '纪录片',
    status: 'delivered',
    ownerId: 'usr_002',
    minutes: 112,
    budget: 84000,
    progress: 100,
    description: '8K 原生素材，双视图码率 420 Mbps，交付至客户自有存储。',
  },
  {
    id: 'prj_015',
    name: '启明「化学实验」教学片',
    clientId: 'cli_004',
    type: '教育',
    status: 'on_hold',
    ownerId: 'usr_003',
    minutes: 64,
    budget: 16800,
    progress: 22,
    description: '客户脚本调整中，已暂停。已完成部分保留在队列外。',
  },
  {
    id: 'prj_016',
    name: '蓝湾 汽车发布会 空间直播回放',
    clientId: 'cli_002',
    type: '广告',
    status: 'archived',
    ownerId: 'usr_001',
    minutes: 26,
    budget: 14400,
    progress: 100,
    description: '直播信号录制后转制，含 5.1 声道空间音频混音。',
  },
  {
    id: 'prj_017',
    name: '云图 城市大脑展示中心',
    clientId: 'cli_003',
    type: '展陈',
    status: 'draft',
    ownerId: 'usr_002',
    minutes: 30,
    budget: 12000,
    progress: 0,
    description: '方案阶段，等待客户确认屏幕参数与观看距离。',
  },
  {
    id: 'prj_018',
    name: '国家地理「深海」短片',
    clientId: 'cli_007',
    type: '纪录片',
    status: 'draft',
    ownerId: 'usr_003',
    minutes: 22,
    budget: 16000,
    progress: 0,
    description: '水下素材，蓝绿通道衰减严重，需先做色彩校正再估算深度。',
  },
]

const milestoneNames = ['素材接收与技审', '首批样片确认', '全量交付与验收']

export const projects: Project[] = projectSeeds.map((p, i) => {
  const code = `PRJ-2026-${String(18 - i).padStart(3, '0')}`
  const isDone = p.status === 'delivered' || p.status === 'archived'
  let startDate: string
  let dueDate: string
  if (p.status === 'draft') {
    startDate = at(-3, 10, 0)
    dueDate = addDays(NOW, int(35, 60))
  } else if (isDone) {
    startDate = at(int(60, 120), 9, 0)
    dueDate = addDays(startDate, int(20, 45))
  } else {
    startDate = at(int(10, 55), 9, 30)
    dueDate = addDays(NOW, int(4, 34))
  }
  const doneCount = p.progress >= 96 ? 3 : p.progress >= 50 ? 2 : p.progress > 0 ? 1 : 0
  const milestones = milestoneNames.map((name, mi) => ({
    name,
    date: addDays(startDate, mi * 12 + 6).slice(0, 10),
    done: mi < doneCount,
  }))
  const deliverables =
    p.progress >= 90
      ? [
          {
            id: `dlv_${p.id}_1`,
            name: `${p.name}_MV-HEVC_v1.mov`,
            format: 'MV-HEVC' as OutputFormat,
            minutes: Math.round(p.minutes * 0.6),
            version: p.progress >= 100 ? 'v2' : 'v1',
            accepted: p.progress >= 96,
            createdAt: addDays(NOW, -int(2, 12)),
          },
          ...(p.progress >= 100
            ? [
                {
                  id: `dlv_${p.id}_2`,
                  name: `${p.name}_SBS_交付版.mov`,
                  format: 'SBS-Full' as OutputFormat,
                  minutes: p.minutes,
                  version: 'v1',
                  accepted: true,
                  createdAt: addDays(NOW, -int(1, 8)),
                },
              ]
            : []),
        ]
      : []
  return {
    id: p.id,
    code,
    name: p.name,
    clientId: p.clientId,
    type: p.type,
    status: p.status,
    ownerId: p.ownerId,
    startDate,
    dueDate,
    deliveredAt: isDone ? addDays(NOW, -int(3, 30)) : undefined,
    assetCount: 0,
    totalMinutes: p.minutes,
    progress: p.progress,
    budgetCNY: p.budget,
    spentCNY: 0,
    description: p.description,
    milestones,
    deliverables,
  }
})

/* ------------------------------------------------------------------ 素材 */

const assetPrefix: Record<string, string> = {
  prj_001: 'SHG',
  prj_002: 'SILK',
  prj_003: 'TVC_SU',
  prj_004: 'FY',
  prj_005: 'SHJ',
  prj_006: 'ECHO',
  prj_007: 'EDU_GEO',
  prj_008: 'CITY',
  prj_009: 'SONG',
  prj_010: 'GALAXY',
  prj_011: 'GY_BEAUTY',
  prj_012: 'JYBC',
  prj_013: 'NIGHT',
  prj_014: 'POLAR',
  prj_015: 'CHEM',
  prj_016: 'BAY_MOTOR',
  prj_017: 'CITYBRAIN',
  prj_018: 'DEEPSEA',
}

const cams = ['MainCam', 'B_Cam', 'Drone', 'Gimbal', 'Interview', 'Wide', 'Macro', 'Archive_Scan']
const motifsByType: Record<Project['type'], Asset['thumb']['motif'][]> = {
  纪录片: ['mountain', 'sea', 'portrait', 'city'],
  广告: ['city', 'portrait', 'stage'],
  展陈: ['museum', 'portrait', 'city'],
  文旅: ['mountain', 'stage', 'sea'],
  教育: ['portrait', 'museum', 'city'],
  演出: ['stage', 'portrait', 'city'],
}

const thumbPalette: Record<Asset['thumb']['motif'], [string, string]> = {
  mountain: ['#1d3b4d', '#0b1620'],
  city: ['#252a3d', '#12141d'],
  portrait: ['#3a2b3c', '#19101c'],
  museum: ['#3a3324', '#161310'],
  stage: ['#2c2040', '#110c1a'],
  sea: ['#103744', '#061820'],
}

function makeAssetName(projectId: string, index: number): { name: string; width: number; codec: Asset['codec']; ext: string } {
  const prefix = assetPrefix[projectId] ?? 'SS'
  const cam = cams[index % cams.length]
  const ep = String((index % 12) + 1).padStart(2, '0')
  const roll = rnd()
  const width = roll > 0.88 ? 7680 : roll > 0.32 ? 3840 : 1920
  const resLabel = width === 7680 ? '8K' : width === 3840 ? '4K' : '1080p'
  if (width === 7680) {
    return { name: `${prefix}_EP${ep}_${cam}_8K.mov`, width, codec: 'Blackmagic RAW', ext: '.mov' }
  }
  if (width === 3840) {
    const codec = chance(0.55) ? 'ProRes 422 HQ' : 'H.265'
    return { name: `${prefix}_EP${ep}_${cam}_4K.${codec === 'H.265' ? 'mp4' : 'mov'}`, width, codec, ext: codec === 'H.265' ? '.mp4' : '.mov' }
  }
  return { name: `${prefix}_EP${ep}_${cam}_${resLabel}.mp4`, width, codec: rnd() > 0.5 ? 'H.264' : 'H.265', ext: '.mp4' }
}

export const assets: Asset[] = Array.from({ length: 60 }).map((_, i): Asset => {
  const project = projects[i % projects.length]
  const { name, width, codec } = makeAssetName(project.id, i)
  const height = width === 7680 ? 4320 : width === 3840 ? 2160 : 1080
  const durationSec = int(48, 2280)
  const fps = chance(0.58) ? 25 : chance(0.5) ? 24 : 30
  const bitrateMbps = width === 7680 ? int(680, 920) : width === 3840 ? int(180, 420) : int(28, 68)
  const sizeGB = Math.round(((bitrateMbps * durationSec) / 8 / 1024) * 10) / 10
  const motif = pick(motifsByType[project.type])
  const hdr: Asset['hdr'] = chance(0.25) ? (chance(0.7) ? 'HDR10' : 'Dolby Vision') : 'SDR'
  const createdAt = at(int(1, 44), int(8, 20), int(0, 59))
  return {
    id: `ast_${String(i + 1).padStart(3, '0')}`,
    name,
    projectId: project.id,
    clientId: project.clientId,
    thumb: { from: thumbPalette[motif][0], to: thumbPalette[motif][1], motif },
    durationSec,
    width,
    height,
    fps,
    codec,
    bitrateMbps,
    sizeGB,
    audio: {
      channels: chance(0.3) ? 2 : 6,
      sampleRate: 48000,
      layout: chance(0.3) ? '立体声 2.0' : '环绕声 5.1',
    },
    colorSpace: width === 7680 ? 'Rec.2020' : chance(0.35) ? 'Rec.2020' : 'Rec.709',
    hdr,
    scenes: Math.max(3, Math.round(durationSec / int(16, 38))),
    hasFace: chance(0.55),
    status: 'ready',
    tags: [
      width === 7680 ? '8K' : width === 3840 ? '4K' : '1080p',
      ...(hdr !== 'SDR' ? [hdr] : []),
      ...(chance(0.3) ? ['需稳定化'] : []),
      ...(chance(0.25) ? ['低照度'] : []),
    ],
    createdAt,
  }
})

/* ------------------------------------------------------------------ 任务 */

const statusPlan: JobStatus[] = [
  ...Array(22).fill('completed'),
  ...Array(4).fill('qa'),
  ...Array(5).fill('queued'),
  ...Array(4).fill('failed'),
  ...Array(2).fill('paused'),
  ...Array(2).fill('draft'),
  'analyzing',
  'depth',
  'disparity',
  'temporal',
  'rendering',
  'encoding',
]

const runningTarget: Record<string, number> = {
  analyzing: 32,
  depth: 48,
  disparity: 66,
  temporal: 78,
  rendering: 87,
  encoding: 96,
  qa: 96,
  completed: 100,
  queued: 0,
  draft: 0,
  failed: 54,
  paused: 46,
  canceled: 18,
}

function buildStages(status: JobStatus, target: number, startedAt: string): JobStage[] {
  const stages: JobStage[] = STAGE_META.map((m) => ({ ...m, progress: 0 }))
  if (status === 'completed') {
    stages.forEach((s) => (s.progress = 100))
  } else if (status === 'qa') {
    stages.forEach((s, i) => (s.progress = i < 6 ? 100 : 64))
  } else if (status === 'queued' || status === 'draft') {
    stages.forEach((s) => (s.progress = 0))
  } else {
    let remain = target
    for (const st of stages) {
      if (remain >= st.weight) {
        st.progress = 100
        remain -= st.weight
      } else {
        st.progress = Math.round((remain / st.weight) * 100)
        remain = 0
      }
    }
  }
  let cursor = new Date(startedAt).getTime()
  for (const st of stages) {
    if (st.progress > 0) {
      st.startedAt = new Date(cursor).toISOString()
      cursor += st.weight * 60 * 1000 * 0.6
      if (st.progress === 100) st.finishedAt = new Date(cursor).toISOString()
    }
  }
  return stages
}

function makeMetrics(quality: 'high' | 'mid' | 'low'): QaMetrics {
  const base =
    quality === 'high'
      ? { c: [88, 96], j: [0.05, 0.11], e: [0.6, 1.8], p: [0.9, 1.4], n: [0.25, 0.55], w: [0, 0], d: [0.88, 0.96] }
      : quality === 'mid'
        ? { c: [78, 87], j: [0.11, 0.17], e: [1.8, 3.2], p: [1.3, 1.8], n: [0.5, 0.8], w: [0, 2], d: [0.78, 0.9] }
        : { c: [66, 77], j: [0.17, 0.26], e: [3.2, 5.4], p: [1.8, 2.3], n: [0.8, 1.2], w: [2, 7], d: [0.6, 0.78] }
  return {
    comfortScore: int(base.c[0], base.c[1]),
    temporalJitter: float(base.j[0], base.j[1], 3),
    edgeArtifactRate: float(base.e[0], base.e[1], 1),
    maxPositiveDisparity: float(base.p[0], base.p[1], 2),
    maxNegativeDisparity: float(base.n[0], base.n[1], 2),
    windowViolationFrames: int(base.w[0], base.w[1]),
    depthConfidence: float(base.d[0], base.d[1], 2),
  }
}

const issueTypes = ['深度边缘溢出', '时域抖动', '窗口违规', '遮挡错误', '低置信度']

function makeIssues(durationSec: number): IssueFrame[] {
  const count = int(2, 6)
  return Array.from({ length: count }).map(() => {
    const sec = int(6, Math.max(20, durationSec - 6))
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    return {
      timecode: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
      type: pick(issueTypes),
      severity: pick(['low', 'medium', 'high'] as const),
      confidence: float(0.52, 0.94, 2),
    }
  })
}

function makeLogs(job: { code: string; status: JobStatus; startedAt: string; scenes: number; model: string; node: string }, asset: Asset, metrics?: QaMetrics): JobLog[] {
  const logs: JobLog[] = []
  const push = (min: number, level: JobLog['level'], message: string) =>
    logs.push({ ts: addMinutes(job.startedAt, min), level, message })
  push(0, 'INFO', `任务 ${job.code} 已分配至 ${job.node}，模型 ${job.model} 加载完成`)
  push(1, 'INFO', `源素材 ${asset.width}×${asset.height} / ${asset.fps}fps / ${asset.codec}，开始镜头切分`)
  if (job.status !== 'queued' && job.status !== 'draft') {
    push(3, 'INFO', `检测到 ${job.scenes} 个镜头，其中 ${Math.max(1, Math.round(job.scenes * 0.06))} 个为快速摇镜，已启用增强时域平滑`)
    push(14, 'INFO', `深度估计完成，平均置信度 ${metrics ? metrics.depthConfidence.toFixed(2) : '0.91'}`)
    if (chance(0.4)) {
      push(22, 'WARN', `00:12:18 处人物发丝边缘深度置信度 0.61，低于阈值 0.70，已回退边缘保护强度`)
    }
    push(31, 'INFO', `视差生成完成，最大正视差 ${metrics ? metrics.maxPositiveDisparity.toFixed(2) : '1.24'}%，最大负视差 ${metrics ? metrics.maxNegativeDisparity.toFixed(2) : '0.48'}%`)
    push(44, 'INFO', `时域优化完成，抖动指数 ${metrics ? metrics.temporalJitter.toFixed(3) : '0.082'}`)
  }
  if (job.status === 'failed') {
    push(52, 'ERROR', `渲染中断：显存占用峰值 46.8GB，超过节点可用上限`)
  }
  if (job.status === 'completed' || job.status === 'qa') {
    push(58, 'INFO', `MV-HEVC 双视图封装完成，已写入空间元数据与视差基线`)
    push(66, 'INFO', `质检完成，舒适度 ${metrics ? metrics.comfortScore : 91}，窗口违规 ${metrics ? metrics.windowViolationFrames : 0} 帧`)
  }
  return logs
}

const runningStatuses: JobStatus[] = ['analyzing', 'depth', 'disparity', 'temporal', 'rendering', 'encoding']

export const jobs: Job[] = statusPlan.map((status, i) => {
  const asset = assets[i % 45]
  const project = projects.find((p) => p.id === asset.projectId)!
  const preset = presets[i % presets.length]
  const format: OutputFormat =
    i % 10 === 0 ? 'SBS-Full' : i % 17 === 0 ? 'OU' : i % 23 === 0 ? 'Anaglyph' : i % 7 === 0 ? 'SBS-Half' : 'MV-HEVC'
  const isDone = status === 'completed'
  const isRunning = runningStatuses.includes(status)
  const rush = chance(0.28)
  const billedMinutes = Math.max(1, Math.round(asset.durationSec / 60))
  const createdDaysAgo = isDone ? int(2, 22) : isRunning ? 0 : int(1, 6)
  const createdAt = at(createdDaysAgo, isRunning ? int(7, 9) : int(8, 19), int(0, 59))
  const startedAt = status === 'queued' || status === 'draft' ? undefined : addMinutes(createdAt, 2)
  const target = runningTarget[status] ?? 0
  const stages = buildStages(status, target, startedAt ?? createdAt)
  const metrics = isDone || status === 'qa' ? makeMetrics(isDone ? (chance(0.6) ? 'high' : chance(0.6) ? 'mid' : 'low') : chance(0.5) ? 'mid' : 'low') : undefined
  const nodeIndex = isRunning ? runningStatuses.indexOf(status) : -1
  const nodeId = isRunning ? `nod_00${nodeIndex + 1}` : isDone ? `nod_00${int(1, 6)}` : undefined
  const totalEstimate = estimateSeconds(asset.durationSec, asset.width, format, rush)
  const progress = weightedProgress(stages)
  const job: Job = {
    id: `job_${String(i + 1).padStart(3, '0')}`,
    code: `SS-2610-${String(142 - i).padStart(4, '0')}`,
    name: `${asset.name.replace(/\.[^.]+$/, '')} ${format === 'MV-HEVC' ? '空间化' : '立体版'}${i % 5 === 0 ? ' · v2' : ''}`,
    assetId: asset.id,
    projectId: asset.projectId,
    clientId: asset.clientId ?? 'cli_001',
    presetId: preset.id,
    output: {
      format,
      resolution: asset.width === 7680 ? '7680x4320' : asset.width === 3840 ? '3840x2160' : 'source',
      fps: 'source',
      bitrate: format === 'MV-HEVC' ? (asset.width === 7680 ? 420 : 180) : 'auto',
      colorSpace: asset.colorSpace,
      hdr: asset.hdr === 'SDR' ? 'SDR' : 'HDR10',
      audio: chance(0.6) ? 'spatial' : 'passthrough',
      container: format === 'MV-HEVC' ? 'mov' : chance(0.5) ? 'mov' : 'mp4',
    },
    params: {
      ...preset.params,
      disparity: Math.max(20, Math.min(90, preset.params.disparity + int(-6, 6))),
      convergence: Math.max(-30, Math.min(30, preset.params.convergence + int(-4, 4))),
    },
    status,
    progress,
    stages,
    priority: rush ? 'rush' : 'standard',
    nodeId,
    operatorId: ['usr_004', 'usr_005', 'usr_007', 'usr_008', 'usr_011'][i % 5],
    createdAt,
    startedAt,
    finishedAt: isDone ? addMinutes(startedAt!, Math.round(totalEstimate / 60)) : status === 'failed' ? addMinutes(startedAt!, int(40, 180)) : undefined,
    etaSec: isRunning ? Math.round((totalEstimate * (100 - progress)) / 100) : undefined,
    costCNY: jobCost(billedMinutes, asset.width, rush),
    billedMinutes,
    version: i % 5 === 0 ? 2 : 1,
    metrics,
    issueFrames: metrics ? makeIssues(asset.durationSec) : undefined,
    error:
      status === 'failed'
        ? (() => {
            const e = ERROR_LIBRARY[i % ERROR_LIBRARY.length]
            return { code: e.code, message: e.message, hint: e.hint }
          })()
        : undefined,
    logs: [],
    note: project.description,
  }
  job.logs = makeLogs(
    {
      code: job.code,
      status,
      startedAt: startedAt ?? createdAt,
      scenes: asset.scenes,
      node: nodeId ? `GPU-N0${nodeId.slice(-1)}` : '调度队列',
      model: job.params.depthModel,
    },
    asset,
    metrics,
  )
  return job
})

/* ------------------------------------------------------------------ 节点 */

export const nodes: Node[] = Array.from({ length: 8 }).map((_, i) => {
  const busy = i < 6
  const maintenance = i === 7
  const job = busy ? jobs.filter((j) => j.nodeId === `nod_00${i + 1}` && runningStatuses.includes(j.status))[0] : undefined
  return {
    id: `nod_00${i + 1}`,
    hostname: `GPU-N0${i + 1}`,
    gpu: i >= 6 ? 'A100 80GB' : 'RTX 6000 Ada',
    gpuCount: 2,
    vramGB: i >= 6 ? 160 : 96,
    status: busy ? 'busy' : maintenance ? 'maintenance' : 'idle',
    utilization: busy ? int(62, 96) : maintenance ? 0 : int(3, 9),
    temperatureC: busy ? int(66, 79) : maintenance ? 41 : int(45, 52),
    vramUsedPct: busy ? int(58, 92) : maintenance ? 0 : int(4, 12),
    currentJobId: job?.id,
    throughputFps: busy ? int(12, 38) : 0,
    todayFrames: busy ? int(12000, 32800) : int(0, 1200),
    uptimeDays: int(3, 64),
    location: `上海机房 A 区 · 机柜 0${(i % 4) + 1}`,
    sparkline: Array.from({ length: 30 }).map((__, k) =>
      busy ? Math.max(35, Math.min(99, int(55, 96) + (k > 22 ? int(-6, 6) : 0))) : int(2, 12),
    ),
  }
})

/* ------------------------------------------------------------------ 订单 */

const orderStatusPlan: OrderStatus[] = [
  ...Array(10).fill('completed'),
  ...Array(4).fill('delivered'),
  ...Array(4).fill('in_production'),
  ...Array(3).fill('paid'),
  ...Array(2).fill('pending_confirm'),
  'canceled',
]

export const orders: Order[] = orderStatusPlan.map((status, i) => {
  const project = projects[i % projects.length]
  const standardMinutes = Math.max(1, Math.round(project.totalMinutes * (chance(0.3) ? 0.4 : 1)))
  const unit = project.totalMinutes > 100 ? 360 : 120
  const items = [
    {
      service: project.totalMinutes > 100 ? '标准转换（8K）' : '标准转换（4K）',
      minutes: standardMinutes,
      unitPriceCNY: unit,
      amountCNY: standardMinutes * unit,
    },
  ]
  if (chance(0.45)) {
    const refMin = Math.max(1, Math.round(standardMinutes * 0.12))
    const refUnit = project.totalMinutes > 100 ? 1400 : 600
    items.push({ service: '精修转换', minutes: refMin, unitPriceCNY: refUnit, amountCNY: refMin * refUnit })
  }
  if (chance(0.3)) {
    items.push({ service: 'Vision Pro 交付适配', minutes: standardMinutes, unitPriceCNY: 60, amountCNY: standardMinutes * 60 })
  }
  const rush = chance(0.3)
  const itemsTotal = items.reduce((s, i) => s + i.amountCNY, 0)
  const discount = chance(0.25) ? Math.min(int(500, 3000), Math.round(itemsTotal * 0.12)) : 0
  const totals = orderTotals(items, rush, discount)
  const createdAt = at(int(3, 58), int(9, 18), int(0, 59))
  const paid = ['paid', 'in_production', 'delivered', 'completed'].includes(status)
  const delivered = ['delivered', 'completed'].includes(status)
  return {
    id: `ord_${String(i + 1).padStart(3, '0')}`,
    code: `SO-2026-${String(312 - i).padStart(4, '0')}`,
    projectId: project.id,
    clientId: project.clientId,
    items,
    rush,
    rushRate: 1.5,
    discountCNY: discount,
    taxRate: 0.06,
    subtotalCNY: totals.subtotal,
    totalCNY: totals.total,
    status,
    createdAt,
    paidAt: paid ? addMinutes(createdAt, int(120, 2880)) : undefined,
    deliveredAt: delivered ? addDays(createdAt, int(4, 20)) : undefined,
    invoice:
      status === 'completed'
        ? {
            status: 'issued',
            no: `3100261${String(1000 + i)}`,
            title: clients.find((c) => c.id === project.clientId)?.name,
            taxNo: clients.find((c) => c.id === project.clientId)?.taxNo,
            issuedAt: addDays(createdAt, int(2, 8)),
          }
        : status === 'delivered' && chance(0.6)
          ? { status: 'requested', title: clients.find((c) => c.id === project.clientId)?.name }
          : { status: 'none' },
    ownerId: project.ownerId,
  }
})

/* ------------------------------------------------------------------ 工单 */

const ticketSeeds: { title: string; type: Ticket['type']; priority: TicketPriority }[] = [
  { title: 'MV-HEVC 输出在 Vision Pro 上无声音，音频轨是否封装正确？', type: '技术咨询', priority: 'P1' },
  { title: '8K 转制后画面右缘出现 1 像素黑边', type: '转换故障', priority: 'P2' },
  { title: '源素材为 10bit 4:2:2，是否需要先转 4:4:4 再转换？', type: '技术咨询', priority: 'P3' },
  { title: 'EP03 深度估计阶段报 E-4021，重试两次仍失败', type: '转换故障', priority: 'P0' },
  { title: '批量任务全部卡在 96% 不动，已持续 40 分钟', type: '转换故障', priority: 'P0' },
  { title: '输出文件缺少空间元数据，Vision Pro 识别为普通视频', type: '转换故障', priority: 'P1' },
  { title: '第 12 分钟人物特写需要逐帧修正视差', type: '精修需求', priority: 'P2' },
  { title: '片头 logo 出屏过强，希望整体减弱 30%', type: '精修需求', priority: 'P2' },
  { title: '需要补一份 8K SBS 版本用于展馆大屏', type: '交付支持', priority: 'P1' },
  { title: '客户要求提供质检报告 PDF，含逐帧问题清单', type: '交付支持', priority: 'P2' },
  { title: '新同事需要开通质检放行权限', type: '账号与权限', priority: 'P3' },
  { title: 'API 密钥轮换后旧任务回调失败', type: '账号与权限', priority: 'P1' },
  { title: '环幕版本视差在左右边缘不一致，疑似投影融合区未对齐', type: '技术咨询', priority: 'P1' },
  { title: '水下素材蓝绿通道衰减，深度图出现大面积误判', type: '技术咨询', priority: 'P2' },
  { title: '交付截止提前到本周五，能否加急两个批次', type: '交付支持', priority: 'P0' },
  { title: '转制后字幕层被推到了画面后方，需要固定在屏幕平面', type: '转换故障', priority: 'P2' },
  { title: '希望调整默认预设的收敛面，当前主体偏后', type: '技术咨询', priority: 'P3' },
  { title: '展馆现场播放器不支持 420Mbps 码率，需要降码率版本', type: '交付支持', priority: 'P1' },
  { title: '素材导入后时长识别少了 2 秒，是否丢帧？', type: '转换故障', priority: 'P2' },
  { title: '能否提供一批 30 秒样片用于客户选型', type: '交付支持', priority: 'P3' },
]

const ticketStatusPlan: TicketStatus[] = [
  ...Array(5).fill('new'),
  ...Array(5).fill('in_progress'),
  ...Array(3).fill('accepted'),
  ...Array(4).fill('waiting_client'),
  ...Array(9).fill('resolved'),
  ...Array(4).fill('closed'),
]

const assignees = ['usr_007', 'usr_009', 'usr_005', 'usr_004', 'usr_011']

export const tickets: Ticket[] = Array.from({ length: 30 }).map((_, i) => {
  const seed = ticketSeeds[i % ticketSeeds.length]
  const project = projects[i % projects.length]
  const status = ticketStatusPlan[i]
  const createdAt =
    status === 'new'
      ? addMinutes(NOW.toISOString(), -int(10, 280))
      : status === 'accepted' || status === 'in_progress'
        ? addMinutes(NOW.toISOString(), -int(25, 380))
        : status === 'waiting_client'
          ? addMinutes(NOW.toISOString(), -int(700, 2600))
          : at(int(1, 10), int(9, 18), int(0, 59))
  const slaHours = { P0: 2, P1: 8, P2: 24, P3: 72 }[seed.priority]
  const slaDueAt = addMinutes(createdAt, slaHours * 60)
  const resolved = status === 'resolved' || status === 'closed'
  const hasFirst = status !== 'new' && status !== 'accepted'
  const replyCount = int(1, 3)
  const replies = Array.from({ length: replyCount }).map((__, ri) => {
    const isClient = ri % 2 === 0
    const author = isClient
      ? { id: project.clientId, name: clients.find((c) => c.id === project.clientId)!.contact.name }
      : { id: assignees[i % assignees.length], name: team.find((t) => t.id === assignees[i % assignees.length])!.name }
    return {
      id: `rep_${i}_${ri}`,
      authorId: author.id,
      authorName: author.name,
      isClient,
      content: isClient
        ? [
            '这个问题影响本周交付，麻烦优先看一下，谢谢。',
            '我们这边播放器仍然识别不到空间信息，附件是 mediainfo 输出。',
            '补充说明：只有 8K 那一批有问题，4K 是正常的。',
          ][ri % 3]
        : [
            '已收到，正在核对封装参数。初步判断是音频轨未标记为空间声道，稍后同步结论。',
            '已定位到节点显存峰值超过上限，建议该批次降到 4K 或切到 A100 节点，我可以直接帮你改配置。',
            '已在测试环境复现，预计今天 18:00 前给出修复版本。',
          ][ri % 3],
      createdAt: addMinutes(createdAt, 30 + ri * 55),
      attachments: ri === 0 && chance(0.4) ? ['mediainfo_8k.txt'] : undefined,
    }
  })
  return {
    id: `tkt_${String(i + 1).padStart(3, '0')}`,
    code: `TK-2610-${String(19 + i).padStart(3, '0')}`,
    title: seed.title,
    type: seed.type,
    priority: seed.priority,
    status,
    clientId: project.clientId,
    projectId: project.id,
    jobId: chance(0.4) ? jobs[i % jobs.length].id : undefined,
    assigneeId: status === 'new' ? undefined : assignees[i % assignees.length],
    createdAt,
    slaDueAt,
    firstResponseAt: hasFirst ? addMinutes(createdAt, int(12, 90)) : undefined,
    resolvedAt: resolved ? addMinutes(createdAt, int(120, 1200)) : undefined,
    slaPaused: status === 'waiting_client',
    replies,
    satisfaction: status === 'closed' ? { score: int(4, 5), tags: ['响应及时', '方案有效'], comment: '问题解决得很快。' } : undefined,
    attachments: chance(0.5) ? ['reference_frame.png'] : [],
  }
})

/* ------------------------------------------------------------------ 通知 / 日志 */

export const notifications: AppNotification[] = [
  {
    id: 'ntf_001',
    type: 'job',
    title: '任务失败：E-4021 显存不足',
    body: '「SHJ_EP03_Drone_8K 空间化」在深度估计阶段中断，已重试 2 次。',
    read: false,
    createdAt: addMinutes(NOW, -6),
    link: '/jobs/job_041',
  },
  {
    id: 'ntf_002',
    type: 'ticket',
    title: 'P0 工单即将超时',
    body: 'TK-2610-022 剩余 18 分钟，请立即响应。',
    read: false,
    createdAt: addMinutes(NOW, -12),
    link: '/tickets/tkt_022',
  },
  {
    id: 'ntf_003',
    type: 'job',
    title: '质检通过：84 分钟内容可交付',
    body: '「《山河故人》EP02 空间化」舒适度 91，窗口违规 0 帧。',
    read: false,
    createdAt: addMinutes(NOW, -38),
    link: '/review',
  },
  {
    id: 'ntf_004',
    type: 'project',
    title: '项目临近交期',
    body: '「澄明博物馆「宋韵」常设展」距交期还有 4 天，完成度 58%。',
    read: false,
    createdAt: addMinutes(NOW, -95),
    link: '/projects/prj_009',
  },
  {
    id: 'ntf_005',
    type: 'billing',
    title: '发票已开具',
    body: 'SO-2026-0302 电子发票已发送至客户邮箱。',
    read: false,
    createdAt: addMinutes(NOW, -140),
    link: '/orders/ord_011',
  },
  {
    id: 'ntf_006',
    type: 'job',
    title: '任务完成：8K 双视图封装',
    body: '「POLAR_EP04_MainCam_8K 空间化」已生成 420 Mbps 母版。',
    read: true,
    createdAt: addMinutes(NOW, -220),
    link: '/jobs/job_010',
  },
  {
    id: 'ntf_007',
    type: 'ticket',
    title: '客户已回复工单',
    body: 'TK-2610-027 客户补充了 mediainfo 输出，等待技术确认。',
    read: true,
    createdAt: addMinutes(NOW, -310),
    link: '/tickets/tkt_027',
  },
  {
    id: 'ntf_008',
    type: 'project',
    title: '项目进入待验收',
    body: '「「溯」汽车品牌 TVC 空间版」客户已收到样片，等待验收确认。',
    read: true,
    createdAt: addMinutes(NOW, -420),
    link: '/projects/prj_003',
  },
  {
    id: 'ntf_009',
    type: 'job',
    title: '节点 GPU-N08 进入维护',
    body: '运维许砚将节点置为维护状态，当前无运行任务。',
    read: true,
    createdAt: addMinutes(NOW, -600),
    link: '/nodes',
  },
  {
    id: 'ntf_010',
    type: 'billing',
    title: '本月应收提醒',
    body: '10 月待收款 3 笔，合计 ¥71,600，其中 1 笔已逾期 5 天。',
    read: true,
    createdAt: addMinutes(NOW, -900),
    link: '/orders',
  },
  {
    id: 'ntf_011',
    type: 'job',
    title: '队列等待超过 30 分钟',
    body: '5 个任务排队中，GPU-N07 空闲，建议手动指定节点。',
    read: true,
    createdAt: addMinutes(NOW, -1200),
    link: '/jobs?view=queue',
  },
  {
    id: 'ntf_012',
    type: 'project',
    title: '项目已归档',
    body: '「蓝湾 汽车发布会 空间直播回放」已归档，交付物 2 项。',
    read: true,
    createdAt: addMinutes(NOW, -1800),
    link: '/projects/prj_016',
  },
]

const auditActions = [
  { action: 'job.create', label: '创建转换任务' },
  { action: 'job.retry', label: '重试任务' },
  { action: 'job.cancel', label: '取消任务' },
  { action: 'job.qa.pass', label: '质检放行' },
  { action: 'job.qa.reject', label: '质检退回' },
  { action: 'preset.update', label: '更新预设' },
  { action: 'project.update', label: '更新项目' },
  { action: 'order.update', label: '更新订单' },
  { action: 'ticket.reply', label: '回复工单' },
  { action: 'node.maintenance', label: '节点维护' },
  { action: 'member.invite', label: '邀请成员' },
  { action: 'apikey.rotate', label: '轮换密钥' },
]

export const auditLogs: AuditLog[] = Array.from({ length: 120 }).map((_, i) => {
  const actor = team[i % 12]
  const a = auditActions[i % auditActions.length]
  const target =
    i % 4 === 0 ? jobs[i % jobs.length].code : i % 4 === 1 ? projects[i % projects.length].code : i % 4 === 2 ? orders[i % orders.length].code : tickets[i % tickets.length].code
  return {
    id: `log_${String(i + 1).padStart(4, '0')}`,
    ts: addMinutes(NOW, -(i * 47 + int(0, 25))),
    actorId: actor.id,
    actorName: actor.name,
    action: a.action,
    target,
    ip: `10.24.${int(1, 12)}.${int(10, 240)}`,
    detail: { action: a.label, target, result: 'success', durationMs: int(40, 1800) },
  }
})

/* ------------------------------------------------------------------ 派生统计 */

projects.forEach((p) => {
  p.assetCount = assets.filter((a) => a.projectId === p.id).length
  p.spentCNY = orders.filter((o) => o.projectId === p.id && o.status !== 'canceled').reduce((s, o) => s + o.totalCNY, 0)
})

clients.forEach((c) => {
  const cps = projects.filter((p) => p.clientId === c.id)
  c.stats.projects = cps.length
  c.stats.deliveredMinutes = cps.filter((p) => p.status === 'delivered' || p.status === 'archived').reduce((s, p) => s + p.totalMinutes, 0)
  c.stats.totalSpendCNY = orders.filter((o) => o.clientId === c.id && o.status === 'completed').reduce((s, o) => s + o.totalCNY, 0)
  c.stats.openTickets = tickets.filter((t) => t.clientId === c.id && !['resolved', 'closed'].includes(t.status)).length
})
