import type { Build, BuildStage } from '@/types/models';
import type { BuildStatus } from '@/types/enums';
import { projects } from './projects';
import { daysAgo, makeRng, toLocalISO } from '../seed';

const rng = makeRng(20260606);

const COMMITS = [
  'fix: 修复签到弹窗关闭后进度未刷新',
  'feat: 新增好友排行榜周榜切换',
  'refactor: 拆分战斗模块资源加载逻辑',
  'chore: 升级引擎至 3.8.3',
  'fix: 调整低端机贴图降级阈值',
  'feat: 接入抖音侧边栏复访能力',
  'perf: 图集合并减少 32 个 DrawCall',
  'fix: 修正支付回调重复弹窗问题',
  'style: 统一按钮圆角与间距',
  'feat: 新增七日登录奖励配置表',
  'fix: 修复 iOS 静音键下音频不播放',
  'refactor: 抽离通用弹窗组件',
  'feat: 新手引导流程压缩至 90 秒',
  'chore: 更新分包配置与 CDN 前缀',
  'fix: 修正背包数量显示为负数',
  'perf: 首屏资源预加载改为并发生成',
  'feat: 增加战斗二倍速与跳过',
  'fix: 修复横屏切换后 UI 错位',
  'test: 补充支付链路冒烟用例',
  'feat: 新增激励视频广告位',
  'fix: 修复分包偶发 404 重试成功',
  'chore: 移除调试日志与 mock 开关',
  'feat: 适配 Telegram WebApp 主题色',
  'fix: 修正排行榜第 100 名后数据为空',
  'perf: 音频改为按需加载，首包减少 620KB',
  'feat: 新增公会捐献与科技树',
  'fix: 修复弱网重连后角色卡边界',
  'refactor: 统一埋点上报入口',
  'chore: 升级构建脚本至 2.4.0',
  'fix: 修复 Facebook 端首包超限告警',
];

const BRANCHES = ['release/1.4', 'release/1.0', 'develop', 'feature/sign-in', 'hotfix/pay-callback', 'release/3.2'];

const ASSET_NAMES = [
  { name: 'main_hud.png', type: 'image', raw: 1840 },
  { name: 'battle_bg_03.jpg', type: 'image', raw: 2260 },
  { name: 'ui_atlas_common.png', type: 'atlas', raw: 3120 },
  { name: 'character_lina_01.png', type: 'image', raw: 1480 },
  { name: 'bgm_battle_theme.mp3', type: 'audio', raw: 2860 },
  { name: 'sfx_click_pack.mp3', type: 'audio', raw: 640 },
  { name: 'SourceHanSans-Bold.ttf', type: 'font', raw: 4200 },
  { name: 'effect_water_flow.frag', type: 'shader', raw: 24 },
  { name: 'shop_panel.webp', type: 'image', raw: 980 },
  { name: 'level_map_forest.png', type: 'image', raw: 2640 },
  { name: 'ui_atlas_icons.png', type: 'atlas', raw: 1720 },
  { name: 'pet_idle_01.png', type: 'image', raw: 1120 },
  { name: 'loading_tips.json', type: 'config', raw: 18 },
  { name: 'bgm_main_city.mp3', type: 'audio', raw: 3240 },
];

const COMPOSITION_COLORS: Record<string, string> = {
  代码: '#4B5BF5',
  图片: '#0BA5EC',
  音频: '#17B26A',
  配置: '#F79009',
  字体: '#7A5AF8',
  其他: '#8A94A6',
};

const STAGE_NAMES = ['拉取代码', '安装依赖', '资源构建', '打包', '上传 CDN'];

function hex(n: number): string {
  let s = '';
  for (let i = 0; i < n; i += 1) s += '0123456789abcdef'[rng.int(0, 15)];
  return s;
}

