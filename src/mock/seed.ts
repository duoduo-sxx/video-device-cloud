import type { CaseStudy, Member, Project, ServicePackage, ComputeNode, AppNotification, AuditLog } from '../types'
import { createRng, SEED } from './random'

export const PROJECTS: Project[] = [
  { id: 'p1', name: '《澜沧江》人文纪录片', client: '云溪广播电视台', ownerId: 'm2', assetCount: 6, createdAt: '2026-07-08T09:20:00+08:00' },
  { id: 'p2', name: '《城市之光》都市剧', client: '蓝鲸影业', ownerId: 'm3', assetCount: 6, createdAt: '2026-07-22T14:05:00+08:00' },
  { id: 'p3', name: '星辰卫视《晚间新闻》', client: '星辰传媒', ownerId: 'm6', assetCount: 5, createdAt: '2026-08-02T08:40:00+08:00' },
  { id: 'p4', name: '《深海》4K 修复版', client: '蓝鲸影业', ownerId: 'm4', assetCount: 4, createdAt: '2026-08-15T10:10:00+08:00' },
  { id: 'p5', name: '云溪广电 25 周年宣传片', client: '云溪广播电视台', ownerId: 'm5', assetCount: 4, createdAt: '2026-09-06T16:30:00+08:00' },
  { id: 'p6', name: '《信号与系统》课程', client: '知行教育', ownerId: 'm7', assetCount: 7, createdAt: '2026-09-18T11:00:00+08:00' },
]

export const MEMBERS: Member[] = [
  { id: 'm1', name: '陈知远', email: 'chenzy@avrepair.cn', role: 'admin', avatarSeed: 11, status: 'active', title: '平台管理员' },
  { id: 'm2', name: '林书禾', email: 'linsh@avrepair.cn', role: 'lead', avatarSeed: 22, status: 'active', title: '技术负责人' },
  { id: 'm3', name: '苏澈', email: 'suche@avrepair.cn', role: 'engineer', avatarSeed: 33, status: 'active', title: '修复工程师' },
  { id: 'm4', name: '周映', email: 'zhouying@avrepair.cn', role: 'engineer', avatarSeed: 44, status: 'active', title: '视频修复工程师' },
  { id: 'm5', name: '何砚', email: 'heyan@avrepair.cn', role: 'engineer', avatarSeed: 55, status: 'active', title: '音频修复工程师' },
  { id: 'm6', name: '沈见山', email: 'shenjs@avrepair.cn', role: 'qc', avatarSeed: 66, status: 'active', title: '质检主管' },
  { id: 'm7', name: '郑砚秋', email: 'zhengyq@avrepair.cn', role: 'qc', avatarSeed: 77, status: 'active', title: '质检工程师' },
  { id: 'm8', name: '程牧', email: 'chengmu@avrepair.cn', role: 'qc', avatarSeed: 88, status: 'active', title: '质检工程师' },
  { id: 'm9', name: '许南乔', email: 'xunanqiao@avrepair.cn', role: 'engineer', avatarSeed: 99, status: 'active', title: '算法工程师' },
  { id: 'm10', name: '方以宁', email: 'fangyn@avrepair.cn', role: 'engineer', avatarSeed: 12, status: 'invited', title: '修复工程师' },
  { id: 'm11', name: '唐棠', email: 'tangtang@yunxi.tv', role: 'client', avatarSeed: 13, status: 'active', title: '云溪广电 · 内容中心' },
  { id: 'm12', name: '白桦', email: 'baihua@lanjing.com', role: 'client', avatarSeed: 14, status: 'active', title: '蓝鲸影业 · 后期统筹' },
]

