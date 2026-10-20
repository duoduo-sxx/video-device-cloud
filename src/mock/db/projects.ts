import type { Milestone, Project } from '@/types/models';
import type { ChannelId, EngineType, Health, ProjectStatus } from '@/types/enums';
import { NOW, makeRng, daysAgo } from '../seed';

const rng = makeRng(20260303);

interface Seed {
  id: string;
  name: string;
  code: string;
  clientId: string;
  status: ProjectStatus;
  health: Health;
  healthScore: number;
  engine: EngineType;
  engineVersion: string;
  platforms: ChannelId[];
  managerId: string;
  memberIds: string[];
  startDate: string;
  plannedEndDate: string;
  actualEndDate: string | null;
  contractAmount: number;
  progress: number;
  currentVersion: string;
  currentSprint: string;
  tags: string[];
  description: string;
  riskNote: string | null;
}

const seeds: Seed[] = [
  {
    id: 'PRJ-2026-011',
    name: '深海迷航：无尽海域',
    code: 'DEEPSEA',
    clientId: 'CLI-001',
    status: 'in_progress',
    health: 'healthy',
    healthScore: 86,
    engine: 'cocos',
    engineVersion: '3.8.3',
    platforms: ['wechat', 'douyin', 'h5'],
    managerId: 'U-002',
    memberIds: ['U-002', 'U-005', 'U-012', 'U-016', 'U-018', 'U-021', 'U-026', 'U-013'],
    startDate: '2026-06-08',
    plannedEndDate: '2026-11-28',
    actualEndDate: null,
    contractAmount: 2860000,
    progress: 68,
    currentVersion: '1.4.2',
    currentSprint: 'Sprint 07',
    tags: ['深海探险', '放置养成', '长线运营'],
    description:
      '以深海探索与资源收集为核心的放置类小游戏，包含 6 大章节、48 个可探索区域、12 种可养成生物。要求首包控制在 4MB 以内，支持微信、抖音双端一键登录与支付，弱网环境下可降级运行。',
    riskNote: null,
  },
  {
    id: 'PRJ-2026-009',
    name: '像素农场物语',
    code: 'PIXEL_FARM',
    clientId: 'CLI-002',
    status: 'in_progress',
    health: 'at_risk',
    healthScore: 62,
    engine: 'phaser',
    engineVersion: '3.80.1',
    platforms: ['facebook', 'h5'],
    managerId: 'U-003',
    memberIds: ['U-003', 'U-006', 'U-015', 'U-019', 'U-025', 'U-026'],
    startDate: '2026-07-20',
    plannedEndDate: '2026-11-10',
    actualEndDate: null,
    contractAmount: 1320000,
    progress: 54,
    currentVersion: '0.9.4',
    currentSprint: 'Sprint 05',
    tags: ['模拟经营', '像素风', '海外发行'],
    description:
      '像素风农场模拟经营，包含种植、养殖、订单、好友拜访四大系统，面向 Facebook Instant Games 与自有 H5 站点发行。需支持英语、德语、葡萄牙语三语切换。',
    riskNote: '美术资源交付延迟 12 天，导致场景搭建批次顺延；Facebook 端首包已超 18MB，接近 20MB 上限。',
  },
  {
    id: 'PRJ-2026-006',
    name: '三国：烽火连城',
    code: 'TK_FIRE',
    clientId: 'CLI-003',
    status: 'online',
    health: 'healthy',
    healthScore: 91,
    engine: 'laya',
    engineVersion: '3.2.4',
    platforms: ['wechat', 'kuaishou', 'alipay'],
    managerId: 'U-036',
    memberIds: ['U-036', 'U-005', 'U-010', 'U-017', 'U-021', 'U-026', 'U-035'],
    startDate: '2025-11-03',
    plannedEndDate: '2026-06-30',
    actualEndDate: '2026-07-08',
    contractAmount: 4180000,
    progress: 100,
    currentVersion: '3.2.1',
    currentSprint: 'Sprint 26',
    tags: ['SLG', '国战', '长线运营'],
    description:
      '三国题材 SLG，含城建、征兵、国战、联盟四大核心循环，支持万人同屏国战。已上线微信、快手、支付宝三端，进入长线运营阶段，按月迭代活动版本。',
    riskNote: null,
  },
  {
    id: 'PRJ-2026-014',
    name: '萌宠消消乐',
    code: 'PET_MATCH',
    clientId: 'CLI-006',
    status: 'in_progress',
    health: 'critical',
    healthScore: 38,
    engine: 'cocos',
    engineVersion: '3.8.3',
    platforms: ['douyin', 'wechat'],
    managerId: 'U-004',
    memberIds: ['U-004', 'U-009', 'U-018', 'U-022', 'U-026'],
    startDate: '2026-08-11',
    plannedEndDate: '2026-10-31',
    actualEndDate: null,
    contractAmount: 960000,
    progress: 41,
    currentVersion: '0.6.2',
    currentSprint: 'Sprint 03',
    tags: ['休闲消除', '抖音首发', '买量'],
    description:
      '三消加宠物养成，主打抖音小游戏首发，配套买量素材与落地页。要求 45 秒内完成首次消除，首日留存目标 38%。',
    riskNote:
      '抖音渠道审核两次驳回（诱导分享、抽奖概率公示不全），上线时间已推迟 11 天；核心战斗手感未达验收标准，甲方要求重做消除反馈动效。',
  },
  {
    id: 'PRJ-2025-032',
    name: '赛博镖客',
    code: 'CYBER_BOUNTY',
    clientId: 'CLI-005',
    status: 'maintenance',
    health: 'healthy',
    healthScore: 88,
    engine: 'unity',
    engineVersion: '2022.3.42f1',
    platforms: ['h5', 'webview'],
    managerId: 'U-002',
    memberIds: ['U-002', 'U-007', 'U-014', 'U-020', 'U-025', 'U-027'],
    startDate: '2025-05-19',
    plannedEndDate: '2026-03-27',
    actualEndDate: '2026-04-02',
    contractAmount: 5240000,
    progress: 100,
    currentVersion: '2.6.0',
    currentSprint: 'Sprint 31',
    tags: ['动作射击', 'WebGL', 'App 内嵌'],
    description:
      '赛博朋克题材横版动作射击，Unity WebGL 导出，嵌入客户 App 内运行。含 24 个关卡、8 个 Boss、3 套武器体系，需在 2GB 内存设备上稳定 30FPS。',
    riskNote: null,
  },
  {
    id: 'PRJ-2026-017',
    name: '星舰指挥官',
    code: 'STAR_CMD',
    clientId: 'CLI-009',
    status: 'in_progress',
    health: 'at_risk',
    healthScore: 66,
    engine: 'pixijs',
    engineVersion: '8.1.0',
    platforms: ['telegram', 'poki'],
    managerId: 'U-003',
    memberIds: ['U-003', 'U-008', 'U-011', 'U-016', 'U-024', 'U-027'],
    startDate: '2026-05-06',
    plannedEndDate: '2026-12-19',
    actualEndDate: null,
    contractAmount: 1740000,
    progress: 47,
    currentVersion: '0.8.1',
    currentSprint: 'Sprint 06',
    tags: ['太空策略', 'Telegram', '英文优先'],
    description:
      '太空舰队策略游戏，基于 Telegram Mini App 首发，含舰队编成、实时演算战斗、联盟战。需适配 Telegram WebApp SDK 的主题色与返回手势。',
    riskNote: 'Telegram SDK 版本升级导致登录流程返工；Poki 平台要求移除内购入口，需做双版本分支。',
  },
  {
    id: 'PRJ-2025-028',
    name: '江湖客栈',
    code: 'WUXIA_INN',
    clientId: 'CLI-004',
    status: 'online',
    health: 'healthy',
    healthScore: 84,
    engine: 'cocos',
    engineVersion: '3.8.1',
    platforms: ['wechat', 'douyin'],
    managerId: 'U-031',
    memberIds: ['U-031', 'U-005', 'U-017', 'U-019', 'U-021', 'U-026'],
    startDate: '2025-08-25',
    plannedEndDate: '2026-05-15',
    actualEndDate: '2026-05-20',
    contractAmount: 3120000,
    progress: 100,
    currentVersion: '2.1.3',
    currentSprint: 'Sprint 22',
    tags: ['模拟经营', '武侠', '剧情'],
    description:
      '武侠题材客栈经营，含菜品研发、侠客招募、江湖事件三条主线，累计 120 万字剧情文本。上线后保持双周活动更新。',
    riskNote: null,
  },
  {
    id: 'PRJ-2025-041',
    name: '极速赛道 3D',
    code: 'SPEEDWAY',
    clientId: 'CLI-010',
    status: 'maintenance',
    health: 'at_risk',
    healthScore: 58,
    engine: 'unity',
    engineVersion: '2022.3.38f1',
    platforms: ['crazygames', 'poki'],
    managerId: 'U-002',
    memberIds: ['U-002', 'U-007', 'U-010', 'U-020', 'U-025', 'U-027'],
    startDate: '2025-09-15',
    plannedEndDate: '2026-04-30',
    actualEndDate: '2026-05-14',
    contractAmount: 2680000,
    progress: 100,
    currentVersion: '1.9.2',
    currentSprint: 'Sprint 18',
    tags: ['竞速', '3D', '海外平台'],
    description:
      '3D 竞速游戏，8 条赛道、12 辆赛车、支持排行榜与幽灵车。针对 Poki 与 CrazyGames 做首包体积与加载速度优化。',
    riskNote: 'Poki 渠道自 9 月 2 日起被限流，日活连续 12 天下滑，正在评估迁移至 CrazyGames 主推。',
  },
  {
    id: 'PRJ-2026-021',
    name: '塔防纪元',
    code: 'TD_ERA',
    clientId: 'CLI-007',
    status: 'acceptance',
    health: 'at_risk',
    healthScore: 64,
    engine: 'cocos',
    engineVersion: '3.8.3',
    platforms: ['wechat', 'kuaishou'],
    managerId: 'U-004',
    memberIds: ['U-004', 'U-006', 'U-009', 'U-018', 'U-022', 'U-026'],
    startDate: '2026-03-16',
    plannedEndDate: '2026-10-24',
    actualEndDate: null,
    contractAmount: 1480000,
    progress: 92,
    currentVersion: '1.0.0-rc3',
    currentSprint: 'Sprint 12',
    tags: ['塔防', '关卡制', '双端'],
    description:
      '关卡制塔防，含 60 关主线、无尽模式、塔防天赋树。当前处于验收阶段，甲方提出 14 项体验优化，其中 3 项涉及数值重做。',
    riskNote: '验收期提出 3 项数值重做需求，超出原合同范围，正在走变更评审。',
  },
  {
    id: 'PRJ-2026-024',
    name: '谜题工厂',
    code: 'PUZZLE_FACTORY',
    clientId: 'CLI-011',
    status: 'in_progress',
    health: 'critical',
    healthScore: 41,
    engine: 'phaser',
    engineVersion: '3.80.1',
    platforms: ['poki', 'crazygames'],
    managerId: 'U-036',
    memberIds: ['U-036', 'U-008', 'U-015', 'U-016', 'U-024', 'U-021'],
    startDate: '2026-07-01',
    plannedEndDate: '2026-11-20',
    actualEndDate: null,
    contractAmount: 780000,
    progress: 33,
    currentVersion: '0.4.7',
    currentSprint: 'Sprint 04',
    tags: ['解谜', '海外平台', '轻量'],
    description:
      '物理类解谜游戏，80 个关卡，基于 Phaser 3 与 Matter.js。目标平台 Poki 与 CrazyGames，要求首包 8MB 以内、冷启动 3 秒内可玩。',
    riskNote: '物理引擎在低端安卓机上帧率不足 30FPS，Matter.js 方案可能需替换为自研轻量物理；进度落后计划 3 周。',
  },
  {
    id: 'PRJ-2026-002',
    name: '森林小镇',
    code: 'FOREST_TOWN',
    clientId: 'CLI-012',
    status: 'discovery',
    health: 'healthy',
    healthScore: 78,
    engine: 'cocos',
    engineVersion: '3.8.3',
    platforms: ['facebook', 'h5'],
    managerId: 'U-003',
    memberIds: ['U-003', 'U-011', 'U-019', 'U-035', 'U-025'],
    startDate: '2026-09-28',
    plannedEndDate: '2027-03-15',
    actualEndDate: null,
    contractAmount: 1120000,
    progress: 8,
    currentVersion: '0.1.0',
    currentSprint: 'Sprint 01',
    tags: ['休闲经营', '治愈', 'Facebook'],
    description:
      '治愈系森林小镇经营，玩家扮演小镇规划师，通过种植、建造、居民事件推进。当前处于需求调研与原型验证阶段。',
    riskNote: null,
  },
  {
    id: 'PRJ-2025-019',
    name: '末日方舟',
    code: 'ARK_SURVIVE',
    clientId: 'CLI-005',
    status: 'online',
    health: 'healthy',
    healthScore: 82,
    engine: 'laya',
    engineVersion: '3.2.2',
    platforms: ['douyin', 'wechat'],
    managerId: 'U-031',
    memberIds: ['U-031', 'U-005', 'U-010', 'U-017', 'U-022', 'U-026', 'U-033'],
    startDate: '2025-04-07',
    plannedEndDate: '2026-01-23',
    actualEndDate: '2026-01-30',
    contractAmount: 3480000,
    progress: 100,
    currentVersion: '2.8.4',
    currentSprint: 'Sprint 34',
    tags: ['末日生存', 'SLG', '长线'],
    description:
      '末日生存经营，含避难所建设、幸存者管理、外出探索。抖音端月流水稳定在 180 万左右，保持每周活动更新。',
    riskNote: null,
  },
  {
    id: 'PRJ-2026-027',
    name: '汉字寻宝',
    code: 'HANZI_QUEST',
    clientId: 'CLI-008',
    status: 'bidding',
    health: 'healthy',
    healthScore: 72,
    engine: 'pixijs',
    engineVersion: '8.1.0',
    platforms: ['wechat', 'alipay'],
    managerId: 'U-036',
    memberIds: ['U-036', 'U-008', 'U-020', 'U-024'],
    startDate: '2026-10-08',
    plannedEndDate: '2027-02-27',
    actualEndDate: null,
    contractAmount: 680000,
    progress: 3,
    currentVersion: '0.0.1',
    currentSprint: 'Sprint 00',
    tags: ['教育', '文字解谜', '亲子'],
    description:
      '面向亲子场景的汉字解谜游戏，通过偏旁组合、字形拆解完成关卡。目前处于方案投标阶段，等待甲方评估。',
    riskNote: null,
  },
  {
    id: 'PRJ-2024-008',
    name: '机甲纪元',
    code: 'MECHA_ERA',
    clientId: 'CLI-002',
    status: 'paused',
    health: 'critical',
    healthScore: 32,
    engine: 'unity',
    engineVersion: '2021.3.45f1',
    platforms: ['h5', 'telegram'],
    managerId: 'U-004',
    memberIds: ['U-004', 'U-007', 'U-014', 'U-018', 'U-035', 'U-027'],
    startDate: '2024-10-14',
    plannedEndDate: '2026-08-30',
    actualEndDate: null,
    contractAmount: 3960000,
    progress: 71,
    currentVersion: '0.9.9',
    currentSprint: 'Sprint 15',
    tags: ['机甲', '动作', '暂停'],
    description:
      '机甲动作对战游戏，含 16 台可驾驶机甲、5v5 团队战。因甲方战略调整于 2026 年 6 月暂停，保留核心团队做技术预研。',
    riskNote: '项目暂停超过 90 天，团队已部分调配至其他项目；合同尾款 118 万未结算，等待甲方确认后续方案。',
  },
];