function logsFor(stage: string, failed: boolean, projectCode: string): string[] {
  const t = () => {
    const h = rng.int(10, 20);
    const m = rng.int(0, 59);
    const s = rng.int(0, 59);
    return `[${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}]`;
  };
  const base: Record<string, string[]> = {
    拉取代码: [
      `${t()} $ git fetch --depth=1 origin +refs/heads/*`,
      `${t()} HEAD is now at ${hex(8)} ${projectCode.toLowerCase()} release build`,
      `${t()} 工作区干净，开始构建`,
    ],
    安装依赖: [
      `${t()} $ npm ci --prefer-offline --no-audit`,
      `${t()} added 428 packages in 34s`,
      `${t()} 缓存命中率 82%（node_modules 复用）`,
    ],
    资源构建: [
      `${t()} $ node scripts/build-assets.js --env=prod`,
      `${t()} 处理图集 24 组，合并纹理 318 张`,
      `${t()} 图片压缩：pngquant 节省 1.8MB，webp 转换 62 张`,
      `${t()} 音频转码：mp3 128kbps，节省 940KB`,
      `${t()} 字体子集化：保留 2840 字符，输出 386KB`,
    ],
    打包: [
      `${t()} $ node scripts/bundle.js --platform=all`,
      `${t()} 生成微信分包 3 个，抖音分包 3 个`,
      `${t()} 产物体积 18.6MB，较上次 +420KB`,
      `${t()} 首包 3.82MB，低于 4MB 上限`,
    ],
    '上传 CDN': [
      `${t()} 上传 186 个文件至 cdn.nexusplay.studio/${projectCode.toLowerCase()}/`,
      `${t()} 刷新 CDN 缓存，节点同步完成`,
      `${t()} 产物地址已写入构建记录`,
    ],
  };

  const lines = base[stage] ?? [];

  if (failed && stage === '资源构建') {
    return [
      ...lines.slice(0, 3),
      `${t()} ERROR 资源缺失：assets/ui/atlas/shop_panel.webp 未找到`,
      `${t()} 该资源在 1.4.2 版本被重命名，但 scene/shop.scene 仍引用旧路径`,
      `${t()} 构建终止，退出码 1`,
    ];
  }
  if (failed && stage === '打包') {
    return [
      ...lines.slice(0, 2),
      `${t()} ERROR 首包体积 4.21MB 超出微信 4MB 限制`,
      `${t()} 超出 210KB，主要来自 ui_atlas_common.png（3.1MB 未压缩）`,
      `${t()} 建议：开启 pngquant 或拆分至分包后重试`,
      `${t()} 构建终止，退出码 1`,
    ];
  }
  if (failed && stage === '安装依赖') {
    return [
      ...lines.slice(0, 2),
      `${t()} ERROR 依赖解析失败：engine-adaptor@2.4.1 与 cocos@3.8.3 版本冲突`,
      `${t()} peerDependency 要求 cocos >= 3.8.0 < 3.8.2`,
      `${t()} 构建终止，退出码 1`,
    ];
  }
  return lines;
}

let buildSeq = 1080;

export const builds: Build[] = [];