export const PACKAGES: ServicePackage[] = [
  {
    id: 'pk1',
    name: '标准质检',
    unit: '分钟',
    unitPrice: 3.5,
    slaHours: 48,
    scenes: '上线前合规检查，输出可交付的质检报告',
    includes: ['全片逐帧缺陷检测', '响度与真峰值测量', '封装与元数据校验', '质检报告（含缺陷明细）'],
    excludes: ['缺陷修复', '字幕重制'],
  },
  {
    id: 'pk2',
    name: '深度修复',
    unit: '分钟',
    unitPrice: 8,
    slaHours: 72,
    scenes: '多类型缺陷综合修复，适用于问题较多的成片',
    includes: ['检测 + 修复方案定制', '画质与音频联合修复', '自动复检与人工验收', '修复前后对比报告'],
    excludes: ['原始素材重建'],
  },
  {
    id: 'pk3',
    name: '响度合规整改',
    unit: '条',
    unitPrice: 120,
    slaHours: 24,
    scenes: '广电 / 流媒体响度不达标，需按规范归一化',
    includes: ['ITU-R BS.1770 测量', '归一化与真峰值限制', '二次校验至 ±1 LKFS', '合规证明'],
    excludes: ['内容层面的音频修复'],
  },
  {
    id: 'pk4',
    name: '老片修复',
    unit: '分钟',
    unitPrice: 30,
    slaHours: 240,
    scenes: '胶片扫描、磁带转制素材的深度修复',
    includes: ['划痕 / 闪烁 / 霉斑修复', '颗粒重建与去噪', '色彩还原与白平衡', '逐镜人工复核'],
    excludes: ['重新扫描'],
  },
  {
    id: 'pk5',
    name: '批量转码 / 封装合规',
    unit: '分钟',
    unitPrice: 0.8,
    slaHours: 48,
    scenes: '交付格式不统一，需按规范批量转换',
    includes: ['封装与编码规范化', '帧率 / 像素比修正', '时间码重建', '批量校验报告'],
    excludes: ['画质增强'],
  },
  {
    id: 'pk6',
    name: '驻场技术支持',
    unit: '人日',
    unitPrice: 2000,
    slaHours: 0,
    scenes: '长期项目跟组，现场解决音视频质量问题',
    includes: ['工程师现场支持', '实时质检流程搭建', '设备与参数调优', '每日问题简报'],
    excludes: ['差旅费用'],
  },
]

export const NODES: ComputeNode[] = [
  { id: 'n1', name: 'GPU-01 · A100', type: 'GPU', status: 'busy', gpuUtil: 87, memUtil: 72, tempC: 68, doneToday: 14, currentTaskId: 'rt4', vram: '80 GB' },
  { id: 'n2', name: 'GPU-02 · A100', type: 'GPU', status: 'busy', gpuUtil: 74, memUtil: 61, tempC: 64, doneToday: 11, currentTaskId: 'rt7', vram: '80 GB' },
  { id: 'n3', name: 'GPU-03 · L40S', type: 'GPU', status: 'idle', gpuUtil: 6, memUtil: 12, tempC: 41, doneToday: 9, vram: '48 GB' },
  { id: 'n4', name: 'GPU-04 · L40S', type: 'GPU', status: 'busy', gpuUtil: 92, memUtil: 84, tempC: 71, doneToday: 16, currentTaskId: 'rt8', vram: '48 GB' },
  { id: 'n5', name: 'GPU-05 · RTX 6000', type: 'GPU', status: 'idle', gpuUtil: 3, memUtil: 8, tempC: 38, doneToday: 6, vram: '48 GB' },
  { id: 'n6', name: 'GPU-06 · RTX 6000', type: 'GPU', status: 'maintenance', gpuUtil: 0, memUtil: 0, tempC: 32, doneToday: 0, vram: '48 GB' },
  { id: 'n7', name: 'CPU-01 · Xeon 6430', type: 'CPU', status: 'busy', gpuUtil: 63, memUtil: 45, tempC: 52, doneToday: 22, currentTaskId: 'dt11', vram: '256 GB' },
  { id: 'n8', name: 'CPU-02 · Xeon 6430', type: 'CPU', status: 'idle', gpuUtil: 8, memUtil: 19, tempC: 44, doneToday: 18, vram: '256 GB' },
]

