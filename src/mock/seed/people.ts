import type { User, Notification, ApiKey, Template } from '@/types';

export const USERS: User[] = [
  { id: 'u_01', name: '赵启山', email: 'zhaoqishan@mediaforge.cn', role: '团队管理员', group: '技术中台', avatarColor: '#5B6CFF', monthlyHours: 312, status: 'active', lastActive: '2026-10-19T09:42:00+08:00' },
  { id: 'u_02', name: '张明远', email: 'zhangmingyuan@mediaforge.cn', role: '内容运营', group: '内容中心', avatarColor: '#22D3EE', monthlyHours: 486, status: 'active', lastActive: '2026-10-19T10:18:00+08:00' },
  { id: 'u_03', name: '李思颖', email: 'lisiying@mediaforge.cn', role: '后期剪辑师', group: '内容中心', avatarColor: '#A78BFA', monthlyHours: 528, status: 'active', lastActive: '2026-10-19T10:05:00+08:00' },
  { id: 'u_04', name: '陈雨桐', email: 'chenyutong@mediaforge.cn', role: '审核专员', group: '内容中心', avatarColor: '#FBBF24', monthlyHours: 128, status: 'active', lastActive: '2026-10-19T09:58:00+08:00' },
  { id: 'u_05', name: '王浩然', email: 'wanghaoran@mediaforge.cn', role: '技术负责人', group: '技术中台', avatarColor: '#34D399', monthlyHours: 264, status: 'active', lastActive: '2026-10-19T10:22:00+08:00' },
  { id: 'u_06', name: '周晓彤', email: 'zhouxiaotong@mediaforge.cn', role: '内容运营', group: '内容中心', avatarColor: '#F87171', monthlyHours: 208, status: 'active', lastActive: '2026-10-18T18:30:00+08:00' },
  { id: 'u_07', name: '刘一鸣', email: 'liuyiming@mediaforge.cn', role: '后期剪辑师', group: '内容中心', avatarColor: '#818CF8', monthlyHours: 176, status: 'active', lastActive: '2026-10-19T08:12:00+08:00' },
  { id: 'u_08', name: '孙可欣', email: 'sunkexin@mediaforge.cn', role: '审核专员', group: '内容中心', avatarColor: '#F472B6', monthlyHours: 96, status: 'active', lastActive: '2026-10-17T15:44:00+08:00' },
  { id: 'u_09', name: '吴天予', email: 'wutianyu@mediaforge.cn', role: '技术负责人', group: '技术中台', avatarColor: '#38BDF8', monthlyHours: 142, status: 'active', lastActive: '2026-10-18T21:07:00+08:00' },
  { id: 'u_10', name: '郑楠', email: 'zhengnan@mediaforge.cn', role: '内容运营', group: '外部客户', avatarColor: '#FBBF24', monthlyHours: 64, status: 'active', lastActive: '2026-10-16T11:20:00+08:00' },
  { id: 'u_11', name: '何雨泽', email: 'heyuze@mediaforge.cn', role: '后期剪辑师', group: '内容中心', avatarColor: '#2DD4BF', monthlyHours: 88, status: 'active', lastActive: '2026-10-19T09:30:00+08:00' },
  { id: 'u_12', name: '马芸', email: 'mayun@mediaforge.cn', role: '审核专员', group: '外部客户', avatarColor: '#C084FC', monthlyHours: 32, status: 'disabled', lastActive: '2026-09-28T14:02:00+08:00' },
  { id: 'u_13', name: '林清和', email: 'linqinghe@mediaforge.cn', role: '团队管理员', group: '技术中台', avatarColor: '#FB923C', monthlyHours: 118, status: 'active', lastActive: '2026-10-19T07:50:00+08:00' },
  { id: 'u_14', name: '徐子墨', email: 'xuzimo@mediaforge.cn', role: '内容运营', group: '外部客户', avatarColor: '#4ADE80', monthlyHours: 46, status: 'active', lastActive: '2026-10-15T16:35:00+08:00' },
];

