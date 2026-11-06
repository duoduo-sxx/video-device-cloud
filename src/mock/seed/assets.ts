import type { AssetType, MediaAsset, SubtitleLine, SubtitleTrack, CapabilityId } from '@/types';
import { hashString, mulberry32, clamp } from '@/utils/format';

type ResKey = '4K' | '1080' | '720' | 'vertical' | 'audio' | 'image' | 'doc';

interface Row {
  t: string;
  ty: AssetType;
  d: number;
  r: ResKey;
  tags: string[];
  p: string;
}

const ROWS: Row[] = [
  { t: '2026 春季新品发布会 - 主会场全程', ty: 'video', d: 6156, r: '4K', tags: ['发布会', '4K', '品牌', '双语'], p: '2026 春季新品发布' },
  { t: '2026 春季新品发布会 - 产品体验区花絮', ty: 'video', d: 742, r: '1080', tags: ['发布会', '花絮'], p: '2026 春季新品发布' },
  { t: '2026 春季新品发布会 - 媒体专访合集', ty: 'video', d: 1864, r: '1080', tags: ['专访', '媒体'], p: '2026 春季新品发布' },
  { t: '品牌形象片 - 30s 精剪版', ty: 'video', d: 30, r: '4K', tags: ['品牌', '广告'], p: '品牌资产库' },
  { t: '品牌形象片 - 90s 完整版', ty: 'video', d: 92, r: '4K', tags: ['品牌', '广告'], p: '品牌资产库' },
  { t: '品牌形象片 - 2013 标清母版', ty: 'video', d: 186, r: '720', tags: ['品牌', '待修复', '标清'], p: '品牌资产库' },
  { t: '年度回顾片 - 2025 混剪', ty: 'video', d: 268, r: '1080', tags: ['年度', '混剪'], p: '品牌资产库' },
  { t: '产品功能演示 - 智能工作流', ty: 'video', d: 486, r: '1080', tags: ['产品', '演示'], p: '品牌资产库' },
  { t: '产品功能演示 - 移动端操作', ty: 'video', d: 322, r: 'vertical', tags: ['产品', '竖版'], p: '品牌资产库' },
  { t: '招聘宣传片 - 研发中心', ty: 'video', d: 214, r: '1080', tags: ['招聘', '雇主品牌'], p: '品牌资产库' },
  { t: '抖音 - 夏日防晒测评 - 竖版', ty: 'video', d: 58, r: 'vertical', tags: ['电商', '竖版', '测评'], p: '电商投放素材' },
  { t: '抖音 - 通勤穿搭 3 套 - 竖版', ty: 'video', d: 47, r: 'vertical', tags: ['电商', '竖版', '穿搭'], p: '电商投放素材' },
  { t: '小红书 - 护肤成分科普 - 竖版', ty: 'video', d: 63, r: 'vertical', tags: ['电商', '竖版', '科普'], p: '电商投放素材' },
  { t: '视频号 - 新品开箱 - 竖版', ty: 'video', d: 82, r: 'vertical', tags: ['电商', '开箱'], p: '电商投放素材' },
  { t: '快手 - 家居好物合集 - 竖版', ty: 'video', d: 76, r: 'vertical', tags: ['电商', '合集'], p: '电商投放素材' },
  { t: '直播间回放 - 618 大促专场', ty: 'video', d: 4328, r: '1080', tags: ['直播', '大促'], p: '电商投放素材' },
  { t: '直播切片 - 爆款讲解 01', ty: 'video', d: 96, r: 'vertical', tags: ['直播', '切片'], p: '电商投放素材' },
  { t: 'Python 数据分析 第07讲 - 数据清洗', ty: 'video', d: 3146, r: '1080', tags: ['课程', 'Python', '字幕'], p: '数据分析课程' },
  { t: 'Python 数据分析 第08讲 - 可视化', ty: 'video', d: 2872, r: '1080', tags: ['课程', 'Python', '字幕'], p: '数据分析课程' },
  { t: 'Python 数据分析 第09讲 - 特征工程', ty: 'video', d: 3320, r: '1080', tags: ['课程', 'Python'], p: '数据分析课程' },
  { t: '统计学基础 第03讲 - 假设检验', ty: 'video', d: 2640, r: '1080', tags: ['课程', '统计学'], p: '数据分析课程' },
  { t: 'SQL 实战 第12讲 - 窗口函数', ty: 'video', d: 2486, r: '1080', tags: ['课程', 'SQL', '字幕'], p: '数据分析课程' },
  { t: '内部培训 - 售后话术 v2', ty: 'video', d: 1982, r: '720', tags: ['培训', '售后'], p: '内部培训' },
  { t: '内部培训 - 客户拜访标准动作', ty: 'video', d: 1420, r: '720', tags: ['培训', '销售'], p: '内部培训' },
  { t: '季度全员会 - 2026 Q3', ty: 'video', d: 5412, r: '1080', tags: ['全员会', '内部'], p: '内部培训' },
  { t: '客户交付 - 智慧园区宣传片', ty: 'video', d: 156, r: '4K', tags: ['客户', '交付'], p: '客户交付' },
  { t: '客户交付 - 医院导览片', ty: 'video', d: 228, r: '1080', tags: ['客户', '交付'], p: '客户交付' },
  { t: '客户交付 - 校园宣传片 2026', ty: 'video', d: 264, r: '4K', tags: ['客户', '交付', '校园'], p: '客户交付' },
  { t: '会议录屏 - 产品评审 1017', ty: 'video', d: 3620, r: '1080', tags: ['会议', '录屏'], p: '内部培训' },
  { t: '会议录屏 - 架构评审 1015', ty: 'video', d: 2940, r: '720', tags: ['会议', '技术'], p: '内部培训' },
  { t: '科技早知道 EP128 - 端侧大模型', ty: 'audio', d: 2892, r: 'audio', tags: ['播客', 'AI', '双人'], p: '科技早知道' },
  { t: '科技早知道 EP129 - 多模态落地', ty: 'audio', d: 3120, r: 'audio', tags: ['播客', 'AI'], p: '科技早知道' },
  { t: '科技早知道 EP130 - 具身智能', ty: 'audio', d: 2760, r: 'audio', tags: ['播客', '机器人'], p: '科技早知道' },
  { t: '科技早知道 EP131 - 开源生态', ty: 'audio', d: 2544, r: 'audio', tags: ['播客', '开源'], p: '科技早知道' },
  { t: '客户访谈 - 制造业数字化', ty: 'audio', d: 1842, r: 'audio', tags: ['访谈', '客户'], p: '客户交付' },
  { t: '客户访谈 - 零售增长复盘', ty: 'audio', d: 1620, r: 'audio', tags: ['访谈', '零售'], p: '客户交付' },
  { t: '发布会同传录音 - 英文场', ty: 'audio', d: 4210, r: 'audio', tags: ['同传', '英文'], p: '2026 春季新品发布' },
  { t: '口播配音 - 品牌片男声', ty: 'audio', d: 92, r: 'audio', tags: ['配音', '男声'], p: '品牌资产库' },
  { t: '口播配音 - 产品介绍女声', ty: 'audio', d: 148, r: 'audio', tags: ['配音', '女声'], p: '品牌资产库' },
  { t: '背景音乐 - 科技感 30s', ty: 'audio', d: 30, r: 'audio', tags: ['BGM', '版权'], p: '品牌资产库' },
  { t: '课程音频 - 第07讲纯音轨', ty: 'audio', d: 3146, r: 'audio', tags: ['课程', '音轨'], p: '数据分析课程' },
  { t: '会议录音 - 周会 1013', ty: 'audio', d: 1860, r: 'audio', tags: ['会议', '录音'], p: '内部培训' },
  { t: '发布会主视觉 - KV 横版', ty: 'image', d: 0, r: 'image', tags: ['KV', '设计'], p: '2026 春季新品发布' },
  { t: '发布会主视觉 - KV 竖版', ty: 'image', d: 0, r: 'image', tags: ['KV', '竖版'], p: '2026 春季新品发布' },
  { t: '产品渲染图 - 白色', ty: 'image', d: 0, r: 'image', tags: ['产品', '渲染'], p: '品牌资产库' },
  { t: '产品渲染图 - 深空灰', ty: 'image', d: 0, r: 'image', tags: ['产品', '渲染'], p: '品牌资产库' },
  { t: '封面候选 - 发布会 01', ty: 'image', d: 0, r: 'image', tags: ['封面', '候选'], p: '2026 春季新品发布' },
  { t: '封面候选 - 播客 EP128', ty: 'image', d: 0, r: 'image', tags: ['封面', '播客'], p: '科技早知道' },
  { t: '课程封面 - Python 第07讲', ty: 'image', d: 0, r: 'image', tags: ['封面', '课程'], p: '数据分析课程' },
  { t: '电商主图 - 防晒喷雾', ty: 'image', d: 0, r: 'image', tags: ['电商', '主图'], p: '电商投放素材' },
  { t: '字幕 - 发布会主会场 中文 v3', ty: 'subtitle', d: 6156, r: 'doc', tags: ['字幕', '中文'], p: '2026 春季新品发布' },
  { t: '字幕 - 发布会主会场 英文 v2', ty: 'subtitle', d: 6156, r: 'doc', tags: ['字幕', '英文'], p: '2026 春季新品发布' },
  { t: '字幕 - 科技早知道 EP128 中文', ty: 'subtitle', d: 2892, r: 'doc', tags: ['字幕', '播客'], p: '科技早知道' },
  { t: '字幕 - Python 第07讲 中文', ty: 'subtitle', d: 3146, r: 'doc', tags: ['字幕', '课程'], p: '数据分析课程' },
  { t: '字幕 - 品牌形象片 中英双语', ty: 'subtitle', d: 92, r: 'doc', tags: ['字幕', '双语'], p: '品牌资产库' },
  { t: '字幕 - 客户访谈 制造业 中文', ty: 'subtitle', d: 1842, r: 'doc', tags: ['字幕', '访谈'], p: '客户交付' },
  { t: '工程 - 发布会多语分发 v4', ty: 'project', d: 0, r: 'doc', tags: ['工程', '流水线'], p: '2026 春季新品发布' },
  { t: '工程 - 短视频一键成片 v2', ty: 'project', d: 0, r: 'doc', tags: ['工程', '短视频'], p: '电商投放素材' },
  { t: '工程 - 课程字幕标准化 v3', ty: 'project', d: 0, r: 'doc', tags: ['工程', '课程'], p: '数据分析课程' },
  { t: '工程 - 播客精剪 v1', ty: 'project', d: 0, r: 'doc', tags: ['工程', '播客'], p: '科技早知道' },
  { t: '工程 - 老片修复 v1', ty: 'project', d: 0, r: 'doc', tags: ['工程', '修复'], p: '品牌资产库' },
];