export const CASES: CaseStudy[] = [
  {
    id: 'c1',
    title: '《深海》4K 修复：胶片划痕与闪烁治理',
    tags: ['老片修复', '闪烁', '划痕'],
    coverSeed: 101,
    before: { vmaf: 64.2, psnr: 31.4, flicker: 18.6, scratches: 214 },
    after: { vmaf: 91.8, psnr: 42.7, flicker: 2.1, scratches: 3 },
    hours: 186,
    summary: '2K 扫描素材上变换至 4K，逐镜去除划痕并抑制帧间亮度闪烁，保留胶片颗粒。',
    client: '蓝鲸影业',
    content: [
      { heading: '背景', body: '《深海》原始素材为 1998 年胶片，扫描后存在大量纵向划痕、霉斑与周期性亮度闪烁，直接上变换会导致细节放大后的瑕疵更明显。' },
      { heading: '问题', body: '全片 96 分钟共检出 214 处划痕、37 段闪烁（幅度超过 6 IRE），另有 12 处片基损伤导致的画面抖动。' },
      { heading: '方案', body: '采用划痕检测 + 时域修补，闪烁用直方图匹配做帧间稳定，颗粒层单独提取后再合成，避免修复后画面"塑料感"。' },
      { heading: '结果', body: '缺陷残留 3 处（均为原片结构性损伤，已标注），VMAF 由 64.2 提升至 91.8，交付 4K DCP 与流媒体两个版本。' },
    ],
  },
  {
    id: 'c2',
    title: '纪录片 5.1 声轨重建与响度合规',
    tags: ['响度', '5.1', '声道'],
    coverSeed: 102,
    before: { lufs: -19.3, truePeak: -0.2, channels: 2, noise: -38 },
    after: { lufs: -24.0, truePeak: -1.4, channels: 6, noise: -58 },
    hours: 42,
    summary: '立体声素材重建为 5.1 环绕，并按广电规范归一化到 -24 LKFS。',
    client: '云溪广播电视台',
    content: [
      { heading: '背景', body: '《澜沧江》第五集送审版本为立体声混音，不符合播出要求的 5.1 声道与响度规范。' },
      { heading: '问题', body: '积分响度 -19.3 LKFS（超标 4.7），真峰值 -0.2 dBTP 已接近削波，且中置声道缺失导致对白定位不稳。' },
      { heading: '方案', body: '以对白提取结果构建中置声道，环境声做去相关后分配到环绕，LFE 仅保留 80Hz 以下低频；随后归一化至 -24 LKFS。' },
      { heading: '结果', body: '二次校验 -24.1 LKFS / -1.4 dBTP，通过播控复核，未出现对白被环境声掩盖的问题。' },
    ],
  },
  {
    id: 'c3',
    title: '都市剧批量响度统一至 -14 LUFS',
    tags: ['响度', '流媒体', '批量'],
    coverSeed: 103,
    before: { lufs: -17.8, truePeak: 0.4, episodes: 12 },
    after: { lufs: -14.0, truePeak: -1.2, episodes: 12 },
    hours: 18,
    summary: '12 集剧集响度差异达 6.2 LU，统一到流媒体平台标准并保证动态不被压死。',
    client: '蓝鲸影业',
    content: [
      { heading: '背景', body: '《城市之光》12 集由三家后期公司分别混音，响度从 -17.8 到 -11.6 不等，平台连播时音量跳变明显。' },
      { heading: '问题', body: '各集真峰值最高 +0.4 dBTP，已产生削波；部分集数动态范围仅 6 LU，直接压缩会进一步恶化听感。' },
      { heading: '方案', body: '按集测量后分组处理：动态充足的集数用线性增益，动态不足的用多段压缩 + 限幅，保留对白清晰度。' },
      { heading: '结果', body: '全部集数落在 -14.0 ±0.3 LUFS，真峰值 ≤ -1.2 dBTP，连播主观听感一致。' },
    ],
  },
  {
    id: 'c4',
    title: '日播新闻时间码断裂重建',
    tags: ['时间码', '封装', 'MXF'],
    coverSeed: 104,
    before: { breaks: 7, tcStart: 0, sync: 0 },
    after: { breaks: 0, tcStart: 0, sync: 1 },
    hours: 6,
    summary: '分段录制的 MXF 素材简单拼接后时间码断裂 7 处，重建连续时间码以恢复多机位同步。',
    client: '星辰传媒',
    content: [
      { heading: '背景', body: '《晚间新闻》采用分段录制后拼接，编辑未做时间码续接，入库时多机位同步失败。' },
      { heading: '问题', body: '7 处时间码跳变，最大跨度 00:04:12:07，播控系统按 LTC 检索时定位错误。' },
      { heading: '方案', body: '解析 PTS 与 LTC，按 10:00:00:00 起点重建连续时间码，保留原有帧序不重排。' },
      { heading: '结果', body: '时间码连续，多机位对轴一次通过，播控入库零报错。' },
    ],
  },
  {
    id: 'c5',
    title: '课程录音底噪与空调噪声治理',
    tags: ['降噪', '教育', '人声'],
    coverSeed: 105,
    before: { noise: -36, lufs: -20.4, clarity: 62 },
    after: { noise: -58, lufs: -16.0, clarity: 88 },
    hours: 9,
    summary: '教室录音底噪 -36 dBFS，含 120Hz 空调低频，降噪后提升语音清晰度。',
    client: '知行教育',
    content: [
      { heading: '背景', body: '课程为教室现场录制，单声道领夹麦，环境噪声明显，学生反馈"听着累"。' },
      { heading: '问题', body: '底噪 -36 dBFS，120Hz 附近有持续空调噪声，语音的 2–4kHz 被掩蔽。' },
      { heading: '方案', body: '先做窄带抑制处理空调基频，再用深度降噪处理宽带底噪，最后做存在感提升（2.5kHz +2dB）。' },
      { heading: '结果', body: '底噪降至 -58 dBFS，语音清晰度评分由 62 提升至 88，未出现明显齿音失真。' },
    ],
  },
  {
    id: 'c6',
    title: '老磁带交流哼声与抖动修复',
    tags: ['哼声', '磁带', '抖动'],
    coverSeed: 106,
    before: { hum: 16.4, wow: 0.42, noise: -34 },
    after: { hum: 1.2, wow: 0.06, noise: -52 },
    hours: 24,
    summary: 'VHS 转录素材存在 50Hz 哼声与走带抖动，做陷波与时间基校正。',
    client: '云溪广播电视台',
    content: [
      { heading: '背景', body: '1990 年代专题片仅存 VHS 磁带，转录后出现持续哼声与周期性音高抖动。' },
      { heading: '问题', body: '50Hz 突出 16.4 dB，走带抖动 0.42%，长音听起来"发飘"。' },
      { heading: '方案', body: '自适应陷波抑制 50/100/150Hz，时间基校正处理抖动，再用轻度降噪收敛底噪。' },
      { heading: '结果', body: '哼声降至 1.2 dB，抖动 0.06%，达到可重播水平并归档。' },
    ],
  },
  {
    id: 'c7',
    title: '直播回放音画不同步校正',
    tags: ['音画同步', '直播', '回放'],
    coverSeed: 107,
    before: { syncMs: 240, vmaf: 79.4 },
    after: { syncMs: 12, vmaf: 79.2 },
    hours: 5,
    summary: '推流端音频缓冲导致回放音画偏差 240ms，做整体时移后误差降至 12ms。',
    client: '星辰传媒',
    content: [
      { heading: '背景', body: '《晚间新闻》融媒体直播回放被观众反馈"口型对不上"，需要快速定位并修复。' },
      { heading: '问题', body: '全程稳定偏移 240ms（音频滞后），属于推流端缓冲累积，非分段问题。' },
      { heading: '方案', body: '互相关分析确认为恒定偏移，整体前移音频 240ms，未做时间拉伸以避免音调变化。' },
      { heading: '结果', body: '偏差降至 12ms，人耳不可感知；同时将该案例沉淀为直播回放的标准检查项。' },
    ],
  },
  {
    id: 'c8',
    title: 'HDR 宣传片元数据与色调映射修正',
    tags: ['HDR', '元数据', '宣传片'],
    coverSeed: 108,
    before: { deltaE: 9.4, peakNits: 400, flags: 3 },
    after: { deltaE: 2.1, peakNits: 1000, flags: 0 },
    hours: 7,
    summary: 'HLG 素材被错误标记为 SDR，导致播放发灰，修正元数据并重做 SDR 版本映射。',
    client: '云溪广播电视台',
    content: [
      { heading: '背景', body: '25 周年宣传片为 HLG 拍摄，交付时元数据缺失，电视端播放整体发灰。' },
      { heading: '问题', body: '3 处元数据标记错误，峰值亮度仅按 400nits 解释，色差 ΔE 达 9.4。' },
      { heading: '方案', body: '写回 HLG/BT.2020 元数据，另用色域映射生成 SDR 版本，逐镜比对高光细节。' },
      { heading: '结果', body: 'HDR 版本峰值 1000nits 正常呈现，SDR 版本 ΔE 2.1，两版均通过技审。' },
    ],
  },
  {
    id: 'c9',
    title: '多机位混剪画幅与色彩统一',
    tags: ['色彩', '画幅', '多机位'],
    coverSeed: 109,
    before: { deltaE: 7.8, blackEdge: 3.2 },
    after: { deltaE: 1.4, blackEdge: 0 },
    hours: 11,
    summary: '三机位素材白平衡与画幅不一致，统一后切换镜头无明显跳色与黑边。',
    client: '蓝鲸影业',
    content: [
      { heading: '背景', body: '剧集采用三机位拍摄，A 机为 4K、B/C 机为 1080p 且白平衡偏移。' },
      { heading: '问题', body: '机位切换时肤色跳变（ΔE 7.8），B 机素材两侧有 3.2% 黑边。' },
      { heading: '方案', body: '以 A 机为基准做色彩匹配，B/C 机裁切并上变换，边缘做轻微羽化避免裁切痕迹。' },
      { heading: '结果', body: 'ΔE 降至 1.4，黑边消除，切换镜头无感知跳变。' },
    ],
  },
  {
    id: 'c10',
    title: '舞台录制削波与爆音修复',
    tags: ['削波', '爆音', '现场'],
    coverSeed: 110,
    before: { clipPct: 0.42, pops: 63, truePeak: 2.1 },
    after: { clipPct: 0.0, pops: 2, truePeak: -1.1 },
    hours: 14,
    summary: '现场调音台输出过载导致削波，重建峰值包络并清除 63 处爆音。',
    client: '云溪广播电视台',
    content: [
      { heading: '背景', body: '晚会现场调音台主输出过载，返送录音出现大面积削波与插拔爆音。' },
      { heading: '问题', body: '触顶采样占 0.42%，真峰值 +2.1 dBTP，63 处瞬态爆音。' },
      { heading: '方案', body: '削波段做包络重建，爆音逐处插值修复，整体限幅至 -1 dBTP；无法恢复的 2 处标注为结构性缺失。' },
      { heading: '结果', body: '削波清零，真峰值 -1.1 dBTP，重播时无明显失真。' },
    ],
  },
  {
    id: 'c11',
    title: '课程字幕批量重对齐',
    tags: ['字幕', '对齐', '批量'],
    coverSeed: 111,
    before: { offsetMs: 860, lines: 1240 },
    after: { offsetMs: 40, lines: 1240 },
    hours: 8,
    summary: '24 讲课程字幕整体偏移 860ms，按语音活动检测重对齐，逐句校正。',
    client: '知行教育',
    content: [
      { heading: '背景', body: '课程重新剪辑后时长变化，原字幕未重新对轴，整体提前。' },
      { heading: '问题', body: '平均偏移 860ms，共 1240 行字幕，长句尾部漂移更明显。' },
      { heading: '方案', body: '语音活动检测定位每句起点，整体粗对齐后对长句做局部拉伸。' },
      { heading: '结果', body: '平均偏移降至 40ms，人工抽检 120 行全部通过。' },
    ],
  },
  {
    id: 'c12',
    title: '纪录片冻帧与丢帧时序重建',
    tags: ['冻帧', '插帧', '时序'],
    coverSeed: 112,
    before: { frozen: 9, dropped: 34, vmaf: 72.6 },
    after: { frozen: 0, dropped: 0, vmaf: 90.4 },
    hours: 16,
    summary: '无人机素材图传丢包导致 43 处时序缺陷，光流插帧后动作恢复连续。',
    client: '云溪广播电视台',
    content: [
      { heading: '背景', body: '《澜沧江》航拍段落使用图传录制，存在丢包导致的冻帧与跳帧。' },
      { heading: '问题', body: '冻帧 9 处、丢帧 34 处，最长冻帧 1.8 秒，运动镜头明显卡顿。' },
      { heading: '方案', body: '按场景切分后做双向光流插帧，场景切换处强制断点避免拖影。' },
      { heading: '结果', body: '时序缺陷清零，VMAF 由 72.6 提升至 90.4，观众无感知。' },
    ],
  },
]