export const CURRENT_USER_ID = 'u_02';

export const ROLES = ['团队管理员', '技术负责人', '内容运营', '后期剪辑师', '审核专员'];

export const ROLE_MATRIX: Record<string, Record<string, boolean>> = {
  团队管理员: { 媒体库: true, 智能工具: true, 流水线: true, 任务中心: true, 内容审核: true, 用量计费: true, API管理: true, 成员管理: true, 系统设置: true, 审计日志: true },
  技术负责人: { 媒体库: true, 智能工具: true, 流水线: true, 任务中心: true, 内容审核: true, 用量计费: true, API管理: true, 成员管理: false, 系统设置: true, 审计日志: true },
  内容运营: { 媒体库: true, 智能工具: true, 流水线: true, 任务中心: true, 内容审核: true, 用量计费: false, API管理: false, 成员管理: false, 系统设置: false, 审计日志: false },
  后期剪辑师: { 媒体库: true, 智能工具: true, 流水线: false, 任务中心: true, 内容审核: false, 用量计费: false, API管理: false, 成员管理: false, 系统设置: false, 审计日志: false },
  审核专员: { 媒体库: true, 智能工具: false, 流水线: false, 任务中心: true, 内容审核: true, 用量计费: false, API管理: false, 成员管理: false, 系统设置: false, 审计日志: false },
};

export const GROUPS = ['内容中心', '技术中台', '外部客户'];

export const NOTIFICATIONS: Notification[] = [
  { id: 'n_01', type: 'error', title: '任务失败：4K 超分 - 品牌形象片', desc: '显存不足（E5003），建议降低超分倍数后重试。', time: '2026-10-19T10:20:00+08:00', read: false },
  { id: 'n_02', type: 'success', title: '任务完成：发布会双语字幕生成', desc: '共 1,842 行，已写入字幕轨 v3。', time: '2026-10-19T10:12:00+08:00', read: false },
  { id: 'n_03', type: 'info', title: '配额提醒', desc: '本月处理时长已使用 42.9%，按当前速率预计月底达 92%。', time: '2026-10-19T09:30:00+08:00', read: false },
  { id: 'n_04', type: 'error', title: '内容审核：3 条高风险待处理', desc: '「夏日防晒测评-竖版」存在 3 处高风险画面。', time: '2026-10-19T09:02:00+08:00', read: true },
  { id: 'n_05', type: 'info', title: 'API Key 即将过期', desc: '「内容中台-生产」将于 7 天后到期。', time: '2026-10-18T17:40:00+08:00', read: true },
  { id: 'n_06', type: 'success', title: '流水线运行成功：短视频一键成片', desc: '本次运行耗时 3 分 12 秒，产出 6 条成片。', time: '2026-10-18T16:20:00+08:00', read: true },
];

export const API_KEYS: ApiKey[] = [
  { id: 'key_01', name: '内容中台-生产', masked: 'mf_live_7f3a••••9c2e', scopes: ['转写', '字幕', '审核'], qps: 20, createdAt: '2026-03-12T10:00:00+08:00', lastUsed: '2026-10-19T10:21:00+08:00', status: 'expiring', expiresAt: '2026-10-26T10:00:00+08:00' },
  { id: 'key_02', name: '剪辑工具-测试', masked: 'mf_test_2b81••••41af', scopes: ['转写', '字幕', '翻译'], qps: 5, createdAt: '2026-06-08T14:20:00+08:00', lastUsed: '2026-10-18T19:02:00+08:00', status: 'active', expiresAt: '2027-06-08T14:20:00+08:00' },
  { id: 'key_03', name: '客户 A-接口对接', masked: 'mf_live_c94d••••60b7', scopes: ['转写', '审核'], qps: 10, createdAt: '2026-08-21T09:05:00+08:00', lastUsed: '2026-10-19T08:44:00+08:00', status: 'active', expiresAt: '2027-08-21T09:05:00+08:00' },
  { id: 'key_04', name: '旧版-待下线', masked: 'mf_live_1e5f••••8d33', scopes: ['转写'], qps: 2, createdAt: '2025-11-02T11:30:00+08:00', lastUsed: '2026-07-30T10:12:00+08:00', status: 'revoked', expiresAt: '2026-11-02T11:30:00+08:00' },
];

