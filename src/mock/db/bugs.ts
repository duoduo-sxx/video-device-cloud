import type { Bug } from '@/types/models';
import type { BugSeverity, BugStatus, Priority, ReproRate } from '@/types/enums';
import { CHANNELS } from '@/types/enums';
import { projects } from './projects';
import { builds } from './builds';
import { daysAgo, makeRng } from '../seed';

const rng = makeRng(20260707);

const SCENES = [
  '微信小游戏首次进入战斗场景时',
  '抖音小游戏从后台切回前台时',
  '在背包界面点击一键整理时',
  '进入第 3 章资源加载到 60% 时',
  '支付宝渠道支付回调返回时',
  '关闭分享面板返回游戏时',
  '新手引导第 5 步点击目标区域时',
  '断网 10 秒后恢复网络时',
  '连续快速点击抽奖按钮时',
  '横竖屏切换后回到主界面时',
  'iOS 17.5 Safari 下播放背景音乐时',
  '低端安卓机进入主城场景时',
  '商城页签快速滑动时',
  '组队副本匹配成功进入战斗时',
  '每日签到弹窗关闭后刷新界面时',
  '激励视频广告播放结束后时',
  '退出登录再重新登录时',
  '加载第 3 个分包时',
  '在设置页切换语言后返回时',
  '战斗中使用加速道具时',
  '打开邮件附件领取奖励时',
  '排行榜滚动到第 100 名时',
  '弱网下点击重试按钮时',
  '从微信分享链接首次进入时',
  '在结算页点击再来一局时',
];

const SYMPTOMS = [
  '黑屏约 2 秒后才恢复渲染',
  '音频不恢复播放，需重进场景',
  '道具数量显示为负数',
  '加载进度条卡在 60% 不再前进',
  '页面停留在分享面板无法返回',
  '按钮点击无任何响应',
  '角色位置与碰撞体错位',
  '界面出现明显闪烁',
  '内存占用持续增长至 800MB 以上',
  '直接崩溃退出到桌面',
  '道具图标显示为白色方块',
  '倒计时显示为 00:00 且不刷新',
  '排行榜数据为空',
  '战斗结算奖励未到账',
  '弹出两次支付确认框',
  '提示"网络异常"但网络正常',
  '场景贴图变成纯黑',
  '点击后跳转到错误页面',
  '音效重复播放两次',
  '输入框无法唤起键盘',
  '加载进度回退到 0',
  '角色卡在场景边界无法移动',
  '每日任务进度不累计',
  '按钮文案显示为英文',
  '帧率降至 15 左右并伴随画面撕裂',
];

const CONDITIONS = [
  '低端机必现',
  '仅 iOS 17 以上复现',
  '弱网环境下偶现',
  '抖音渠道必现，微信端正常',
  '高频复现，10 次约 7 次',
  '偶现，概率约 3%',
  '必现，影响全部用户',
  '仅华为机型复现',
  '更新包体后首次启动必现',
  '连续操作超过 5 分钟后出现',
  '清理缓存后不再复现',
  '仅横屏状态下出现',
];

const MODULES = [
  '战斗系统',
  '资源加载',
  '支付',
  'UI 交互',
  '社交分享',
  '账号登录',
  '数据统计',
  '商城',
  '新手引导',
  '音频',
  '关卡',
  '背包',
  '排行榜',
  '广告',
];

const ACTIONS = [
  '点击底部"商城"页签',
  '进入第 3 章第 2 关并开始战斗',
  '点击"一键整理"按钮',
  '连续点击抽奖按钮 10 次',
  '切到后台等待 5 秒后返回',
  '打开设置页关闭背景音乐',
  '在弱网环境下点击重试',
  '滑动排行榜到底部',
  '领取邮件附件奖励',
  '点击分享并选择好友',
  '切换语言为 English 后返回',
  '点击"再来一局"',
  '打开背包并快速滑动',
  '使用二倍速道具',
  '切换横竖屏',
];

const DEVICES = [
  'iPhone 14（iOS 17.6）',
  'iPhone 12（iOS 16.7）',
  'Redmi Note 12（Android 13）',
  '小米 14（Android 14）',
  '华为 Mate 60 Pro（HarmonyOS 4.2）',
  'OPPO Reno 11（ColorOS 14）',
  'vivo X100（OriginOS 4）',
  'iPad Air 5（iPadOS 17.4）',
  '荣耀 90（MagicOS 7.2）',
  '三星 Galaxy S23（Android 14）',
];

const BROWSERS = ['Chrome 128', 'Chrome 126', 'Safari 17.4', 'Safari 16.6', '微信 XWeb 128', 'UC 15.6'];