export function buildNotifications(): AppNotification[] {
  const rng = createRng(SEED + 7)
  const items: AppNotification[] = [
    { id: 'nt1', type: 'task', title: '检测任务完成', body: 'DT-20261018-016《澜沧江》第五集 检测完成，评分 82.4（B 级），检出 18 条缺陷', at: '2026-10-19T09:42:00+08:00', read: false, link: '/detection/dt16' },
    { id: 'nt2', type: 'review', title: '待验收提醒', body: 'RT-20261017-008《城市之光》EP03 修复完成，等待验收签署', at: '2026-10-19T09:10:00+08:00', read: false, link: '/review/rt8' },
    { id: 'nt3', type: 'sla', title: 'SLA 预警', body: 'SO-2026-0086 剩余不足 20%，请尽快安排交付', at: '2026-10-19T08:35:00+08:00', read: false, link: '/service/orders/so6' },
    { id: 'nt4', type: 'sla', title: '工单已超时', body: 'SO-2026-0083 已超时 1 天，触发赔付计算', at: '2026-10-19T08:00:00+08:00', read: false, link: '/service/orders/so3' },
    { id: 'nt5', type: 'task', title: '复检未通过', body: 'RT-20261016-005 残留 2 条严重缺陷，已生成返工单', at: '2026-10-18T22:14:00+08:00', read: false, link: '/repair/rt5' },
    { id: 'nt6', type: 'system', title: '算法版本更新', body: '光流插帧 v4.2.1 上线，冻帧修复成功率提升 6.2%', at: '2026-10-18T18:00:00+08:00', read: false, link: '/rules' },
    { id: 'nt7', type: 'review', title: '验收已签署', body: 'RT-20261015-002《深海》Reel01 验收通过，报告已出具', at: '2026-10-18T16:20:00+08:00', read: false, link: '/reports' },
    { id: 'nt8', type: 'task', title: '检测任务失败', body: 'DT-20261015-013 探针失败：文件尾部损坏，建议重新上传', at: '2026-10-18T14:05:00+08:00', read: false, link: '/detection/dt13' },
  ]
  const pool = [
    { type: 'task' as const, title: '检测任务完成', body: '质检流水线已完成，结果可在缺陷分析台查看', link: '/detection' },
    { type: 'system' as const, title: '交付规范更新', body: '流媒体上线规范新增 HDR 元数据校验项', link: '/rules' },
    { type: 'review' as const, title: '方案待确认', body: '修复方案已生成，等待技术负责人确认', link: '/repair' },
    { type: 'task' as const, title: '节点维护通知', body: 'GPU-06 进入维护状态，任务已自动迁移', link: '/compute' },
  ]
  for (let i = 0; i < 22; i++) {
    const p = rng.pick(pool)
    const day = 17 - Math.floor(i / 3)
    const hour = 9 + (i % 10)
    items.push({
      id: `nt${i + 9}`,
      type: p.type,
      title: p.title,
      body: p.body,
      at: `2026-10-${String(Math.max(1, day)).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:00+08:00`,
      read: true,
      link: p.link,
    })
  }
  return items
}