export const TEMPLATES: Template[] = [
  { id: 'tpl_01', name: '发布会多语分发', category: '会议', tags: ['多语', '字幕', '切片'], uses: 86, author: '王浩然', rating: 4.9, reviews: 42, cover: 0, description: '长视频自动转写、双语字幕、翻译配音，并按章节切分为 12 条竖版短视频。', nodeSummary: ['输入 4K 源', '转写 + 说话人分离', '中英字幕', '翻译配音', '章节切分', '竖版裁切', '审核', '输出'] },
  { id: 'tpl_02', name: '短视频一键成片', category: '短视频', tags: ['竖版', '爆点', '封面'], uses: 412, author: '李思颖', rating: 4.8, reviews: 126, cover: 1, description: '上传即触发，自动识别高光片段、生成字幕与封面，直接产出可发布竖版成片。', nodeSummary: ['上传触发', '智能理解', '高光切片', '字幕烧录', '封面生成', '输出'] },
  { id: 'tpl_03', name: '播客精剪', category: '播客', tags: ['降噪', '静音删除', 'ShowNotes'], uses: 138, author: '张明远', rating: 4.7, reviews: 58, cover: 2, description: '双人对谈自动分离说话人，删除静音与语气词，响度归一化并生成 Shownotes。', nodeSummary: ['输入音轨', '降噪', '说话人分离', '删静音', '响度归一化', '摘要生成', '输出'] },
  { id: 'tpl_04', name: '课程字幕标准化', category: '课程', tags: ['批量', '术语表', 'SRT'], uses: 326, author: '周晓彤', rating: 4.9, reviews: 88, cover: 3, description: '批量课程视频统一字幕样式，按术语表纠错，导出 SRT 与 ASS 双格式。', nodeSummary: ['批量输入', '转写', '术语纠错', '样式统一', '导出 SRT/ASS'] },
  { id: 'tpl_05', name: '电商口播批量剪辑', category: '电商', tags: ['口播', '去水印', '批量'], uses: 194, author: '刘一鸣', rating: 4.6, reviews: 36, cover: 4, description: '批量口播素材去水印、去静音、加字幕与贴片，输出统一规格投放素材。', nodeSummary: ['批量输入', '去水印', '删静音', '字幕', '贴片', '输出'] },
  { id: 'tpl_06', name: '会议纪要生成', category: '会议', tags: ['纪要', '摘要', '待办'], uses: 74, author: '吴天予', rating: 4.5, reviews: 21, cover: 5, description: '会议录像转写后自动生成纪要、决议与待办列表，按发言人归集观点。', nodeSummary: ['输入录像', '转写', '说话人归集', '摘要', '待办抽取', '输出纪要'] },
  { id: 'tpl_07', name: '老片修复上色', category: '其他', tags: ['超分', '去噪', '插帧'], uses: 52, author: '何雨泽', rating: 4.8, reviews: 19, cover: 6, description: '标清素材 4K 超分、去噪、去划痕与 60fps 插帧，适合品牌资产修复。', nodeSummary: ['输入标清', '去噪', '4x 超分', '插帧', '色彩修复', '输出'] },
  { id: 'tpl_08', name: '直播回放切片', category: '短视频', tags: ['直播', '切片', '审核'], uses: 168, author: '郑楠', rating: 4.7, reviews: 44, cover: 7, description: '直播回放按弹幕峰值与语音情绪切分精彩片段，逐条过审后输出。', nodeSummary: ['输入回放', '峰值分析', '切片', '字幕', '审核', '输出'] },
];
