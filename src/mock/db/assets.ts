import type { Asset } from '@/types/models';
import type { AssetType } from '@/types/enums';
import { projects } from './projects';
import { daysAgo, makeRng } from '../seed';

const rng = makeRng(20261111);

const NAMES: { path: string; type: AssetType; group: Asset['group']; format: string }[] = [
  { path: 'assets/ui/atlas/main_hud', type: 'atlas', group: 'image', format: 'PNG' },
  { path: 'assets/ui/atlas/shop_panel', type: 'atlas', group: 'image', format: 'WEBP' },
  { path: 'assets/ui/atlas/icons', type: 'atlas', group: 'image', format: 'PNG' },
  { path: 'assets/ui/atlas/bag_icons', type: 'atlas', group: 'image', format: 'PNG' },
  { path: 'assets/ui/single/loading_bg', type: 'texture', group: 'image', format: 'JPG' },
  { path: 'assets/ui/single/logo', type: 'texture', group: 'image', format: 'PNG' },
  { path: 'assets/ui/single/btn_common', type: 'texture', group: 'image', format: 'PNG' },
  { path: 'assets/ui/single/panel_frame', type: 'texture', group: 'image', format: 'PNG' },
  { path: 'assets/character/lina/idle_01', type: 'texture', group: 'image', format: 'PNG' },
  { path: 'assets/character/lina/attack_01', type: 'texture', group: 'image', format: 'PNG' },
  { path: 'assets/character/guard/run_01', type: 'texture', group: 'image', format: 'PNG' },
  { path: 'assets/character/boss/mecha_idle', type: 'texture', group: 'image', format: 'PNG' },
  { path: 'assets/scene/forest/tree_01', type: 'texture', group: 'image', format: 'WEBP' },
  { path: 'assets/scene/forest/ground_tile', type: 'texture', group: 'image', format: 'WEBP' },
  { path: 'assets/scene/city/building_a', type: 'texture', group: 'image', format: 'WEBP' },
  { path: 'assets/scene/deepsea/bg_far', type: 'texture', group: 'image', format: 'JPG' },
  { path: 'assets/scene/deepsea/bg_near', type: 'texture', group: 'image', format: 'WEBP' },
  { path: 'assets/audio/bgm/battle_theme', type: 'audio', group: 'audio', format: 'MP3' },
  { path: 'assets/audio/bgm/main_city', type: 'audio', group: 'audio', format: 'MP3' },
  { path: 'assets/audio/bgm/deepsea_ambient', type: 'audio', group: 'audio', format: 'MP3' },
  { path: 'assets/audio/sfx/btn_click', type: 'audio', group: 'audio', format: 'MP3' },
  { path: 'assets/audio/sfx/level_up', type: 'audio', group: 'audio', format: 'MP3' },
  { path: 'assets/audio/sfx/coin_pick', type: 'audio', group: 'audio', format: 'MP3' },
  { path: 'assets/audio/sfx/battle_hit', type: 'audio', group: 'audio', format: 'MP3' },
  { path: 'assets/fonts/SourceHanSans-Regular', type: 'font', group: 'font', format: 'TTF' },
  { path: 'assets/fonts/SourceHanSans-Bold', type: 'font', group: 'font', format: 'TTF' },
  { path: 'assets/fonts/BarlowCondensed-Bold', type: 'font', group: 'font', format: 'TTF' },
  { path: 'assets/shader/water_flow', type: 'shader', group: 'code', format: 'FRAG' },
  { path: 'assets/shader/glow_outline', type: 'shader', group: 'code', format: 'FRAG' },
  { path: 'assets/shader/card_flip', type: 'shader', group: 'code', format: 'FRAG' },
  { path: 'assets/anim/lina_idle', type: 'config', group: 'anim', format: 'JSON' },
  { path: 'assets/anim/guard_attack', type: 'config', group: 'anim', format: 'JSON' },
  { path: 'assets/video/opening', type: 'video', group: 'image', format: 'MP4' },
  { path: 'assets/config/level_table', type: 'config', group: 'config', format: 'JSON' },
  { path: 'assets/config/item_table', type: 'config', group: 'config', format: 'JSON' },
  { path: 'assets/config/shop_table', type: 'config', group: 'config', format: 'JSON' },
  { path: 'assets/ui/single/rank_badge', type: 'texture', group: 'image', format: 'PNG' },
  { path: 'assets/ui/single/avatar_frame', type: 'texture', group: 'image', format: 'PNG' },
  { path: 'assets/scene/space/nebula_bg', type: 'texture', group: 'image', format: 'WEBP' },
  { path: 'assets/character/pet/idle_01', type: 'texture', group: 'image', format: 'PNG' },
];

