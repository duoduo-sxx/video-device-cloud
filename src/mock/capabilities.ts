import type { Capability } from '@/types'

export const capabilities: Capability[] = [
  {
    id: 'superResolution',
    name: '超分辨率重建',
    shortName: '超分',
    icon: 'Sparkles',
    category: '分辨率提升',
    description: '基于生成式网络重建高频细节，将低分辨率画面放大 2–8 倍并保持边缘锐利。',
    principle:
      '采用多尺度残差密集块提取特征，配合对抗训练生成缺失的高频纹理。VID-SR 系列针对视频序列加入了帧间一致性约束，避免逐帧处理产生的闪烁与纹理漂移。',
    scenarios: ['标清素材 4K 重制', '手机视频提升至 1080p', '监控画面放大取证', '动漫番剧修复'],
    modelCount: 4,
    monthlyCalls: 1842,
    params: [
      {
        key: 'scale',
        label: '放大倍率',
        type: 'segmented',
        options: [
          { label: '2x', value: '2' },
          { label: '3x', value: '3' },
          { label: '4x', value: '4' },
          { label: '8x', value: '8' }
        ],
        default: '2',
        tip: '4x 及以上会显著增加显存占用，建议源分辨率不低于 480p'
      },
      {
        key: 'model',
        label: '重建模型',
        type: 'select',
        options: [
          { label: 'VID-SR v3.2（推荐 · 视频优化）', value: 'vid-sr-3.2' },
          { label: 'Real-ESRGAN x4plus（写实纹理强）', value: 'esrgan-4p' },
          { label: 'SwinIR-L（细节保守）', value: 'swinir-l' },
          { label: 'Anime-SR v2（动漫专用）', value: 'anime-sr-2' }
        ],
        default: 'vid-sr-3.2',
        tip: '写实素材优先 VID-SR，动漫素材使用 Anime-SR 可获得更干净的线条'
      },
      {
        key: 'detail',
        label: '细节强度',
        type: 'slider',
        min: 0,
        max: 100,
        step: 1,
        default: 65,
        unit: '%',
        tip: '过高会在平坦区域产生"塑料感"与伪纹理，建议 55–75'
      },
      {
        key: 'preDenoise',
        label: '超分前置去噪',
        type: 'switch',
        default: true,
        tip: '源素材噪点明显时开启，可避免噪声被放大成伪细节'
      },
      {
        key: 'facePriority',
        label: '人脸区域优先',
        type: 'switch',
        default: false,
        tip: '检测到人脸时分配更多算力，适合访谈、监控场景'
      }
    ],
    notice: [
      '放大倍率超过源素材有效分辨率的 4 倍时，收益递减明显。',
      '纯黑场或大面积天空区域可能出现轻微纹理噪点，可将细节强度降至 50 以下。',
      '8x 模式仅支持单帧或 1080p 以下短片，超出会被系统拒绝。'
    ]
  },
  {
    id: 'denoise',
    name: '时域去噪',
    shortName: '去噪',
    icon: 'Waves',
    category: '画质修复',
    description: '利用前后帧相关性分离噪声与真实运动，在降噪的同时保留胶片颗粒与布料纹理。',
    principle:
      '通过光流估计建立帧间对应关系，对同一空间位置的多帧样本做加权融合。相比逐帧空域降噪，时域方法不会把细小纹理误判为噪声抹平。',
    scenarios: ['夜间监控噪点抑制', '高感光度拍摄素材', '老录像带信号噪声', '弱光直播回放'],
    modelCount: 3,
    monthlyCalls: 1067,
    params: [
      {
        key: 'strength',
        label: '降噪强度',
        type: 'slider',
        min: 0,
        max: 100,
        step: 1,
        default: 55,
        unit: '%',
        tip: '强度 > 75 时静止区域可能出现"果冻感"，运动物体边缘会拖影'
      },
      {
        key: 'texturePreserve',
        label: '纹理保留',
        type: 'slider',
        min: 0,
        max: 100,
        step: 1,
        default: 70,
        unit: '%',
        tip: '越高越保留皮肤毛孔、织物纹理，但残留噪点也越多'
      },
      {
        key: 'window',
        label: '时域窗口',
        type: 'segmented',
        options: [
          { label: '3 帧', value: '3' },
          { label: '5 帧', value: '5' },
          { label: '7 帧', value: '7' }
        ],
        default: '5',
        tip: '窗口越大降噪越彻底，但快速运动场景容易出现残影'
      },
      {
        key: 'chromaOnly',
        label: '仅处理色度噪声',
        type: 'switch',
        default: false,
        tip: '开启后只消除彩色噪点，保留亮度颗粒，适合胶片素材'
      }
    ],
    notice: ['快速摇镜或主体高速运动时，建议将时域窗口降为 3 帧。', '与插帧同时使用时，先去噪再插帧，顺序不可颠倒。']
  },
  {
    id: 'artifactRemoval',
    name: '压缩伪影修复',
    shortName: '去伪影',
    icon: 'Eraser',
    category: '画质修复',
    description: '消除低码率编码产生的块效应、振铃与蚊式噪声，恢复被压坏的边缘与渐变。',
    principle:
      '检测 8×8 / 16×16 变换块边界的不连续能量，结合 DCT 系数分布估计量化强度，再用边缘引导的修复网络重建平滑渐变与锐利轮廓。',
    scenarios: ['低码率网盘片源', '二次转码素材', '直播录像', '老旧 DVD 转录'],
    modelCount: 2,
    monthlyCalls: 734,
    params: [
      {
        key: 'blockiness',
        label: '块效应强度',
        type: 'slider',
        min: 0,
        max: 100,
        step: 1,
        default: 45,
        unit: '%',
        tip: '块状边界越明显，该值应越高；过高会损失方形物体的转角'
      },
      {
        key: 'ringing',
        label: '振铃抑制',
        type: 'slider',
        min: 0,
        max: 100,
        step: 1,
        default: 38,
        unit: '%',
        tip: '针对高对比边缘的波纹状伪影，文字与线条场景适当提高'
      },
      {
        key: 'mosquito',
        label: '蚊式噪声',
        type: 'slider',
        min: 0,
        max: 100,
        step: 1,
        default: 52,
        unit: '%',
        tip: '运动物体周围的细碎噪点，与去噪能力叠加时建议降低'
      },
      {
        key: 'mode',
        label: '处理模式',
        type: 'segmented',
        options: [
          { label: '轻度', value: 'light' },
          { label: '标准', value: 'standard' },
          { label: '激进', value: 'aggressive' }
        ],
        default: 'standard',
        tip: '激进模式会重新生成区域纹理，速度快但可能改变原始细节'
      }
    ],
    notice: ['伪影修复应放在去噪之前执行，否则噪声会被误判为块边界。', '对 H.265 10bit 素材，建议开启高位深处理避免色带。']
  },
  {
    id: 'deblur',
    name: '去模糊',
    shortName: '去模糊',
    icon: 'Focus',
    category: '画质修复',
    description: '针对运动模糊、失焦与混合模糊估计退化核，恢复可辨识的轮廓与文字。',
    principle:
      '先用盲反卷积估计点扩散函数（PSF），再由条件生成网络补全被模糊核覆盖的高频信息。视频场景额外引入帧间先验，抑制逐帧反卷积的振铃。',
    scenarios: ['行车记录仪', '体育赛事抓拍', '手持跟拍', '监控移动目标'],
    modelCount: 2,
    monthlyCalls: 412,
    params: [
      {
        key: 'type',
        label: '模糊类型',
        type: 'segmented',
        options: [
          { label: '运动', value: 'motion' },
          { label: '失焦', value: 'defocus' },
          { label: '混合', value: 'mixed' }
        ],
        default: 'motion',
        tip: '类型判断错误会导致画面出现"重影"或过度锐化'
      },
      {
        key: 'strength',
        label: '恢复强度',
        type: 'slider',
        min: 0,
        max: 100,
        step: 1,
        default: 60,
        unit: '%',
        tip: '建议从 50 起逐步上调，避免边缘出现白边'
      },
      {
        key: 'kernelRadius',
        label: '模糊核半径',
        type: 'slider',
        min: 0.5,
        max: 8,
        step: 0.1,
        default: 2.4,
        unit: 'px',
        tip: '自动估计结果，可手动微调；半径过大将显著增加耗时'
      },
      {
        key: 'ringingSuppress',
        label: '振铃抑制',
        type: 'switch',
        default: true,
        tip: '开启后边缘更干净，但锐度略有下降'
      }
    ],
    notice: ['严重离焦（核半径 > 8px）的信息已不可恢复，强行处理只会产生伪纹理。', '去模糊与超分叠加时，建议先去模糊，避免超分放大模糊核。']
  },
  {
    id: 'frameInterpolation',
    name: '智能插帧',
    shortName: '插帧',
    icon: 'Film',
    category: '时间维度',
    description: '通过光流与生成式中间帧合成，把 24/25/30fps 提升至 50/60/120fps，运动更顺滑。',
    principle:
      '双向光流估计相邻帧的像素位移，在时间中点做双向 warp 得到候选中间帧，再由细化网络修复遮挡区域与光流误差，最后按目标帧率重采样时间轴。',
    scenarios: ['24fps 电影转 60fps', '体育慢动作', '游戏录制提升流畅度', '老动画补帧'],
    modelCount: 3,
    monthlyCalls: 689,
    params: [
      {
        key: 'targetFps',
        label: '目标帧率',
        type: 'segmented',
        options: [
          { label: '50fps', value: '50' },
          { label: '60fps', value: '60' },
          { label: '120fps', value: '120' }
        ],
        default: '60',
        tip: '目标帧率需为源帧率的整数倍，否则会触发混合重采样'
      },
      {
        key: 'model',
        label: '光流模型',
        type: 'select',
        options: [
          { label: 'RIFE 4.6（通用 · 快速）', value: 'rife-4.6' },
          { label: 'IFRNet v2（遮挡处理好）', value: 'ifrnet-2' },
          { label: 'FILM（大运动 · 慢）', value: 'film' }
        ],
        default: 'rife-4.6',
        tip: '大位移、快速运动场景建议 FILM，但耗时约为 RIFE 的 4 倍'
      },
      {
        key: 'occlusion',
        label: '遮挡区域处理',
        type: 'switch',
        default: true,
        tip: '关闭后前景遮挡背景处可能出现"撕裂"，不建议关闭'
      },
      {
        key: 'sceneDetect',
        label: '场景切换保护',
        type: 'switch',
        default: true,
        tip: '检测到硬切时跳过插帧，避免生成无意义的过渡帧'
      }
    ],
    notice: ['插帧会改变时间轴长度，若需与原音轨对齐请开启音频重采样。', '含大量字幕或硬水印的素材，插帧后文字边缘可能抖动。', '120fps 输出需目标播放设备支持，否则会被播放器抽帧。']
  },
  {
    id: 'stabilization',
    name: '视频稳像',
    shortName: '稳像',
    icon: 'Video',
    category: '时间维度',
    description: '分离相机抖动与主观运镜，平滑高频晃动同时保留推拉摇移的创作意图。',
    principle:
      '在相邻帧间估计全局单应变换，分解为低频运镜轨迹与高频抖动分量。仅对高频部分做平滑，再通过边界外扩与内容填充补偿裁切区域。',
    scenarios: ['手持 Vlog', '无人机航拍', '车载记录', '长焦跟拍'],
    modelCount: 2,
    monthlyCalls: 386,
    params: [
      {
        key: 'smoothness',
        label: '平滑强度',
        type: 'slider',
        min: 0,
        max: 100,
        step: 1,
        default: 70,
        unit: '%',
        tip: '过高会让刻意的摇镜变"黏"，纪实类素材建议 50–65'
      },
      {
        key: 'cropLimit',
        label: '最大裁切比例',
        type: 'slider',
        min: 2,
        max: 25,
        step: 1,
        default: 12,
        unit: '%',
        tip: '裁切越多稳定余量越大，但有效分辨率下降'
      },
      {
        key: 'rollingShutter',
        label: '滚动快门校正',
        type: 'switch',
        default: false,
        tip: '针对 CMOS 果冻效应，开启会增加约 15% 耗时'
      },
      {
        key: 'horizonLock',
        label: '水平锁定',
        type: 'switch',
        default: false,
        tip: '强制地平线水平，适合航拍；会裁切更多边缘'
      }
    ],
    notice: ['稳像会输出重新裁切的画面，请确认关键主体不在边缘。', '与插帧同用时，建议先稳像再插帧，减少光流误判。']
  },
  {
    id: 'colorEnhance',
    name: '色彩增强',
    shortName: '色彩',
    icon: 'Palette',
    category: '画质修复',
    description: '自动白平衡、对比与饱和度重塑，支持 HDR/SDR 色调映射与 Log 素材还原。',
    principle:
      '基于灰度世界与白点检测估计色偏，结合局部对比度保持（CLAHE）提升动态范围观感。色调映射采用分段曲线，保护高光细节不溢出。',
    scenarios: ['室内偏色素材', 'HDR 转 SDR 交付', 'Log 素材快速还原', '老片褪色修复'],
    modelCount: 2,
    monthlyCalls: 528,
    params: [
      {
        key: 'autoWB',
        label: '自动白平衡',
        type: 'switch',
        default: true,
        tip: '以画面中性灰为参考校正色温，强单色场景可能失效'
      },
      {
        key: 'contrast',
        label: '对比度',
        type: 'slider',
        min: -50,
        max: 50,
        step: 1,
        default: 12,
        unit: '',
        tip: '负值可压低高光，适合过曝素材'
      },
      {
        key: 'saturation',
        label: '饱和度',
        type: 'slider',
        min: -50,
        max: 50,
        step: 1,
        default: 8,
        unit: '',
        tip: '老片褪色可提高至 20–30，注意避免肤色过饱和'
      },
      {
        key: 'toneMapping',
        label: '色调映射',
        type: 'select',
        options: [
          { label: '不启用', value: 'none' },
          { label: 'HDR10 → SDR (BT.2390)', value: 'hdr-sdr' },
          { label: 'HLG → SDR', value: 'hlg-sdr' },
          { label: 'SDR 扩展（模拟 HDR 观感）', value: 'sdr-expand' }
        ],
        default: 'none',
        tip: '仅在源素材与目标色彩空间不一致时需要启用'
      },
      {
        key: 'logRestore',
        label: 'Log 素材还原',
        type: 'switch',
        default: false,
        tip: '识别 S-Log3 / V-Log / D-Log 并套用对应还原 LUT'
      }
    ],
    notice: ['自动白平衡对大面积单色画面（如雪景、夕阳）容易判断失误，建议关闭后手动设定色温。', '色彩处理应放在流水线末端，避免后续能力改变色域。']
  },
  {
    id: 'faceRestore',
    name: '人脸修复',
    shortName: '人脸',
    icon: 'ScanFace',
    category: '专项增强',
    description: '检测并重建低清人脸的五官细节，可调保真度以平衡"像本人"与"够清晰"。',
    principle:
      '先由 RetinaFace 定位关键点并对齐，再用 CodeFormer 的 Transformer 结构在潜空间补全细节，最后按保真度权重与原图融合，避免完全生成导致的身份偏移。',
    scenarios: ['监控人脸取证', '老照片/老影像人物', '低清访谈素材', '家族录像修复'],
    modelCount: 2,
    monthlyCalls: 476,
    params: [
      {
        key: 'model',
        label: '修复模型',
        type: 'select',
        options: [
          { label: 'CodeFormer v1.0（保真优先）', value: 'codeformer' },
          { label: 'GFPGAN v1.4（清晰优先）', value: 'gfpgan' },
          { label: 'GPEN-1024（高分辨率）', value: 'gpen' }
        ],
        default: 'codeformer',
        tip: '取证场景建议 CodeFormer，宣传物料可用 GFPGAN 追求观感'
      },
      {
        key: 'fidelity',
        label: '保真度权重',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.05,
        default: 0.7,
        unit: '',
        tip: '0 = 完全生成（更清晰但可能不像本人），1 = 完全保留原图'
      },
      {
        key: 'onlyFace',
        label: '仅处理人脸区域',
        type: 'switch',
        default: true,
        tip: '关闭后会对整个人物区域重建，可能改变服装纹理'
      },
      {
        key: 'minFaceSize',
        label: '最小人脸尺寸',
        type: 'slider',
        min: 16,
        max: 128,
        step: 8,
        default: 32,
        unit: 'px',
        tip: '小于该尺寸的人脸将被跳过，避免无效计算'
      }
    ],
    notice: ['人脸修复属于生成式重建，不应用于需要作为法律证据的原始画面认定。', '侧脸、遮挡、极低照度下检测可能失败，任务日志会输出跳过帧数。']
  },
  {
    id: 'plateEnhance',
    name: '车牌文字增强',
    shortName: '车牌',
    icon: 'ScanText',
    category: '专项增强',
    description: '针对车牌、门牌、标牌等文字区域做定向超分与二值化，提升可辨识度。',
    principle:
      '先用文本检测网络定位字符区域，按透视变换矫正到正视图，再用字符级超分网络重建笔画，最后可选二值化输出供 OCR 使用。',
    scenarios: ['路口卡口取证', '停车场纠纷', '门牌识别', '集装箱编号'],
    modelCount: 1,
    monthlyCalls: 218,
    params: [
      {
        key: 'scene',
        label: '场景类型',
        type: 'segmented',
        options: [
          { label: '路口', value: 'junction' },
          { label: '室内', value: 'indoor' },
          { label: '夜间', value: 'night' }
        ],
        default: 'junction',
        tip: '不同场景使用不同的退化模型，选错会降低字符还原率'
      },
      {
        key: 'strength',
        label: '增强强度',
        type: 'slider',
        min: 0,
        max: 100,
        step: 1,
        default: 75,
        unit: '%',
        tip: '夜间素材适当提高，但过高会粘连相邻字符'
      },
      {
        key: 'binarize',
        label: '二值化输出',
        type: 'switch',
        default: false,
        tip: '输出黑白图像，便于后续 OCR；会丢失颜色信息'
      },
      {
        key: 'perspectiveFix',
        label: '透视矫正',
        type: 'switch',
        default: true,
        tip: '将倾斜拍摄的车牌拉正，倾斜角超过 45° 时可能失败'
      }
    ],
    notice: ['增强结果仅用于辅助辨认，不能替代原始帧作为鉴定依据。', '字符高度小于 12px 时还原率显著下降，日志会标记低置信度结果。']
  },
  {
    id: 'filmRestore',
    name: '老片专项修复',
    shortName: '老片',
    icon: 'Clapperboard',
    category: '专项增强',
    description: '一体化处理胶片划痕、霉斑、闪烁与帧抖动，并可选保留胶片颗粒质感。',
    principle:
      '先用时域差分检测非运动的瞬时缺陷（划痕、脏点），用邻帧内容做 patch 修复；再对全局亮度做直方图稳定以消除闪烁；最后按需合成颗粒层。',
    scenarios: ['老电影数字化', '录像带转录', '家庭影像归档', '资料馆修复'],
    modelCount: 3,
    monthlyCalls: 302,
    params: [
      {
        key: 'scratch',
        label: '划痕去除',
        type: 'slider',
        min: 0,
        max: 100,
        step: 1,
        default: 65,
        unit: '%',
        tip: '垂直划痕检测灵敏度；过高会误删画面中的细长物体'
      },
      {
        key: 'flicker',
        label: '去闪烁',
        type: 'slider',
        min: 0,
        max: 100,
        step: 1,
        default: 70,
        unit: '%',
        tip: '针对逐帧亮度跳变，曝光本身变化大的素材慎用'
      },
      {
        key: 'mold',
        label: '霉斑/脏点',
        type: 'slider',
        min: 0,
        max: 100,
        step: 1,
        default: 55,
        unit: '%',
        tip: '静态霉斑会被视为画面内容，需要时域检测辅助'
      },
      {
        key: 'grainPreserve',
        label: '保留胶片颗粒',
        type: 'switch',
        default: true,
        tip: '关闭后画面会显得过于"数码"，丧失胶片质感'
      },
      {
        key: 'deflickerMode',
        label: '闪烁处理模式',
        type: 'select',
        options: [
          { label: '全局直方图稳定', value: 'global' },
          { label: '局部自适应', value: 'local' },
          { label: '关闭', value: 'off' }
        ],
        default: 'global',
        tip: '局部自适应适合有大量明暗变化的场景，但耗时翻倍'
      }
    ],
    notice: ['老片修复建议顺序：去闪烁 → 去划痕 → 去噪 → 超分 → 插帧 → 色彩。', '胶片颗粒是观感的一部分，若非必要请保留。']
  }
]

export const capabilityMap = Object.fromEntries(capabilities.map((c) => [c.id, c])) as Record<
  Capability['id'],
  Capability
>