const MILESTONE_NAMES = [
  '需求确认与 PRD 定稿',
  '核心玩法 Demo',
  '美术资源定稿',
  '内测版本交付',
  '提审版本封版',
  '正式上线',
];

function buildMilestones(seed: Seed, _index: number): Milestone[] {
  const start = new Date(seed.startDate).getTime();
  const end = new Date(seed.plannedEndDate).getTime();
  const step = (end - start) / 6;

  return MILESTONE_NAMES.map((name, i) => {
    const plannedAt = start + step * (i + 1);
    const plannedDate = new Date(plannedAt).toISOString().slice(0, 10);
    const plannedPast = plannedAt < NOW.getTime();

    let status: Milestone['status'];
    let progress: number;
    let actualDate: string | null = null;

    const overall = seed.progress;
    const mProgress = Math.max(0, Math.min(100, Math.round(overall * 1.18 - i * 17)));

    if (mProgress >= 100) {
      status = 'completed';
      progress = 100;
      actualDate = new Date(plannedAt + rng.int(-3, 6) * 86400000).toISOString().slice(0, 10);
    } else if (mProgress > 0) {
      status = plannedPast && seed.health !== 'healthy' ? 'delayed' : 'in_progress';
      progress = mProgress;
    } else {
      status = plannedPast ? 'delayed' : 'not_started';
      progress = 0;
    }

    if (seed.status === 'bidding' || seed.status === 'discovery') {
      status = i === 0 ? 'in_progress' : 'not_started';
      progress = i === 0 ? 35 : 0;
      actualDate = null;
    }

    return {
      id: `MS-${seed.code}-${String(i + 1).padStart(2, '0')}`,
      projectId: seed.id,
      name,
      plannedDate,
      actualDate,
      status,
      progress,
      ownerId: seed.managerId,
      deliverable: [
        'PRD 文档、原型稿、技术方案评审记录',
        '可运行 Demo、核心玩法视频',
        '美术资源包、切图规范、图集清单',
        '内测包、测试报告、缺陷清单',
        '提审包、各渠道适配说明、合规材料',
        '上线包、运营手册、监控看板',
      ][i] as string,
    };
  });
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export const projects: Project[] = seeds.map((s, i) => ({
  ...s,
  milestones: buildMilestones(s, i),
  daysLeft:
    s.status === 'online' || s.status === 'maintenance' || s.status === 'archived'
      ? 0
      : daysBetween(NOW, new Date(s.plannedEndDate)),
}));

export const projectsById = new Map(projects.map((p) => [p.id, p]));

export function projectName(id: string): string {
  return projectsById.get(id)?.name ?? '未知项目';
}

export function projectsOfClient(clientId: string): Project[] {
  return projects.filter((p) => p.clientId === clientId);
}

export { daysAgo };
