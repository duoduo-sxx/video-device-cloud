import type { Requirement } from '@/types/models';
import type { Priority, ReqStatus, ReqType } from '@/types/enums';
import { projects } from './projects';
import { daysAgo, makeRng } from '../seed';

const rng = makeRng(20260404);

const TITLES: string[] = [
  '接入微信小游戏一键登录与游客账号绑定',
  '补充防沉迷实名认证流程与时长限制提示',
  '新增分包加载策略，将首包控制在 4MB 以内',
  '优化冷启动流程，减少首屏白屏等待',
  '增加版本更新强更与热更提示弹窗',
  '补齐 iOS 静音键状态下的音频播放逻辑',
  '新增本地缓存版本号校验与过期清理机制',
  '接入渠道 SDK 的分享与收藏能力',
  '新增每日签到，支持 7 天连续签到递增奖励',
  '新增好友排行榜，支持周榜与总榜切换',
  '新增成就系统，覆盖 40 个成就节点',
  '装备强化增加保底机制，连续失败 5 次必成',
  '新增限时活动框架，支持配置化开闭',
  '重做新手引导前 3 分钟流程，压缩到 90 秒内',
  '增加战斗二倍速与跳过功能',
  '新增离线收益结算，最长累计 12 小时',
  '新增皮肤商店，支持限时折扣与礼包',
  '新增公会系统，含创建、审批、捐献、公会战',
  '背包增加一键整理与批量分解',
  '新增日常任务体系，每日 6 个随机任务',
  '增加音效与背景音乐独立开关',
  '弱网重连增加断线保护与自动恢复',
  '新增邀请分享，支持生成专属海报',
  '补齐核心行为埋点，覆盖 32 个事件',
  '首屏增加防沉迷提示与健康游戏公告',
  '优化图集合并策略，减少 DrawCall 数量',
  '新增多语言框架，支持中英德葡四语',
  '新增客服入口，跳转渠道内置客服',
  '增加充值档位配置化，支持运营后台调整',
  '新增首充双倍与累充奖励',
  '优化战斗数值表现，增加伤害飘字与暴击特效',
  '新增关卡自动战斗，支持 3 倍速扫荡',
  '增加装备套装属性与套装特效',
  '新增邮件系统，支持附件领取与批量删除',
  '新增七日登录奖励，第 7 天发放稀有角色',
  '优化资源加载顺序，优先加载首屏必需资源',
  '新增资源预加载，减少场景切换等待',
  '增加低内存设备降级策略，自动降低贴图精度',
  '新增帧率自适应，低端机锁定 30FPS',
  '补齐横竖屏适配，支持平板与折叠屏',
  '新增游戏内公告与跑马灯',
  '增加角色养成树，含 3 条分支 12 个节点',
  '新增宠物捕捉与培养玩法',
  '增加地图探索度与宝箱奖励',
  '新增联盟捐献与联盟科技',
  '优化支付流程，减少一次确认弹窗',
  '接入支付宝小游戏支付能力',
  '接入抖音侧边栏复访能力',
  '适配 Telegram WebApp 主题色与返回手势',
  '适配 Facebook Instant Games 广告 API',
  '新增激励视频广告位，含冷却与频次限制',
  '增加插屏广告开关，付费用户自动关闭',
  '新增数据看板，展示核心经营指标',
  '补齐审核合规材料，含概率公示与隐私政策',
  '移除诱导分享文案，改为中性邀请提示',
  '新增未成年人消费限额提示',
  '优化首包资源压缩，图片统一转 WebP',
  '音频资源改为按需加载，减少首包体积',
  '新增字体子集化，仅保留用到的字符',
  '新增资源版本管理，支持灰度更新',
  '增加资源完整性校验与自修复',
  '新增异常上报，捕获全局 JS 错误',
  '增加性能埋点，采集首屏与帧率数据',
  '新增灰度开关，支持按用户 ID 白名单',
  '优化战斗同步逻辑，降低网络抖动影响',
  '新增观战模式，支持好友围观',
  '增加录像回放与分享',
  '新增赛季系统，含段位、赛季奖励、结算',
  '优化匹配算法，缩短等待时间至 15 秒内',
  '新增师徒系统，含任务与出师奖励',
  '增加好友赠送体力',
  '新增每日商店刷新与限购',
  '优化背包排序规则，按品质与获得时间',
  '新增道具合成，支持 3 合 1 升级',
  '增加关卡星级评价与三星奖励',
  '新增无尽模式，按层数排行',
  '增加 Boss 挑战与伤害排行',
  '新增挂机收益领取，含快速收益',
  '优化新手 7 日目标，增加阶段奖励',
  '新增角色皮肤试穿与预览',
  '增加战斗回放慢放与镜头特写',
  '新增剧情跳过与剧情回顾',
  '增加自动寻路与任务追踪',
  '新增地图标记与坐标跳转',
  '优化商店页签切换卡顿',
  '新增客服工单入口，支持上传截图',
  '增加账号注销流程',
  '新增隐私政策与用户协议弹窗',
  '优化加载页进度条，改为真实资源进度',
  '新增断线重连提示与重连倒计时',
  '增加网络诊断工具，展示 RTT 与丢包率',
  '新增设备信息上报，便于兼容性排查',
  '优化弱网下的资源加载重试策略',
  '新增包体分析上报，统计各模块体积',
  '增加构建产物完整性校验',
  '新增多环境配置，区分开发、测试、生产',
  '优化构建速度，增量构建控制在 3 分钟内',
  '新增自动化冒烟用例，覆盖核心链路',
  '增加崩溃自动归因，关联版本与机型',
];