const EXPECT_PAIRS: { expected: string; actual: string }[] = [
  { expected: '界面正常渲染，无黑屏或白屏', actual: '画面全黑，2 秒后才出现 UI' },
  { expected: '音频从暂停处继续播放', actual: '音频静音，需退出重进场景才恢复' },
  { expected: '数量显示为不小于 0 的整数', actual: '显示为 -1 或 -3 等负数' },
  { expected: '加载进度正常推进至 100%', actual: '进度条停在 60% 不动，无超时提示' },
  { expected: '关闭分享面板后回到游戏主界面', actual: '停留在分享面板，返回键无效' },
  { expected: '点击后 200ms 内出现响应', actual: '连续点击无反应，需重启游戏' },
  { expected: '角色位置与碰撞体一致', actual: '角色嵌入墙体或悬空' },
  { expected: '支付成功后奖励立即到账', actual: '提示支付成功但背包无对应道具' },
];

const COUNTS = [72, 48, 44, 52, 18, 40, 22, 20, 34, 38, 12, 26, 6, 48];

let seq = 0;

export const bugs: Bug[] = [];

projects.forEach((project, pIndex) => {
  const count = COUNTS[pIndex] ?? 20;
  const projectBuilds = builds.filter((b) => b.projectId === project.id);
  const isOnline = project.status === 'online' || project.status === 'maintenance';

  for (let i = 0; i < count; i += 1) {
    seq += 1;

    const scene = rng.pick(SCENES);
    const symptom = rng.pick(SYMPTOMS);
    const condition = rng.pick(CONDITIONS);

    const r = rng.next();
    let status: BugStatus;
    if (isOnline) {
      if (r < 0.78) status = 'closed';
      else if (r < 0.86) status = 'verified';
      else if (r < 0.92) status = 'fixed';
      else if (r < 0.96) status = 'in_progress';
      else status = 'confirmed';
    } else {
      if (r < 0.52) status = 'closed';
      else if (r < 0.6) status = 'verified';
      else if (r < 0.68) status = 'fixed';
      else if (r < 0.78) status = 'in_progress';
      else if (r < 0.86) status = 'confirmed';
      else if (r < 0.93) status = 'new';
      else if (r < 0.97) status = 'reopened';
      else status = 'rejected';
    }

    const severity: BugSeverity = rng.weighted([
      { value: 'blocker' as BugSeverity, weight: 3 },
      { value: 'critical' as BugSeverity, weight: 8 },
      { value: 'major' as BugSeverity, weight: 26 },
      { value: 'minor' as BugSeverity, weight: 43 },
      { value: 'trivial' as BugSeverity, weight: 20 },
    ]);

    const priority: Priority =
      severity === 'blocker' ? 'P0' : severity === 'critical' ? 'P1' : severity === 'major' ? rng.pick(['P1', 'P2']) : rng.pick(['P2', 'P3']);

    const createdOffset = rng.int(0, 88);
    const closed = status === 'closed' || status === 'rejected';
    const pair = rng.pick(EXPECT_PAIRS);

    const channelId = project.platforms[rng.int(0, project.platforms.length - 1)] ?? 'h5';
    const device = rng.pick(DEVICES);
    const stepCount = rng.int(2, 4);
    const midSteps = rng.picks(ACTIONS, stepCount);

    bugs.push({
      id: `BUG-2026-${String(seq).padStart(4, '0')}`,
      projectId: project.id,
      title: `${scene}${symptom}，${condition}`,
      severity,
      priority,
      status,
      module: rng.pick(MODULES),
      reproduceRate: rng.pick<ReproRate>(['always', 'high', 'sometimes', 'sometimes', 'once']),
      environment: {
        channel: channelId,
        version: project.currentVersion,
        device,
        os: device.match(/（(.+)）/)?.[1] ?? 'Android 14',
        browser: rng.pick(BROWSERS),
      },
      steps: [
        `使用 ${device} 打开${CHANNELS[channelId].name}`,
        '完成登录并进入主界面',
        ...midSteps,
        `观察界面表现`,
      ],
      expected: pair.expected,
      actual: pair.actual,
      assigneeId: rng.pick(project.memberIds),
      reporterId: rng.chance(0.7) ? 'U-021' : rng.pick(project.memberIds),
      buildId: projectBuilds.length > 0 ? (projectBuilds[rng.int(0, Math.min(6, projectBuilds.length - 1))] as { id: string }).id : null,
      attachmentCount: rng.chance(0.55) ? rng.int(1, 4) : 0,
      createdAt: daysAgo(createdOffset, rng.int(9, 20), rng.int(0, 59)),
      closedAt: closed ? daysAgo(Math.max(0, createdOffset - rng.int(1, 6)), rng.int(10, 19), rng.int(0, 59)) : null,
    });
  }
});

export const bugsById = new Map(bugs.map((b) => [b.id, b]));

export function bugsOfProject(projectId: string): Bug[] {
  return bugs.filter((b) => b.projectId === projectId);
}

export const openBugs = bugs.filter((b) => !['closed', 'rejected'].includes(b.status));