export const assets: Asset[] = [];

let seq = 0;

projects.forEach((project) => {
  if (project.status === 'bidding') return;
  const count = project.status === 'discovery' ? 8 : rng.int(18, 34);

  for (let i = 0; i < count; i += 1) {
    seq += 1;
    const base = NAMES[(i + project.code.length) % NAMES.length] as (typeof NAMES)[number];
    const ext = base.format.toLowerCase();
    const isImage = base.group === 'image';

    const refCount = rng.chance(0.16) ? 0 : rng.int(1, 46);
    const size = isImage ? rng.int(40, 3200) * 1024 : base.group === 'audio' ? rng.int(60, 3800) * 1024 : rng.int(2, 420) * 1024;
    const rawSize = Math.round(size * rng.float(1.1, 2.6, 2));

    assets.push({
      id: `AST-${String(seq).padStart(5, '0')}`,
      name: `${base.path.split('/').pop()}.${ext}`,
      path: `${base.path}.${ext}`,
      projectId: project.id,
      type: base.type,
      format: base.format,
      width: isImage ? rng.pick([512, 1024, 1024, 2048, 2048, 4096]) : null,
      height: isImage ? rng.pick([512, 1024, 1024, 2048, 2048]) : null,
      size,
      rawSize,
      compression: isImage ? rng.pick(['pngquant', 'webp', 'basis', 'none', 'none']) : 'none',
      refCount,
      refs:
        refCount === 0
          ? []
          : rng.picks(
              [
                { scene: 'scene/main.scene', node: 'Canvas/HUD' },
                { scene: 'scene/battle.scene', node: 'Canvas/BattleUI' },
                { scene: 'scene/shop.scene', node: 'Canvas/ShopPanel' },
                { scene: 'prefab/character/Lina.prefab', node: 'Body' },
                { scene: 'scene/loading.scene', node: 'Canvas/Loading' },
                { scene: 'prefab/ui/RankItem.prefab', node: 'Icon' },
              ],
              Math.min(refCount, rng.int(1, 3)),
            ),
      group: base.group,
      license:
        base.type === 'font' || base.type === 'audio'
          ? {
              type: base.type === 'font' ? '商业授权（全平台）' : '免版税（CC0）',
              expireAt: rng.chance(0.4) ? '2027-0' + rng.int(1, 9) + '-15' : null,
            }
          : null,
      status: refCount === 0 ? 'unused' : rng.chance(0.12) ? 'pending_opt' : 'in_use',
      updatedAt: daysAgo(rng.int(0, 120), rng.int(9, 20), rng.int(0, 59)),
    });
  }
});

export const assetsById = new Map(assets.map((a) => [a.id, a]));

export const unusedAssets = assets.filter((a) => a.status === 'unused');

export const assetGroups = [
  { key: 'code' as const, label: '代码', budget: 4.2 },
  { key: 'image' as const, label: '图片', budget: 8.5 },
  { key: 'audio' as const, label: '音频', budget: 3.6 },
  { key: 'font' as const, label: '字体', budget: 0.9 },
  { key: 'anim' as const, label: '动画', budget: 1.2 },
  { key: 'config' as const, label: '配置', budget: 0.6 },
];
