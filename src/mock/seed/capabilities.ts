import type { CapabilityMeta, CapabilityId } from '@/types';

export const CAPABILITIES: CapabilityMeta[] = [
  { id: 'cap_asr', name: '语音转写', desc: '高精度语音识别，支持说话人分离、标点恢复与热词增强', formats: 'MP4 / MOV / MP3 / WAV / AAC', monthlyCalls: 4182, avgDuration: '1 分 42 秒', status: 'up', color: '#5B6CFF', icon: 'audio' },
  { id: 'cap_subtitle', name: '字幕生成', desc: '自动断句与时间轴对齐，支持中英双语与样式模板', formats: 'MP4 / MOV / MP3', monthlyCalls: 2764, avgDuration: '48 秒', status: 'up', color: '#22D3EE', icon: 'subtitle' },
  { id: 'cap_translate', name: '多语译配', desc: '字幕翻译 + AI 配音，保留原音色与情绪', formats: 'SRT / VTT / MP4', monthlyCalls: 1286, avgDuration: '3 分 08 秒', status: 'up', color: '#A78BFA', icon: 'translate' },
  { id: 'cap_tts', name: '语音合成', desc: '12 种音色、多情感与语速控制，支持 SSML', formats: 'TXT / SRT → MP3 / WAV', monthlyCalls: 942, avgDuration: '22 秒', status: 'up', color: '#34D399', icon: 'sound' },
  { id: 'cap_clip', name: '智能剪辑', desc: '静音与语气词删除、场景切分、高光集锦、横转竖', formats: 'MP4 / MOV', monthlyCalls: 1864, avgDuration: '1 分 12 秒', status: 'up', color: '#FBBF24', icon: 'scissor' },
  { id: 'cap_enhance', name: '画质增强', desc: '2x/4x 超分、去噪、去模糊、插帧与老片修复', formats: 'MP4 / MOV / MKV', monthlyCalls: 738, avgDuration: '8 分 26 秒', status: 'up', color: '#F472B6', icon: 'picture' },
  { id: 'cap_audio', name: '音频处理', desc: '降噪、去混响、响度归一化与人声伴奏分离', formats: 'MP3 / WAV / AAC / FLAC', monthlyCalls: 612, avgDuration: '54 秒', status: 'up', color: '#38BDF8', icon: 'filter' },
  { id: 'cap_review', name: '内容审核', desc: '画面、语音、文字三模态风险识别与时间轴打点', formats: 'MP4 / MOV / MP3', monthlyCalls: 1548, avgDuration: '1 分 36 秒', status: 'up', color: '#F87171', icon: 'safety' },
  { id: 'cap_insight', name: '智能理解', desc: '章节切分、摘要、关键词、封面与精彩片段推荐', formats: 'MP4 / MOV / MP3', monthlyCalls: 986, avgDuration: '2 分 04 秒', status: 'up', color: '#C084FC', icon: 'bulb' },
  { id: 'cap_ocr', name: '硬字幕处理', desc: 'OCR 硬字幕识别、区域擦除与重新嵌入', formats: 'MP4 / MOV', monthlyCalls: 246, avgDuration: '4 分 18 秒', status: 'maintenance', color: '#94A3B8', icon: 'scan' },
  { id: 'cap_watermark', name: '去水印', desc: '框选区域跟踪修复，支持批量模板', formats: 'MP4 / MOV / PNG', monthlyCalls: 318, avgDuration: '2 分 42 秒', status: 'up', color: '#FBBF24', icon: 'eraser' },
  { id: 'cap_dubbing', name: '数字人播报', desc: '2D 数字人口型驱动与多语播报', formats: 'TXT → MP4', monthlyCalls: 0, avgDuration: '—', status: 'soon', color: '#64748B', icon: 'user' },
];

export const CAP_MAP: Record<CapabilityId, CapabilityMeta> = CAPABILITIES.reduce(
  (acc, c) => ({ ...acc, [c.id]: c }),
  {} as Record<CapabilityId, CapabilityMeta>,
);

export const CAP_NAMES: Record<CapabilityId, string> = CAPABILITIES.reduce(
  (acc, c) => ({ ...acc, [c.id]: c.name }),
  {} as Record<CapabilityId, string>,
);

export const ERROR_CODES: { code: string; message: string; advice: string }[] = [
  { code: 'E5003', message: '显存不足：当前 4x 超分需 18.6 GB，可用 15.2 GB', advice: '降低超分倍数至 2x，或选择 GPU-01 节点后重试。' },
  { code: 'E4102', message: '素材损坏：容器索引异常，无法解析音轨', advice: '使用「转码修复」重新封装源文件后重试。' },
  { code: 'E5021', message: '模型推理超时（阈值 600 秒）', advice: '缩短单次处理时长，或切换至「精细模式」队列。' },
  { code: 'E3305', message: '字幕对齐失败：语音与文本置信度低于阈值', advice: '检查音轨是否存在强背景音乐，建议先做降噪。' },
  { code: 'E4290', message: '审核服务限流：当前 QPS 超过配额 20', advice: '降低并发或申请提升配额后重试。' },
  { code: 'E6001', message: '输出存储写入失败：空间不足', advice: '清理归档素材或扩容存储卷后重试。' },
];