export function buildAuditLogs(): AuditLog[] {
  const rng = createRng(SEED + 11)
  const actions = [
    ['创建检测任务', 'DT-20261018-016'],
    ['修改规则阈值', 'R-018 A-LVL 目标响度'],
    ['签署验收单', 'RT-20261017-008'],
    ['出具质检报告', 'QC-2026-1018-0041'],
    ['切换修复方案模板', 'RT-20261016-005'],
    ['新增成员', '方以宁（修复工程师）'],
    ['更新交付规范', '流媒体上线 v3'],
    ['取消任务', 'DT-20261015-013'],
    ['下载交付物', '《城市之光》EP03_v2.mp4'],
    ['调整节点配额', 'GPU-04 L40S'],
  ]
  return Array.from({ length: 40 }).map((_, i) => {
    const [action, target] = rng.pick(actions)
    const member = rng.pick(MEMBERS)
    const day = 19 - Math.floor(i / 4)
    return {
      id: `log${i + 1}`,
      actor: member.name,
      action,
      target,
      at: `2026-10-${String(Math.max(1, day)).padStart(2, '0')}T${String(9 + (i % 9)).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}:00+08:00`,
      ip: `10.12.${rng.int(1, 8)}.${rng.int(10, 240)}`,
    }
  })
}
