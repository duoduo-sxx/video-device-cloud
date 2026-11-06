import type { ModelItem } from '@/types'

export const models: ModelItem[] = [
  {
    id: 'mdl-vidsr-32',
    name: 'VID-SR',
    version: 'v3.2',
    type: '超分辨率',
    scenes: ['实拍视频', '监控', '通用'],
    vram: 18.2,
    latencyMs: 46,
    rating: 4.9,
    enabled: true,
    precision: 'FP16'
  },
  {
    id: 'mdl-esrgan-4p',
    name: 'Real-ESRGAN',
    version: 'x4plus',
    type: '超分辨率',
    scenes: ['实拍', '建筑', '纹理丰富'],
    vram: 12.6,
    latencyMs: 38,
    rating: 4.6,
    enabled: true,
    precision: 'FP16'
  },
  {
    id: 'mdl-swinir-l',
    name: 'SwinIR',
    version: 'L',
    type: '超分辨率',
    scenes: ['细节保守', '档案'],
    vram: 22.4,
    latencyMs: 118,
    rating: 4.4,
    enabled: true,
    precision: 'FP16'
  },
  {
    id: 'mdl-anime-sr2',
    name: 'Anime-SR',
    version: 'v2',
    type: '超分辨率',
    scenes: ['动漫', '线条稿'],
    vram: 9.8,
    latencyMs: 29,
    rating: 4.7,
    enabled: true,
    precision: 'INT8'
  },
  {
    id: 'mdl-scunet',
    name: 'SCUNet',
    version: 'v1.1',
    type: '去噪',
    scenes: ['高斯噪声', '真实噪声'],
    vram: 8.4,
    latencyMs: 34,
    rating: 4.5,
    enabled: true,
    precision: 'FP16'
  },
  {
    id: 'mdl-tdn',
    name: 'TDN',
    version: 'v2.0',
    type: '去噪',
    scenes: ['时域降噪', '低照度'],
    vram: 11.2,
    latencyMs: 52,
    rating: 4.6,
    enabled: true,
    precision: 'FP16'
  },
  {
    id: 'mdl-carn',
    name: 'CARN',
    version: 'v1.3',
    type: '去噪',
    scenes: ['轻量', '实时'],
    vram: 4.2,
    latencyMs: 16,
    rating: 4.1,
    enabled: false,
    precision: 'INT8'
  },
  {
    id: 'mdl-rife-46',
    name: 'RIFE',
    version: '4.6',
    type: '插帧',
    scenes: ['通用', '快速'],
    vram: 7.6,
    latencyMs: 22,
    rating: 4.8,
    enabled: true,
    precision: 'FP16'
  },
  {
    id: 'mdl-film',
    name: 'FILM',
    version: 'v1.0',
    type: '插帧',
    scenes: ['大位移', '体育'],
    vram: 14.8,
    latencyMs: 96,
    rating: 4.7,
    enabled: true,
    precision: 'FP16'
  },
  {
    id: 'mdl-codeformer',
    name: 'CodeFormer',
    version: 'v1.0',
    type: '人脸修复',
    scenes: ['保真', '取证'],
    vram: 6.8,
    latencyMs: 41,
    rating: 4.8,
    enabled: true,
    precision: 'FP16'
  },
  {
    id: 'mdl-gfpgan',
    name: 'GFPGAN',
    version: 'v1.4',
    type: '人脸修复',
    scenes: ['清晰优先', '宣传物料'],
    vram: 5.6,
    latencyMs: 33,
    rating: 4.5,
    enabled: true,
    precision: 'FP16'
  },
  {
    id: 'mdl-deblur-net',
    name: 'DeblurNet',
    version: 'v2.1',
    type: '去模糊',
    scenes: ['运动模糊', '监控'],
    vram: 10.4,
    latencyMs: 58,
    rating: 4.3,
    enabled: true,
    precision: 'FP16'
  }
]

export const modelMap = Object.fromEntries(models.map((m) => [m.id, m]))
