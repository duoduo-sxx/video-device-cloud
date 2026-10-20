import type { Release } from '@/types/models';
import type { ReleaseStatus } from '@/types/enums';
import { projects } from './projects';
import { builds } from './builds';
import { daysAgo, makeRng } from '../seed';

const rng = makeRng(20260808);

const REVIEW_NOTES = [
  '诱导分享：分享文案含"必得奖励"等诱导性表述，请修改后重新提交',
  '抽奖概率公示不完整，需在活动页展示完整概率表',
  '首次进入未弹出隐私政策弹窗，不符合审核规范',
  '游戏内存在未备案的第三方支付入口',
  '首包体积超过 4MB 限制，请拆分资源后重新提交',
  '实名认证流程不符合规范，缺少未成年人时长提示',
  '标题含"官方"字样，涉嫌误导用户',
  '广告位关闭按钮过小，不符合用户体验规范',
];

const RELEASE_NOTES = [
  '修复已知问题，优化首屏加载速度约 18%',
  '新增每日签到与好友排行榜，调整新手引导流程',
  '新增限时活动框架，优化支付链路稳定性',
  '优化战斗表现，新增二倍速与跳过功能',
  '修复低端机黑屏与音频异常问题',
  '新增皮肤商店与首充双倍活动',
  '接入渠道侧边栏复访能力，优化分享卡片样式',
  '资源压缩与分包优化，首包减少 620KB',
  '新增赛季系统与段位奖励',
  '修复支付回调重复弹窗，优化弱网重连',
];

const GRAYSCALE_STEPS = [0, 5, 10, 30, 50, 100];

function bumpVersion(version: string, back: number): string {
  const parts = version.split('.').map((v) => Number(v.replace(/\D/g, '')) || 0);
  let [major, minor, patch] = [parts[0] ?? 1, parts[1] ?? 0, parts[2] ?? 0];
  for (let i = 0; i < back; i += 1) {
    patch -= 1;
    if (patch < 0) {
      patch = 9;
      minor -= 1;
      if (minor < 0) {
        minor = 9;
        major -= 1;
      }
    }
  }
  return `${Math.max(0, major)}.${Math.max(0, minor)}.${patch}`;
}

let seq = 0;

export const releases: Release[] = [];

projects.forEach((project, pIndex) => {
  const projectBuilds = builds.filter((b) => b.projectId === project.id);
  const versionCount = pIndex < 6 ? 12 : 9;

  for (let v = 0; v < versionCount; v += 1) {
    const version = bumpVersion(project.currentVersion, v);
    const isLatest = v === 0;
    const daysBack = v * 6 + rng.int(0, 3);

    project.platforms.forEach((channel) => {
      seq += 1;

      let status: ReleaseStatus;
      if (isLatest) {
        if (project.status === 'bidding' || project.status === 'discovery') {
          status = 'draft';
        } else if (project.id === 'PRJ-2026-014' && channel === 'douyin') {
          status = 'rejected';
        } else if (project.id === 'PRJ-2026-011' && channel === 'wechat') {
          status = 'reviewing';
        } else if (project.status === 'acceptance') {
          status = 'grayscale';
        } else {
          status = rng.weighted([
            { value: 'online' as ReleaseStatus, weight: 55 },
            { value: 'reviewing' as ReleaseStatus, weight: 20 },
            { value: 'grayscale' as ReleaseStatus, weight: 15 },
            { value: 'rejected' as ReleaseStatus, weight: 10 },
          ]);
        }
      } else {
        status = rng.chance(0.88) ? 'online' : 'offline';
      }

      const submitAt = status === 'draft' ? null : daysAgo(daysBack, rng.int(10, 20), rng.int(0, 59));
      const reviewDurationHours =
        status === 'draft' ? null : status === 'reviewing' ? rng.int(2, 30) : rng.float(2.5, 42, 1);

      const build = projectBuilds[rng.int(0, Math.max(0, Math.min(8, projectBuilds.length - 1)))];

      releases.push({
        id: `REL-2026-${String(200 + seq).padStart(4, '0')}`,
        projectId: project.id,
        version,
        channel,
        status,
        grayscalePercent: status === 'grayscale' ? rng.pick([5, 10, 30, 50]) : status === 'online' ? 100 : GRAYSCALE_STEPS[0],
        submitAt,
        reviewDurationHours,
        reviewNote: status === 'rejected' ? rng.pick(REVIEW_NOTES) : null,
        publishAt: status === 'online' || status === 'offline' ? daysAgo(Math.max(0, daysBack - 1), rng.int(10, 18), rng.int(0, 59)) : null,
        packageSize: rng.int(9, 27) * 1024 * 1024 + rng.int(0, 999) * 1024,
        releaseNote: RELEASE_NOTES[rng.int(0, RELEASE_NOTES.length - 1)] as string,
        operatorId: rng.pick(['U-026', 'U-027']),
        buildId: build?.id ?? '',
        rollbackFrom: rng.chance(0.04) ? bumpVersion(version, -1) : null,
      });
    });
  }
});

export const releasesById = new Map(releases.map((r) => [r.id, r]));

export function releasesOfProject(projectId: string): Release[] {
  return releases.filter((r) => r.projectId === projectId);
}

/** 用于发布矩阵：按版本倒序，取最近 6 个版本 */
export function versionColumns(projectId: string): string[] {
  const list = releasesOfProject(projectId);
  const versions: string[] = [];
  list.forEach((r) => {
    if (!versions.includes(r.version)) versions.push(r.version);
  });
  return versions.slice(0, 6);
}