const RES: Record<ResKey, { w?: number; h?: number; kbps: number; fmt: string; codec: string; fps?: number }> = {
  '4K': { w: 3840, h: 2160, kbps: 12000, fmt: 'MP4', codec: 'H.265', fps: 25 },
  '1080': { w: 1920, h: 1080, kbps: 4500, fmt: 'MP4', codec: 'H.264', fps: 25 },
  '720': { w: 1280, h: 720, kbps: 2200, fmt: 'MP4', codec: 'H.264', fps: 30 },
  vertical: { w: 1080, h: 1920, kbps: 3600, fmt: 'MP4', codec: 'H.264', fps: 30 },
  audio: { kbps: 320, fmt: 'MP3', codec: 'MP3' },
  image: { kbps: 0, fmt: 'PNG', codec: 'PNG' },
  doc: { kbps: 0, fmt: 'TXT', codec: 'UTF-8' },
};

const SENTENCES = [
  '这次我们把端侧推理的延迟压到了 38 毫秒，基本做到了实时响应。',
  '在真实网络环境下，首字延迟的中位数是 210 毫秒。',
  '大家可以看到，左边是上一代的方案，右边是今天发布的版本。',
  '我们在三个维度上做了取舍：功耗、成本，还有可维护性。',
  '接下来请看一段实际拍摄的演示。',
  '这个能力其实在去年就已经开始内部验证了。',
  '多模态的关键不是把模型堆大，而是让不同模态对齐到同一个语义空间。',
  '我们和六家硬件厂商做了联合调优，覆盖了主流的芯片平台。',
  '如果你只记住一句话，那就是：先解决可用，再谈好用。',
  '这里有一个容易被忽略的细节，就是字幕的时间轴对齐。',
  '我们把整个流程拆成了十二个可编排的节点。',
  '这部分的误差大概在正负百分之三以内。',
  '所以我们在产品上做了一个很克制的设计。',
  '从数据上看，用户平均每天会处理 18 条素材。',
  '这并不是一个技术问题，而是一个工程问题。',
  '我们提供了两种模式：快速模式和精细模式。',
  '这一次的升级，把成功率从 92% 提升到了 97.8%。',
  '下面进入提问环节。',
  '第一个问题来自线上的观众。',
  '关于成本，我们会在后面单独讲一页。',
  '这个功能默认是关闭的，需要手动开启。',
  '我们保留了完整的操作日志，方便回溯。',
  '最后，感谢所有参与内测的同事。',
  '以上就是今天的全部内容。',
];

