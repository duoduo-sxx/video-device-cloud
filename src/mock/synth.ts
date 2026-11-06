import type {
  AnalysisSummary,
  EntityItem,
  EntityType,
  EventItem,
  EventType,
  PersonTrack,
  SceneSegment,
  ShotType,
  CameraMove,
  TranscriptSegment,
  VideoCategory,
  VideoItem,
} from '../types'
import { coverUrl } from '../lib/utils'

/** 确定性伪随机，保证同一视频每次打开数据一致 */
function makeRng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function hashCode(str: string) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

interface CategoryLib {
  speakers: { name: string; role: string }[]
  lines: string[]
  scenes: string[]
  objects: string[]
  environments: string[]
  eventTypes: EventType[]
}

const LIB: Record<VideoCategory, CategoryLib> = {
  新闻资讯: {
    speakers: [
      { name: '记者', role: '出镜报道' },
      { name: '受访市民', role: '现场当事人' },
      { name: '负责人', role: '相关单位' },
      { name: '旁白', role: '解说' },
    ],
    lines: [
      '记者现在所在的位置是现场，可以看到周边已经拉起了警戒线，工作人员正在逐户排查。',
      '我们是早上六点多接到的通知，挨家挨户敲门，能走的都先转移到安置点了。',
      '这次一共投入了三十多台设备，两百余名工作人员参与，整个过程按照预案执行。',
      '目前现场秩序总体平稳，没有出现人员伤亡，后续处置工作仍在继续。',
      '对于居民关心的补偿和安置问题，相关部门表示会在三个工作日内给出明确答复。',
      '这条路以前一下雨就积水，这次改造之后应该会好很多，我们也就放心了。',
      '截至发稿时，现场的主要作业已经完成，交通正在逐步恢复。',
    ],
    scenes: [
      '中景跟拍记者在现场边走边讲述，背景是正在作业的工作人员。',
      '全景交代现场整体环境，人群与设备分布在画面中景与后景。',
      '近景拍摄受访者面部，背景虚化，手持轻微晃动。',
      '特写拍摄工作人员手部操作与设备细节。',
      '空镜拍摄现场周边的街道与环境，光线为自然散射光。',
    ],
    objects: ['警戒线', '反光背心', '作业车辆', '手持话筒', '告示牌', '对讲机'],
    environments: ['户外 · 街道', '户外 · 安置点', '室内 · 临时指挥部'],
    eventTypes: ['人物出场', '关键动作', '对话高潮', '数据展示', '场景转换'],
  },
  纪录片: {
    speakers: [
      { name: '旁白', role: '解说' },
      { name: '主人公', role: '记录对象' },
      { name: '受访者', role: '相关人物' },
    ],
    lines: [
      '这个工序看起来简单，实际上手上一慢，整件东西就得重来。',
      '我从二十岁进厂，到现在三十多年了，中间没有离开过这条街。',
      '以前这条巷子里有十几家做这个的，现在只剩我们这一家还开着门。',
      '年轻人不愿意学，坐不住，学三个月就跑了，也不能怪他们。',
      '机器做出来的东西是齐的，但那点不齐才是活的。',
      '每天早上七点开门，晚上什么时候做完什么时候关，几十年都是这样。',
      '我不指望它能挣多少钱，就是希望这个东西别在我手上断掉。',
    ],
    scenes: [
      '特写拍摄手部与工具的接触，浅景深，背景完全虚化。',
      '中景拍摄人物在工位上的工作姿态，侧逆光勾出轮廓。',
      '全景交代工作空间，墙面与器物构成画面的纵深层次。',
      '近景拍摄面部，眼神落在画外，自然光从侧面进入。',
      '空镜拍摄窗外的街景与光线变化，作为段落之间的呼吸。',
    ],
    objects: ['工作台', '手工工具', '半成品', '旧照片', '木牌匾', '茶杯'],
    environments: ['室内 · 工坊', '户外 · 老街', '室内 · 陈列室'],
    eventTypes: ['人物出场', '关键动作', '对话高潮', '场景转换', '风险事件'],
  },
  教学课程: {
    speakers: [
      { name: '讲师', role: '授课' },
      { name: '学员', role: '提问' },
    ],
    lines: [
      '我们先回顾一下上一讲的内容，然后再进入今天的主题。',
      '这里的关键在于，要把整体拆成可以分别处理的部分，再逐个解决。',
      '大家注意看这个例子，第一步做什么，第二步做什么，顺序不能反。',
      '如果这一步跳过去，后面所有的结论都不成立，这是最常见的错误。',
      '老师，这个地方如果条件不满足，是不是就不能用这个方法了？',
      '对，这是一个很好的问题，我们分两种情况来看。',
      '课后大家可以拿这份材料自己跑一遍，下节课我们讲它的局限性。',
    ],
    scenes: [
      '中景拍摄讲师站在讲台前讲解，画面右侧为投影内容。',
      '特写拍摄板书与手写标注，笔迹与箭头构成逻辑关系。',
      '屏幕录制画面，逐步展示推导过程与高亮区域。',
      '近景拍摄学员提问，教室背景虚化。',
      '全景拍摄教室整体，学员就座听讲。',
    ],
    objects: ['投影幕', '板书', '激光笔', '讲义', '笔记本', '水杯'],
    environments: ['室内 · 录播室', '室内 · 教室'],
    eventTypes: ['人物出场', '关键动作', '对话高潮', '数据展示', '场景转换'],
  },
  人物访谈: {
    speakers: [
      { name: '主持人', role: '访谈者' },
      { name: '受访者', role: '嘉宾' },
    ],
    lines: [
      '您在这个行业里做了多久？最开始是怎么进入这一行的？',
      '严格算起来是第十一年，最开始其实完全是个偶然。',
      '那几年最难的时候，账上的钱只够发两个月工资，我把房子抵押了。',
      '现在回头看，那个决定是对的，但当时真的没有把握。',
      '您觉得这十年里，最大的变化是什么？',
      '变化是工具变了，但判断问题的逻辑其实没怎么变。',
      '如果让您给刚入行的年轻人一句建议，您会说什么？',
    ],
    scenes: [
      '中景双人访谈构图，主持人位于画面左侧，嘉宾位于右侧。',
      '近景拍摄嘉宾面部，浅景深，背景为陈列架。',
      '过肩镜头拍摄主持人提问，前景虚化。',
      '全景交代访谈空间，灯光为柔和的三点布光。',
      '特写拍摄嘉宾手部动作与桌面物件。',
    ],
    objects: ['沙发', '茶几', '麦克风', '陈列架', '产品模型', '奖杯'],
    environments: ['室内 · 会客厅', '室内 · 访谈间'],
    eventTypes: ['人物出场', '对话高潮', '场景转换', '数据展示'],
  },
  企业宣传: {
    speakers: [
      { name: '旁白', role: '解说' },
      { name: '负责人', role: '出镜讲解' },
    ],
    lines: [
      '我们把整个流程搬到了同一套系统里，每一个环节都可以被实时看到。',
      '从第一条产线联网到现在，一共用了十年时间。',
      '过去一个零件出问题，要打十几个电话才能定位，现在只需要几秒钟。',
      '技术的价值不在于它有多先进，而在于它能不能被一线的人用起来。',
      '目前系统已经覆盖了三个基地，接入设备超过两千台。',
    ],
    scenes: [
      '航拍全景展示园区整体规模，光线为清晨低角度侧光。',
      '中景拍摄产线运行，机械臂与传送带构成重复节奏。',
      '特写拍摄屏幕上的数据界面，数值与曲线清晰可读。',
      '近景拍摄操作人员在中控台前工作。',
      '三维动画演示系统内部的数据流向与模块联动。',
    ],
    objects: ['机械臂', '中控大屏', '数据看板', '产品样机', '工牌', '安全帽'],
    environments: ['室内 · 产线', '室内 · 中控室', '户外 · 园区'],
    eventTypes: ['数据展示', '产品露出', '关键动作', '场景转换'],
  },
  Vlog: {
    speakers: [
      { name: '出镜者', role: '本人' },
      { name: '路人', role: '随机采访' },
    ],
    lines: [
      '现在是早上六点半，天刚亮，我准备出发了。',
      '这一段路比想象中难走，海拔上得很快，走两步就要喘。',
      '刚才那个垭口风特别大，站都站不稳，但风景是真的值。',
      '中午就在路边随便吃点，这个是我自己带的。',
      '今天总共走了十九公里，脚已经不太行了，但心情很好。',
      '如果你也走这条线，记得多带一件厚衣服，晚上真的很冷。',
    ],
    scenes: [
      '手持自拍视角，出镜者在画面中央，背景为道路与天空。',
      '广角全景拍摄山谷与云层，画面有明显的呼吸感。',
      '特写拍摄脚部与地面，泥泞与碎石细节清晰。',
      '中景拍摄出镜者在路边休息，逆光剪影。',
      '延时空镜记录光线变化与云层移动。',
    ],
    objects: ['背包', '自行车', '登山杖', '运动相机', '水壶', '帐篷'],
    environments: ['户外 · 山路', '户外 · 垭口', '户外 · 营地'],
    eventTypes: ['人物出场', '关键动作', '场景转换', '风险事件'],
  },
  影视片段: {
    speakers: [
      { name: '男主角', role: '角色' },
      { name: '女主角', role: '角色' },
      { name: '配角', role: '角色' },
    ],
    lines: [
      '你走的时候，什么都没说。',
      '我说了，是你没听见。',
      '这些年我一直以为，你至少会回来一次。',
      '回来做什么？看这间空房子，还是看你们过得很好？',
      '妈走的那天，一直在叫你的名字。',
      '……我不知道。',
      '现在你知道了。',
    ],
    scenes: [
      '中景双人对峙构图，两人分处画面两侧，中间留白。',
      '特写拍摄面部，眼眶泛红，光线为单一侧光。',
      '近景过肩镜头，前景人物肩部虚化。',
      '全景拍摄空荡的屋内空间，人物位于画面边缘。',
      '空镜拍摄窗外，雨水沿玻璃流下。',
    ],
    objects: ['旧木桌', '行李箱', '相框', '窗', '台灯', '茶杯'],
    environments: ['室内 · 老屋', '室外 · 院中', '室内 · 站台'],
    eventTypes: ['人物出场', '对话高潮', '关键动作', '场景转换'],
  },
  体育赛事: {
    speakers: [
      { name: '解说员', role: '赛事解说' },
      { name: '现场采访', role: '赛后采访' },
    ],
    lines: [
      '比赛进入到最后的两公里，领先集团还没有拉开明显的差距。',
      '这个配速对于他来说是比较舒服的，看得出来还有余力。',
      '最后四百米，他开始加速了，后面的选手明显跟不上。',
      '冲线！成绩是两小时十一分，刷新了赛会纪录。',
      '今天的状态很好，赛道也很适合出成绩，感谢团队。',
    ],
    scenes: [
      '全景航拍展示赛道与选手集团，构图沿道路纵深延伸。',
      '中景跟拍领先选手，背景观众虚化流动。',
      '特写拍摄选手面部与呼吸状态，汗水清晰可见。',
      '近景拍摄终点计时牌与冲线瞬间。',
      '空镜拍摄赛道环境与观众区。',
    ],
    objects: ['号码布', '计时牌', '补给桌', '护栏', '终点拱门', '奖牌'],
    environments: ['户外 · 赛道', '户外 · 终点区'],
    eventTypes: ['关键动作', '人物出场', '数据展示', '场景转换'],
  },
  监控录像: {
    speakers: [{ name: '系统', role: '无音频' }],
    lines: [
      '画面中无有效语音，仅存在环境噪声，未触发语音事件。',
      '检测到人员进入画面，持续时间约十四秒，轨迹由左向右。',
      '检测到车辆驶入，车牌区域被遮挡，无法识别。',
      '画面亮度在十八时零四分显著下降，判定为照明变化。',
      '未检测到异常滞留、翻越或聚集行为。',
    ],
    scenes: [
      '固定机位全景，覆盖出入口与通道，画面无明显运动。',
      '中景区域内出现人员活动，轨迹清晰。',
      '低照度画面，噪点较多，细节可辨性下降。',
      '车辆通过画面，遮挡部分区域约三秒。',
    ],
    objects: ['出入口', '道闸', '车辆', '行人', '照明灯', '指示牌'],
    environments: ['户外 · 出入口', '室内 · 通道'],
    eventTypes: ['关键动作', '风险事件', '场景转换'],
  },
  直播回放: {
    speakers: [
      { name: '主播', role: '出镜' },
      { name: '助播', role: '配合' },
    ],
    lines: [
      '宝宝们看一下这个细节，我把镜头推近一点。',
      '这个价格只有今天有，库存不多了，喜欢的赶紧下单。',
      '来，我们上链接，三、二、一。',
      '刚刚已经卖完了，没有抢到的关注一下，我们下场上。',
      '这个面料是有一点厚度的，秋天穿刚刚好，不会闷。',
      '有问题打在公屏上，我一个个给大家回。',
    ],
    scenes: [
      '竖屏中景拍摄主播半身，背景为货品陈列架。',
      '特写拍摄商品细节与吊牌，镜头推近。',
      '近景拍摄主播手持商品讲解，手部动作频繁。',
      '全景拍摄直播间环境，灯光与补光设备可见。',
      '画面切入商品贴片与价格信息。',
    ],
    objects: ['商品', '吊牌', '包装袋', '补光灯', '手机支架', '贴片'],
    environments: ['室内 · 直播间', '室内 · 展示区'],
    eventTypes: ['产品露出', '对话高潮', '关键动作', '数据展示'],
  },
}