const DESCRIPTIONS = [
  '当前版本该能力缺失，导致部分场景需人工介入，影响体验一致性。需按产品文档补齐完整交互流程，并覆盖异常分支。',
  '现有实现存在性能瓶颈，在低端设备上表现明显。需要在保证功能不变的前提下优化，并提供优化前后的对比数据。',
  '客户侧提出明确诉求，需在本迭代内交付。验收时需提供可演示环境与操作说明，并配合完成一轮回归测试。',
  '该需求涉及多渠道差异，需分别适配并输出渠道差异说明文档，避免后续维护成本。',
  '需与现有系统解耦，采用配置化方案实现，便于后续运营调整，不引入新的硬编码逻辑。',
];

const CRITERIA_POOL = [
  '功能在微信、抖音双端表现一致',
  '低端机（Redmi Note 12）上帧率不低于 28FPS',
  '首包体积增量不超过 200KB',
  '异常场景有明确提示，不出现白屏或卡死',
  '相关埋点数据可在看板中查到',
  '通过 3 轮回归测试，无 P0/P1 缺陷',
  '兼容 iOS 16 及以上、Android 10 及以上',
  '接口失败时有重试机制，最多 3 次',
  '运营配置变更后 5 分钟内生效',
  '提供完整的接入文档与示例代码',
];

const COUNTS = [32, 26, 30, 22, 18, 24, 20, 16, 18, 14, 10, 12, 8, 12];

let seq = 0;

function nextId(): string {
  seq += 1;
  return `REQ-2026-${String(seq).padStart(4, '0')}`;
}

function statusOf(progress: number, rngStatus: number): ReqStatus {
  if (progress >= 100) {
    return rngStatus < 0.86 ? 'done' : 'pending_accept';
  }
  if (rngStatus < 0.5) return 'done';
  if (rngStatus < 0.66) return 'developing';
  if (rngStatus < 0.82) return 'confirmed';
  if (rngStatus < 0.92) return 'pending_review';
  if (rngStatus < 0.97) return 'pending_accept';
  return 'rejected';
}

export const requirements: Requirement[] = [];

projects.forEach((project, pIndex) => {
  const count = COUNTS[pIndex] ?? 12;
  const titlePool = rng.shuffle([...TITLES]);
  const sprintBase = Number(project.currentSprint.replace(/\D/g, '')) || 5;

  for (let i = 0; i < count; i += 1) {
    const title = i < titlePool.length ? (titlePool[i] as string) : `${titlePool[i % titlePool.length]}（二期）`;
    const r = rng.next();
    const status = statusOf(project.progress, r);
    const createdOffset = rng.int(3, 150);

    const typePool: ReqType[] = ['feature', 'feature', 'feature', 'optimize', 'tech', 'art', 'compliance'];
    const type = rng.pick(typePool);

    const priority: Priority = rng.weighted([
      { value: 'P0' as Priority, weight: 6 },
      { value: 'P1' as Priority, weight: 24 },
      { value: 'P2' as Priority, weight: 46 },
      { value: 'P3' as Priority, weight: 24 },
    ]);

    requirements.push({
      id: nextId(),
      projectId: project.id,
      title,
      type,
      priority,
      status,
      proposerId: rng.chance(0.45) ? 'C-U-001' : project.managerId,
      ownerId: rng.pick(project.memberIds),
      storyPoints: rng.pick([1, 2, 3, 3, 5, 5, 8, 13]),
      sprint: status === 'pending_review' ? null : `Sprint ${String(Math.max(1, sprintBase - rng.int(0, 4))).padStart(2, '0')}`,
      description: `${rng.pick(DESCRIPTIONS)} 涉及模块：${rng.pick(['登录与账号', '战斗系统', '资源加载', '商城与支付', '社交与分享', '成长养成', '数据与埋点', 'UI 与交互'])}。`,
      acceptanceCriteria: rng.picks(CRITERIA_POOL, rng.int(3, 5)),
      createdAt: daysAgo(createdOffset, rng.int(9, 19), rng.int(0, 59)),
      updatedAt: daysAgo(rng.int(0, Math.max(1, createdOffset - 1)), rng.int(9, 20), rng.int(0, 59)),
    });
  }
});

export const requirementsById = new Map(requirements.map((r) => [r.id, r]));

export function requirementsOfProject(projectId: string): Requirement[] {
  return requirements.filter((r) => r.projectId === projectId);
}

export { rng as reqRng };