const EN_SENTENCES = [
  'We brought on-device inference latency down to 38 milliseconds.',
  'Under real network conditions, the median first-token latency is 210 milliseconds.',
  'On the left is the previous generation, on the right is what we ship today.',
  'We made trade-offs across three dimensions: power, cost, and maintainability.',
  'Now let us look at a demo shot in the real world.',
  'The key to multimodality is aligning different modalities into one semantic space.',
  'We tuned jointly with six hardware vendors across mainstream chip platforms.',
  'If you remember one thing: make it work first, then make it good.',
  'There is an easily overlooked detail here: subtitle timeline alignment.',
  'We split the whole flow into twelve orchestration nodes.',
  'The error here is roughly within plus or minus three percent.',
  'So we made a deliberately restrained design decision.',
  'Users process 18 assets per day on average.',
  'This is not a technology problem, it is an engineering problem.',
  'We provide two modes: fast mode and precise mode.',
  'This upgrade lifted the success rate from 92% to 97.8%.',
];

function makeLines(seed: number, duration: number, count: number, lang: 'zh' | 'en'): SubtitleLine[] {
  const rnd = mulberry32(seed);
  const bank = lang === 'en' ? EN_SENTENCES : SENTENCES;
  const lines: SubtitleLine[] = [];
  let cursor = 4 + rnd() * 6;
  for (let i = 0; i < count; i++) {
    const text = bank[(i + Math.floor(rnd() * 3)) % bank.length];
    const dur = clamp(text.length * 0.235 + rnd() * 1.6, 1.6, 7.2);
    const start = Math.min(cursor, Math.max(1, duration - 2));
    const end = Math.min(start + dur, duration);
    lines.push({
      id: `sl_${seed.toString(36)}_${i}`,
      index: i + 1,
      start: Number(start.toFixed(2)),
      end: Number(end.toFixed(2)),
      speaker: i % 7 === 0 ? '主持人' : i % 5 === 0 ? '嘉宾 B' : '主讲人',
      text,
      confidence: Number((0.82 + rnd() * 0.17).toFixed(3)),
      reviewed: rnd() > 0.45,
    });
    cursor = end + clamp(rnd() * 0.9, 0.1, 0.9);
  }
  return lines;
}

