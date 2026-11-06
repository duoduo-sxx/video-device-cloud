import type { Pipeline, PipelineNode, PipelineEdge, NodeType, PipelineRun } from '@/types';
import { hashString, mulberry32 } from '@/utils/format';

interface Spec {
  id: string;
  name: string;
  description: string;
  trigger: string;
  ownerId: string;
  successRate: number;
  avgDurationSec: number;
  runs7d: number;
  version: number;
  enabled: boolean;
  steps: { label: string; type: NodeType; sub: string }[];
}

const SPECS: Spec[] = [
  {
    id: 'pl_01', name: '发布会多语分发', description: '长视频自动转写、双语字幕、翻译配音，并按章节切分为竖版短视频。', trigger: '手动 + 定时（每日 09:00）', ownerId: 'u_05', successRate: 94.4, avgDurationSec: 2520, runs7d: 18, version: 4, enabled: true,
    steps: [
      { label: '输入 4K 源', type: 'input', sub: '发布会主会场' },
      { label: '转写 + 分离', type: 'asr', sub: '中文 / 2 人' },
      { label: '中英字幕', type: 'subtitle', sub: '双语 / 18 字每行' },
      { label: '翻译配音', type: 'translate', sub: '中 → 英 / 保留音色' },
      { label: '章节切分', type: 'clip', sub: '6 章节 / 高光 12 段' },
      { label: '竖版裁切', type: 'enhance', sub: '1080×1920 / 主体跟踪' },
      { label: '内容审核', type: 'review', sub: '三模态 / 高风险拦截' },
      { label: '输出分发', type: 'output', sub: 'MP4 + SRT' },
    ],
  },
  {
    id: 'pl_02', name: '短视频一键成片', description: '上传即触发，自动识别高光片段、生成字幕与封面，直接产出可发布竖版成片。', trigger: '上传触发', ownerId: 'u_03', successRate: 98.4, avgDurationSec: 200, runs7d: 126, version: 2, enabled: true,
    steps: [
      { label: '上传触发', type: 'input', sub: '监控 /upload 目录' },
      { label: '智能理解', type: 'manual', sub: '高光评分 ≥ 80' },
      { label: '高光切片', type: 'clip', sub: '每条 45–60 秒' },
      { label: '字幕烧录', type: 'subtitle', sub: '综艺描边样式' },
      { label: '封面生成', type: 'output', sub: '3 张候选' },
    ],
  },
  {
    id: 'pl_03', name: '播客精剪', description: '双人对谈自动分离说话人，删除静音与语气词，响度归一化并生成 Shownotes。', trigger: '手动', ownerId: 'u_02', successRate: 95.8, avgDurationSec: 660, runs7d: 24, version: 3, enabled: true,
    steps: [
      { label: '输入音轨', type: 'input', sub: 'MP3 / WAV' },
      { label: '降噪处理', type: 'manual', sub: '强度 60 / 去混响' },
      { label: '说话人分离', type: 'asr', sub: '2 人 / 中文' },
      { label: '删静音语气词', type: 'clip', sub: '阈值 -38 dB' },
      { label: '响度归一化', type: 'manual', sub: '-14 LUFS' },
      { label: 'Shownotes', type: 'output', sub: '摘要 + 章节 + 关键词' },
    ],
  },
  {
    id: 'pl_04', name: '课程字幕标准化', description: '批量课程视频统一字幕样式，按术语表纠错，导出 SRT 与 ASS 双格式。', trigger: '批量任务', ownerId: 'u_06', successRate: 99.1, avgDurationSec: 360, runs7d: 312, version: 5, enabled: true,
    steps: [
      { label: '批量输入', type: 'input', sub: '课程目录 / 214 讲' },
      { label: '语音转写', type: 'asr', sub: '中文 / 热词表' },
      { label: '术语纠错', type: 'manual', sub: '术语表 v6 / 96 条' },
      { label: '样式统一', type: 'subtitle', sub: '标准白字黑边' },
      { label: '导出 SRT/ASS', type: 'output', sub: '双格式' },
    ],
  },
  {
    id: 'pl_05', name: '电商口播批量剪辑', description: '批量口播素材去水印、去静音、加字幕与贴片，输出统一规格投放素材。', trigger: '手动 + 上传触发', ownerId: 'u_07', successRate: 96.2, avgDurationSec: 480, runs7d: 64, version: 2, enabled: false,
    steps: [
      { label: '批量输入', type: 'input', sub: '口播素材 32 条' },
      { label: '去水印', type: 'manual', sub: '右下角框选 / 跟踪' },
      { label: '删静音', type: 'clip', sub: '阈值 -35 dB' },
      { label: '字幕', type: 'subtitle', sub: '单行 14 字' },
      { label: '贴片输出', type: 'output', sub: '1080×1920 / 30fps' },
    ],
  },
  {
    id: 'pl_06', name: '会议纪要生成', description: '会议录像转写后自动生成纪要、决议与待办列表，按发言人归集观点。', trigger: '手动', ownerId: 'u_09', successRate: 93.1, avgDurationSec: 900, runs7d: 11, version: 1, enabled: true,
    steps: [
      { label: '输入录像', type: 'input', sub: '会议录屏' },
      { label: '转写', type: 'asr', sub: '中文 / 8 人分离' },
      { label: '说话人归集', type: 'manual', sub: '按人聚合观点' },
      { label: '摘要 + 待办', type: 'output', sub: 'Markdown 纪要' },
    ],
  },
];