projects.forEach((project) => {
  const count =
    project.status === 'bidding'
      ? 2
      : project.status === 'discovery'
        ? 6
        : project.status === 'in_progress'
          ? rng.int(40, 62)
          : project.status === 'acceptance'
            ? rng.int(32, 46)
            : rng.int(22, 38);

  for (let i = 0; i < count; i += 1) {
    buildSeq += 1;
    const offsetDays = Math.round((i / count) * 88) + rng.int(0, 2);
    const createdAt = daysAgo(offsetDays, rng.int(9, 21), rng.int(0, 59));

    const roll = rng.next();
    let status: BuildStatus = 'success';
    if (i === 0 && project.status === 'in_progress') status = 'running';
    else if (roll > 0.93) status = 'failed';
    else if (roll > 0.91) status = 'canceled';

    const progress = status === 'running' ? rng.int(35, 72) : 100;
    const artifactMB = rng.float(9, 26, 1);
    const artifactSize = Math.round(artifactMB * 1024 * 1024);

    const failedStageIndex = status === 'failed' ? rng.pick([1, 2, 3]) : -1;

    const stages: BuildStage[] = STAGE_NAMES.map((name, idx) => {
      let stageStatus: BuildStage['status'] = 'success';
      if (status === 'failed') {
        if (idx === failedStageIndex) stageStatus = 'failed';
        else if (idx > failedStageIndex) stageStatus = 'pending';
      }
      if (status === 'running') {
        if (idx < 3) stageStatus = 'success';
        else if (idx === 3) stageStatus = 'running';
        else stageStatus = 'pending';
      }
      if (status === 'canceled' && idx > 1) stageStatus = 'pending';

      return {
        name,
        status: stageStatus,
        durationSec: stageStatus === 'pending' ? 0 : rng.int(8, 96),
        log: stageStatus === 'pending' ? [] : logsFor(name, stageStatus === 'failed', project.code),
      };
    });

    const durationSec =
      status === 'running'
        ? stages.reduce((s, st) => s + st.durationSec, 0)
        : stages.reduce((s, st) => s + st.durationSec, 0);

    const codePct = rng.float(38, 46, 1);
    const imagePct = rng.float(27, 34, 1);
    const audioPct = rng.float(10, 16, 1);
    const configPct = rng.float(4, 8, 1);
    const fontPct = rng.float(2, 5, 1);
    const otherPct = Number((100 - codePct - imagePct - audioPct - configPct - fontPct).toFixed(1));

    const composition = [
      { name: '代码', size: Math.round((artifactSize * codePct) / 100), color: COMPOSITION_COLORS['代码'] as string },
      { name: '图片', size: Math.round((artifactSize * imagePct) / 100), color: COMPOSITION_COLORS['图片'] as string },
      { name: '音频', size: Math.round((artifactSize * audioPct) / 100), color: COMPOSITION_COLORS['音频'] as string },
      { name: '配置', size: Math.round((artifactSize * configPct) / 100), color: COMPOSITION_COLORS['配置'] as string },
      { name: '字体', size: Math.round((artifactSize * fontPct) / 100), color: COMPOSITION_COLORS['字体'] as string },
      { name: '其他', size: Math.round((artifactSize * otherPct) / 100), color: COMPOSITION_COLORS['其他'] as string },
    ];

    const topAssets = rng.picks(ASSET_NAMES, 8).map((a) => {
      const rawSize = a.raw * 1024;
      const gzipSize = Math.round(rawSize * rng.float(0.28, 0.88, 2));
      return {
        name: a.name,
        type: a.type,
        rawSize,
        gzipSize,
        ratio: Number(((rawSize / artifactSize) * 100).toFixed(1)),
      };
    });

    const firstPackMB = rng.float(2.8, 4.6, 2);
    const channelLimit = 4;

    builds.push({
      id: `BLD-2026-${String(buildSeq)}`,
      buildNumber: buildSeq,
      projectId: project.id,
      branch: rng.pick(BRANCHES),
      commitSha: hex(8),
      commitMessage: rng.pick(COMMITS),
      author: rng.pick(project.memberIds),
      trigger: rng.weighted([
        { value: 'push' as const, weight: 62 },
        { value: 'manual' as const, weight: 26 },
        { value: 'schedule' as const, weight: 8 },
        { value: 'tag' as const, weight: 4 },
      ]),
      status,
      progress,
      stages,
      durationSec,
      artifactSize,
      sizeDelta: rng.int(-820, 640) * 1024,
      env: { node: '20.11.1', engine: project.engineVersion, builder: 'nexus-builder/2.4.1' },
      qualityGates: [
        {
          name: '包体大小',
          value: `${artifactMB.toFixed(1)} MB`,
          passed: artifactMB < 24,
          hint: artifactMB >= 24 ? '超出建议值 24MB，建议拆分资源' : undefined,
        },
        {
          name: '首包体积',
          value: `${firstPackMB.toFixed(2)} MB`,
          passed: firstPackMB <= channelLimit,
          hint: firstPackMB > channelLimit ? `超出微信 ${channelLimit}MB 上限 ${(firstPackMB - channelLimit).toFixed(2)}MB` : undefined,
        },
        {
          name: '未压缩图片',
          value: `${rng.int(0, 14)} 张`,
          passed: rng.chance(0.7),
          hint: '存在未压缩 PNG，建议转 WebP 或启用 pngquant',
        },
        {
          name: '循环依赖',
          value: `${rng.int(0, 3)} 处`,
          passed: rng.chance(0.82),
          hint: '检测到模块循环引用，可能影响首屏加载顺序',
        },
      ],
      composition,
      topAssets,
      createdAt,
      finishedAt: status === 'running' ? null : createdAt,
    });
  }
});

builds.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

export const buildsById = new Map(builds.map((b) => [b.id, b]));

export function buildsOfProject(projectId: string): Build[] {
  return builds.filter((b) => b.projectId === projectId);
}

export function latestBuild(projectId: string): Build | undefined {
  return builds.find((b) => b.projectId === projectId);
}

export { toLocalISO };