const STYLES = ['style_std', 'style_variety', 'style_minimal', 'style_bilingual'];

function makeTracks(seed: number, duration: number, idx: number): SubtitleTrack[] {
  if (duration < 20) return [];
  const rnd = mulberry32(seed ^ 0x9e37);
  const count = Math.round(clamp(duration / 9, 8, 34));
  const tracks: SubtitleTrack[] = [
    {
      id: `st_${idx}_zh`,
      language: 'zh',
      version: 3,
      styleId: STYLES[idx % STYLES.length],
      updatedAt: new Date(Date.now() - (idx % 9) * 3600_000).toISOString(),
      updatedBy: ['u_03', 'u_02', 'u_07'][idx % 3],
      lines: makeLines(seed, duration, count, 'zh'),
    },
  ];
  if (rnd() > 0.45) {
    tracks.push({
      id: `st_${idx}_en`,
      language: 'en',
      version: 2,
      styleId: 'style_std',
      updatedAt: new Date(Date.now() - (idx % 6) * 7200_000).toISOString(),
      updatedBy: 'u_02',
      lines: makeLines(seed + 7, duration, Math.max(6, Math.round(count * 0.7)), 'en'),
    });
  }
  return tracks;
}

const CAP_POOL: CapabilityId[] = [
  'cap_asr',
  'cap_subtitle',
  'cap_translate',
  'cap_review',
  'cap_insight',
  'cap_enhance',
  'cap_audio',
  'cap_clip',
];

export const ASSETS: MediaAsset[] = ROWS.map((row, idx) => {
  const seed = hashString(row.t);
  const rnd = mulberry32(seed);
  const res = RES[row.r];
  const sizeBytes = Math.round(((res.kbps * 1000) / 8) * row.d);
  const statusRoll = rnd();
  const status =
    idx === 11
      ? 'pending_review'
      : idx === 5
        ? 'processing'
        : idx === 26
          ? 'failed'
          : idx > 52
            ? 'archived'
            : statusRoll > 0.94
              ? 'pending_review'
              : 'ready';
  const caps: CapabilityId[] = [];
  const capCount = Math.floor(rnd() * 4);
  for (let i = 0; i < capCount; i++) {
    const c = CAP_POOL[(idx + i * 3) % CAP_POOL.length];
    if (!caps.includes(c)) caps.push(c);
  }
  const d = new Date(Date.now() - Math.round(rnd() * 26) * 86400_000 - Math.round(rnd() * 20) * 3600_000);
  return {
    id: `ast_${String(idx + 1).padStart(4, '0')}`,
    title: row.t,
    type: row.ty,
    status,
    duration: row.d,
    width: res.w,
    height: res.h,
    sizeBytes: sizeBytes || Math.round(1.2 * 1024 * 1024),
    format: res.fmt,
    codec: res.codec,
    bitrateKbps: res.kbps,
    frameRate: res.fps,
    cover: idx % 8,
    tags: row.tags,
    project: row.p,
    ownerId: ['u_02', 'u_03', 'u_06', 'u_07', 'u_11'][idx % 5],
    createdAt: d.toISOString(),
    updatedAt: new Date(d.getTime() + 3600_000 * (1 + (idx % 12))).toISOString(),
    capabilities: caps,
    subtitleTracks: makeTracks(seed, row.d, idx),
    reviewScore: row.ty === 'video' ? 84 + Math.round(rnd() * 15) : undefined,
    md5: seed.toString(16).padStart(8, '0') + (seed ^ 0x5f3a).toString(16).padStart(8, '0'),
  };
});