const SHOTS: ShotType[] = ['特写', '近景', '中景', '全景', '远景', '空镜']
const MOVES: CameraMove[] = ['固定', '推', '拉', '摇', '移', '跟', '升降']

export function synthAnalysis(video: VideoItem) {
  const rnd = makeRng(hashCode(video.id + video.title))
  const lib = LIB[video.category] ?? LIB['新闻资讯']
  const dur = video.duration

  const speakers = lib.speakers.map((s, i) => ({
    id: `spk_${i}_${hashCode(s.name) % 97}`,
    ...s,
    color: ['#2563EB', '#7C3AED', '#0F766E', '#B45309', '#BE123C'][i % 5],
  }))

  const segCount = Math.max(8, Math.min(34, Math.round(dur / 26)))
  const hasAudio = video.category !== '监控录像'

  const transcript: TranscriptSegment[] = []
  if (hasAudio) {
    let cursor = Math.min(12, dur * 0.02)
    for (let i = 0; i < segCount; i++) {
      const text = lib.lines[i % lib.lines.length]
      const len = Math.max(2.6, Math.min(dur * 0.05, text.length * 0.24))
      const left = (dur - cursor) / Math.max(1, segCount - i)
      const gap = left * (0.55 + rnd() * 0.5)
      const start = Math.min(dur - len - 1, cursor + gap * 0.35)
      const sp = speakers[i % Math.max(1, speakers.length)]
      transcript.push({
        id: `tr_${String(i + 1).padStart(3, '0')}`,
        start: Math.round(start * 10) / 10,
        end: Math.round((start + len) * 10) / 10,
        text,
        speakerId: sp.id,
        speakerName: sp.name,
        confidence: Math.round((0.86 + rnd() * 0.12) * 1000) / 1000,
        keywords: video.tags.slice(0, 2),
      })
      cursor = start + len
    }
  } else {
    for (let i = 0; i < 6; i++) {
      transcript.push({
        id: `tr_${String(i + 1).padStart(3, '0')}`,
        start: Math.round((i * dur) / 6),
        end: Math.round(((i + 1) * dur) / 6),
        text: lib.lines[i % lib.lines.length],
        speakerId: 'spk_sys',
        speakerName: '系统',
        confidence: 0.99,
        keywords: video.tags.slice(0, 2),
      })
    }
  }

  const sceneCount = Math.max(6, Math.min(26, Math.round(dur / 48)))
  const scenes: SceneSegment[] = Array.from({ length: sceneCount }, (_, i) => {
    const start = Math.round((i * dur) / sceneCount)
    const end = Math.round(((i + 1) * dur) / sceneCount)
    const pick = lib.scenes[i % lib.scenes.length]
    return {
      id: `sc_${String(i + 1).padStart(3, '0')}`,
      index: i + 1,
      start,
      end,
      thumbnailUrl: coverUrl(`${video.id}_s${i}`, 320, 180),
      shotType: SHOTS[Math.floor(rnd() * SHOTS.length)],
      cameraMove: MOVES[Math.floor(rnd() * MOVES.length)],
      description: pick,
      objects: [lib.objects[i % lib.objects.length], lib.objects[(i + 2) % lib.objects.length]],
      environment: lib.environments[i % lib.environments.length],
      aesthetics: {
        composition: 74 + Math.round(rnd() * 20),
        lighting: 70 + Math.round(rnd() * 24),
        color: 72 + Math.round(rnd() * 22),
        clarity: 76 + Math.round(rnd() * 20),
      },
    }
  })

  const personCount = video.category === '监控录像' ? 0 : Math.min(speakers.length, 4)
  const persons: PersonTrack[] = speakers.slice(0, Math.max(1, personCount)).map((sp, i) => {
    const appCount = 2 + Math.floor(rnd() * 3)
    const appearances = Array.from({ length: appCount }, (_, j) => {
      const start = Math.round(((j + i * 0.3) / appCount) * dur * 0.9) + 8
      const len = Math.max(14, Math.round(dur / appCount / 3))
      return { start, end: Math.min(dur, start + len) }
    })
    return {
      id: `p_${String(i + 1).padStart(2, '0')}`,
      name: sp.name,
      role: sp.role,
      avatarUrl: coverUrl(`${video.id}_p${i}`, 80, 80),
      color: sp.color,
      appearances,
      faceCount: 60 + Math.floor(rnd() * 420),
      confidence: Math.round((0.85 + rnd() * 0.13) * 1000) / 1000,
      description: `${sp.role}，在片中共出现 ${appCount} 个区间，累计约 ${Math.round(
        appearances.reduce((s, a) => s + (a.end - a.start), 0) / 60,
      )} 分钟。`,
    }
  })

  const evCount = Math.max(4, Math.min(9, Math.round(dur / 180) + 3))
  const events: EventItem[] = Array.from({ length: evCount }, (_, i) => {
    const start = Math.round(((i + 0.5) / evCount) * dur)
    const type = lib.eventTypes[i % lib.eventTypes.length]
    const seg = transcript[Math.min(transcript.length - 1, Math.round((i / evCount) * transcript.length))]
    return {
      id: `ev_${String(i + 1).padStart(2, '0')}`,
      start,
      end: Math.min(dur, start + 8 + Math.floor(rnd() * 14)),
      type,
      title: ['开场建立', '核心段落', '情绪高点', '信息密度峰值', '转折出现', '收束前的停顿'][i % 6],
      description: seg?.text ?? lib.scenes[i % lib.scenes.length],
      confidence: Math.round((0.78 + rnd() * 0.18) * 1000) / 1000,
      thumbnailUrl: coverUrl(`${video.id}_e${i}`, 320, 180),
      entities: video.tags.slice(0, 2),
      importance: (1 + (i % 5)) as 1 | 2 | 3 | 4 | 5,
    }
  })

  const entPool: [EntityType, string, number][] = [
    ...persons.map((p, i) => ['人物', p.name, 4 + i] as [EntityType, string, number]),
    ...video.tags.map((t, i) => ['物品', t, 3 + ((i * 3) % 9)] as [EntityType, string, number]),
    ...lib.objects.map((o, i) => ['物品', o, 2 + ((i * 5) % 11)] as [EntityType, string, number]),
    ...lib.environments.map((e, i) => ['地点', e.replace(/^.*·\s*/, ''), 2 + i] as [EntityType, string, number]),
    ['动作', '讲解', 9],
    ['动作', '操作', 12],
    ['动作', '行走', 7],
    ['情绪', '专注', 11],
    ['情绪', '平静', 14],
    ['情绪', '紧张', 5],
    ['风格', '纪实', 8],
    ['风格', '自然光', 12],
    ['风格', '浅景深', 9],
    ['风格', '同期声', 10],
  ]
  const entities: EntityItem[] = entPool
    .slice(0, 26)
    .map(([type, name, count], i) => ({
      id: `ent_${String(i + 1).padStart(3, '0')}`,
      type,
      name,
      count,
      confidence: Math.round((0.8 + rnd() * 0.18) * 1000) / 1000,
    }))
    .filter((e, i, arr) => arr.findIndex((x) => x.name === e.name) === i)

  const chapterTitles = ['一、开场与环境', '二、核心内容展开', '三、关键细节', '四、转折与深入', '五、收束']
  const chapterCount = dur > 1800 ? 5 : dur > 600 ? 4 : 3
  const chapters = Array.from({ length: chapterCount }, (_, i) => ({
    title: chapterTitles[i],
    start: Math.round((i * dur) / chapterCount),
    end: Math.round(((i + 1) * dur) / chapterCount),
    summary:
      i === 0
        ? `以${scenes[0]?.environment.replace('·', '的') ?? '现场环境'}建立空间，交代主题「${video.title}」的基本信息与人物关系。`
        : i === chapterCount - 1
          ? `全片收束，回到${video.location === '—' ? '主体' : video.location}，用相对平静的镜头结束叙述。`
          : `${lib.scenes[i % lib.scenes.length]}语段围绕${video.tags[i % video.tags.length]}展开，信息密度较高。`,
  }))

  const keyPoints = transcript
    .filter((_, i) => i % Math.max(2, Math.round(transcript.length / 6)) === 0)
    .slice(0, 6)
    .map((s) => ({ text: s.text, at: Math.round(s.start) }))

  const summary: AnalysisSummary = {
    oneLiner: `${video.title}——${video.description.replace(/。$/, '')}。模型在 ${
      hasAudio ? transcript.length + ' 句转写、' : ''
    }${scenes.length} 个场景中提取到 ${entities.length} 个实体与 ${events.length} 个关键事件。`,
    chapters,
    keyPoints: keyPoints.length ? keyPoints : [{ text: video.description, at: 20 }],
    keywords: [...video.tags, ...lib.objects.slice(0, 3)].slice(0, 8),
    quality: {
      composition: scenes.reduce((s, x) => s + x.aesthetics.composition, 0) / scenes.length | 0,
      lighting: scenes.reduce((s, x) => s + x.aesthetics.lighting, 0) / scenes.length | 0,
      color: scenes.reduce((s, x) => s + x.aesthetics.color, 0) / scenes.length | 0,
      clarity: scenes.reduce((s, x) => s + x.aesthetics.clarity, 0) / scenes.length | 0,
      stability: 72 + Math.round(rnd() * 22),
    },
    stats: {
      sceneCount: scenes.length,
      speakerCount: hasAudio ? new Set(transcript.map((t) => t.speakerId)).size : 0,
      faceCount: persons.length,
      speechRatio: hasAudio ? Math.round((0.42 + rnd() * 0.35) * 100) / 100 : 0,
      shotTypeDist: SHOTS.reduce<Record<string, number>>((acc, s) => {
        acc[s] = scenes.filter((x) => x.shotType === s).length
        return acc
      }, {}),
      cameraMoveDist: MOVES.reduce<Record<string, number>>((acc, m) => {
        acc[m] = scenes.filter((x) => x.cameraMove === m).length
        return acc
      }, {}),
    },
  }

  return { transcript, scenes, persons, events, entities, summary }
}