function snakeLayout(count: number): { x: number; y: number }[] {
  return Array.from({ length: count }, (_, i) => {
    if (i < 4) return { x: 40 + i * 180, y: 70 };
    return { x: 40 + (7 - i) * 180, y: 290 };
  });
}

export const PIPELINES: Pipeline[] = SPECS.map((spec) => {
  const pos = snakeLayout(spec.steps.length);
  const nodes: PipelineNode[] = spec.steps.map((s, i) => ({
    id: `${spec.id}_n${i}`,
    type: s.type,
    label: s.label,
    x: pos[i].x,
    y: pos[i].y,
    params: { 超时: '600s', 重试: i === 4 ? 1 : 2, 失败策略: '中止' },
    status: 'idle',
  }));
  const edges: PipelineEdge[] = nodes.slice(0, -1).map((n, i) => ({ id: `${spec.id}_e${i}`, from: n.id, to: nodes[i + 1].id }));
  return {
    id: spec.id,
    name: spec.name,
    description: spec.description,
    nodes,
    edges,
    trigger: spec.trigger,
    enabled: spec.enabled,
    ownerId: spec.ownerId,
    version: spec.version,
    successRate: spec.successRate,
    avgDurationSec: spec.avgDurationSec,
    runs7d: spec.runs7d,
    updatedAt: new Date(Date.now() - 3600_000 * (3 + (hashString(spec.id) % 60))).toISOString(),
  };
});

export const PIPELINE_RUNS: PipelineRun[] = PIPELINES.flatMap((p) => {
  const rnd = mulberry32(hashString(p.id));
  return Array.from({ length: 14 }, (_, i) => {
    const failed = rnd() > 0.88;
    return {
      id: `run_${p.id.slice(3)}_${String(i + 1).padStart(3, '0')}`,
      pipelineId: p.id,
      startedAt: new Date(Date.now() - i * 7.2 * 3600_000).toISOString(),
      status: failed ? 'failed' : 'succeeded',
      durationSec: Math.round(p.avgDurationSec * (0.72 + rnd() * 0.6)),
      triggeredBy: ['张明远', '李思颖', '系统定时', '王浩然'][i % 4],
      assetTitle: ['2026 春季新品发布会 - 主会场全程', '抖音 - 夏日防晒测评 - 竖版', '科技早知道 EP128 - 端侧大模型', 'Python 数据分析 第07讲 - 数据清洗'][i % 4],
    } as PipelineRun;
  });
});
