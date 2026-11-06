import type {
  AnalysisTask,
  AuditLog,
  ModelItem,
  Notification,
  ProjectItem,
  ReviewItem,
  UserItem,
  VideoCategory,
  VideoItem,
  VideoStatus,
} from '../types'
import { avatarUrl, coverUrl } from '../lib/utils'

const BASE = new Date('2026-10-19T09:30:00+08:00').getTime()
const day = 86400000
const ago = (days: number, hour = 10, minute = 0) => {
  const d = new Date(BASE - days * day)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

export const users: UserItem[] = [
  { id: 'u01', name: '陈砚舟', account: 'chenyanzhou', role: 'admin', department: '平台技术部', email: 'chenyz@videolab.cn', phone: '138****2046', avatarUrl: avatarUrl(12), status: 'active', lastLoginAt: ago(0, 9, 12) },
  { id: 'u02', name: '林知远', account: 'linzhiyuan', role: 'analyst', department: '内容运营部', email: 'linzy@videolab.cn', phone: '139****7713', avatarUrl: avatarUrl(33), status: 'active', lastLoginAt: ago(0, 8, 42) },
  { id: 'u03', name: '苏未晞', account: 'suweixi', role: 'analyst', department: '内容运营部', email: 'suwx@videolab.cn', phone: '137****5580', avatarUrl: avatarUrl(45), status: 'active', lastLoginAt: ago(0, 9, 5) },
  { id: 'u04', name: '周慕白', account: 'zhoumubai', role: 'reviewer', department: '内容安全部', email: 'zhoumb@videolab.cn', phone: '135****9921', avatarUrl: avatarUrl(51), status: 'active', lastLoginAt: ago(0, 8, 20) },
  { id: 'u05', name: '何清野', account: 'heqingye', role: 'reviewer', department: '内容安全部', email: 'heqy@videolab.cn', phone: '186****3374', avatarUrl: avatarUrl(15), status: 'active', lastLoginAt: ago(1, 17, 40) },
  { id: 'u06', name: '顾南枝', account: 'gunanzhi', role: 'creator', department: '短视频中心', email: 'gunz@videolab.cn', phone: '188****6620', avatarUrl: avatarUrl(24), status: 'active', lastLoginAt: ago(0, 9, 30) },
  { id: 'u07', name: '沈亦舟', account: 'shenyizhou', role: 'creator', department: '短视频中心', email: 'shenyz@videolab.cn', phone: '150****8815', avatarUrl: avatarUrl(60), status: 'active', lastLoginAt: ago(2, 14, 12) },
  { id: 'u08', name: '江照野', account: 'jiangzhaoye', role: 'analyst', department: '数据研究组', email: 'jiangzy@videolab.cn', phone: '133****4192', avatarUrl: avatarUrl(8), status: 'active', lastLoginAt: ago(1, 11, 26) },
  { id: 'u09', name: '温叙白', account: 'wenxubai', role: 'viewer', department: '品牌市场部', email: 'wenxb@videolab.cn', phone: '156****7731', avatarUrl: avatarUrl(5), status: 'active', lastLoginAt: ago(4, 15, 3) },
  { id: 'u10', name: '白露秋', account: 'bailuqiu', role: 'analyst', department: '内容运营部', email: 'bailq@videolab.cn', phone: '187****2064', avatarUrl: avatarUrl(29), status: 'active', lastLoginAt: ago(0, 8, 55) },
  { id: 'u11', name: '商行舟', account: 'shangxingzhou', role: 'reviewer', department: '内容安全部', email: 'shangxz@videolab.cn', phone: '131****5548', avatarUrl: avatarUrl(41), status: 'disabled', lastLoginAt: ago(23, 10, 18) },
  { id: 'u12', name: '韩青芜', account: 'hanqingwu', role: 'creator', department: '短视频中心', email: 'hanqw@videolab.cn', phone: '176****9927', avatarUrl: avatarUrl(19), status: 'disabled', lastLoginAt: ago(38, 16, 42) },
]

interface RawVideo {
  title: string
  desc: string
  cat: VideoCategory
  dur: number
  res: [number, number]
  fps: number
  br: number
  up: string
  tags: string[]
  st: VideoStatus
  d: number
  src: VideoItem['source']
  loc: string
  cp: string
  play: number
}

const RAW: RawVideo[] = [
  { title: '城市轨道交通 3 号线开通首日纪实', desc: '记者跟随首班列车，记录 3 号线开通首日沿线站点的客流情况、市民反响与运营保障措施。', cat: '新闻资讯', dur: 268, res: [1920, 1080], fps: 25, br: 6200, up: 'u06', tags: ['城市交通', '地铁', '早高峰', '民生', '现场报道'], st: 'completed', d: 3, src: '本地上传', loc: '本市 · 轨道交通 3 号线', cp: '台内原创', play: 12480 },
  { title: '台风"海燕"登陆前的 12 小时：沿海渔村转移实录', desc: '台风登陆前夜，跟随基层干部逐户走访，记录 327 名村民的转移安置全过程。', cat: '新闻资讯', dur: 412, res: [1920, 1080], fps: 25, br: 5800, up: 'u10', tags: ['台风', '防灾减灾', '基层', '人物纪实'], st: 'analyzing', d: 0, src: '本地上传', loc: '沿海 · 东港镇', cp: '台内原创', play: 3620 },
  { title: '非遗传承人：景泰蓝的七十二道工序', desc: '走进景泰蓝工坊，完整记录掐丝、点蓝、烧蓝、磨光、镀金等核心工序，呈现一件作品从铜胎到成器的全过程。', cat: '纪录片', dur: 1420, res: [3840, 2160], fps: 25, br: 12400, up: 'u06', tags: ['非遗', '景泰蓝', '手工艺', '匠人', '传统文化'], st: 'completed', d: 6, src: '本地上传', loc: '北京市 · 东城区', cp: '联合摄制', play: 28640 },
  { title: '河流的记忆——长江源考察手记（第一集）', desc: '科考队从沱沱河出发，记录源头冰川退缩、草场退化与牧民迁徙的一手影像。', cat: '纪录片', dur: 3125, res: [3840, 2160], fps: 25, br: 11200, up: 'u02', tags: ['长江', '生态', '科考', '冰川', '环保'], st: 'completed', d: 12, src: '本地上传', loc: '青海省 · 唐古拉山镇', cp: '联合摄制', play: 15320 },
  { title: '深度学习入门 第 4 讲：注意力机制与 Transformer', desc: '从加权求和讲起，逐步推导自注意力公式，并用一个小型翻译任务演示注意力权重的作用。', cat: '教学课程', dur: 2860, res: [1920, 1080], fps: 30, br: 4200, up: 'u08', tags: ['深度学习', 'Transformer', '注意力机制', '公开课'], st: 'completed', d: 8, src: '链接导入', loc: '录播室 A', cp: '知识共享', play: 41720 },
  { title: '安全生产培训：高处作业防护规范（2026 版）', desc: '结合三起典型事故案例，讲解安全带悬挂、脚手架验收、临边防护的强制要求。', cat: '教学课程', dur: 1640, res: [1920, 1080], fps: 25, br: 3600, up: 'u03', tags: ['安全生产', '高处作业', '培训', '合规'], st: 'pending', d: 1, src: '本地上传', loc: '集团培训中心', cp: '内部资料', play: 0 },
  { title: '对话张一鸣：一家制造企业的十年数字化', desc: '从 2016 年第一台数控机床联网，到 2026 年全厂数字孪生，一位厂长讲述转型中的取舍。', cat: '人物访谈', dur: 1080, res: [1920, 1080], fps: 25, br: 5200, up: 'u02', tags: ['人物访谈', '数字化转型', '制造业', '企业管理'], st: 'completed', d: 15, src: '本地上传', loc: '苏州市 · 工业园区', cp: '台内原创', play: 9840 },
  { title: '2026 春季新品发布会全程回放', desc: '发布会完整记录，含开场影像、产品讲解、价格公布与媒体问答四个环节。', cat: '企业宣传', dur: 3860, res: [1920, 1080], fps: 30, br: 6800, up: 'u07', tags: ['发布会', '新品', '品牌', '全程回放'], st: 'completed', d: 20, src: '直播回放', loc: '国际会展中心', cp: '企业自有', play: 52310 },
  { title: '智慧园区解决方案产品演示片', desc: '以三维动画结合实景拍摄，演示园区安防、能耗、通行三大模块的联动能力。', cat: '企业宣传', dur: 186, res: [1920, 1080], fps: 30, br: 7200, up: 'u07', tags: ['智慧园区', '产品演示', '三维动画', '安防'], st: 'completed', d: 25, src: '本地上传', loc: '—', cp: '企业自有', play: 7410 },
  { title: '骑行川西第 3 天：翻越折多山', desc: '清晨从康定出发，海拔爬升 1800 米，记录高原反应、天气突变与垭口的第一眼雪山。', cat: 'Vlog', dur: 742, res: [1920, 1080], fps: 30, br: 8800, up: 'u12', tags: ['骑行', '川西', '折多山', '旅行', '高原'], st: 'analyzing', d: 0, src: '本地上传', loc: '四川省 · 康定市', cp: '个人原创', play: 2180 },
  { title: '微电影《归途》正片', desc: '一个在外打工十年的男人，在母亲病重后回到山村，重新面对被自己搁置的家庭。', cat: '影视片段', dur: 1568, res: [3840, 2160], fps: 24, br: 9800, up: 'u06', tags: ['微电影', '剧情', '家庭', '方言'], st: 'completed', d: 30, src: '本地上传', loc: '贵州省 · 黔东南', cp: '已授权', play: 17650 },
  { title: '2026 城市马拉松全程直播回放', desc: '全程 42.195 公里直播信号回放，含起终点、五个补给点与冠军冲刺段。', cat: '体育赛事', dur: 9840, res: [1920, 1080], fps: 50, br: 7600, up: 'u03', tags: ['马拉松', '赛事直播', '城市形象', '体育'], st: 'failed', d: 9, src: '直播回放', loc: '本市 · 滨江赛道', cp: '赛事授权', play: 8940 },
  { title: '园区东门 09:00-10:00 监控片段', desc: '东门主入口固定机位录像，用于车辆进出统计与异常事件回溯。', cat: '监控录像', dur: 3600, res: [1280, 720], fps: 25, br: 2400, up: 'u01', tags: ['监控', '园区', '出入口', '安防'], st: 'completed', d: 2, src: '接口同步', loc: '园区 · 东门', cp: '内部资料', play: 312 },
  { title: '双十一预热直播 场次 2 回放', desc: '竖屏直播回放，含 12 个商品讲解段落与三轮抽奖互动。', cat: '直播回放', dur: 5400, res: [1080, 1920], fps: 30, br: 4800, up: 'u07', tags: ['直播', '电商', '竖屏', '促销'], st: 'pending', d: 1, src: '直播回放', loc: '直播间 2 号', cp: '企业自有', play: 0 },
  { title: '校园防欺凌主题教育课（初中版）', desc: '通过情景剧与案例讨论，讲解欺凌的识别、求助渠道与旁观者干预。', cat: '教学课程', dur: 2240, res: [1920, 1080], fps: 25, br: 3900, up: 'u10', tags: ['教育', '防欺凌', '初中', '主题班会'], st: 'completed', d: 18, src: '本地上传', loc: '市第三中学', cp: '教育公开', play: 22340 },
  { title: '老街早餐铺：三十年只做一碗面', desc: '清晨四点半开门，一碗牛肉面卖了三十年。记录店主夫妇与常客的日常。', cat: '纪录片', dur: 986, res: [1920, 1080], fps: 25, br: 6400, up: 'u06', tags: ['美食', '老街', '小店', '城市记忆'], st: 'completed', d: 22, src: '本地上传', loc: '本市 · 解放路', cp: '台内原创', play: 31280 },
  { title: '早间新闻 2026-10-16 完整版', desc: '当日早间新闻完整版，含时政、民生、财经、体育四个板块。', cat: '新闻资讯', dur: 1800, res: [1920, 1080], fps: 25, br: 5400, up: 'u10', tags: ['新闻', '早间', '时政', '民生'], st: 'pending', d: 3, src: '接口同步', loc: '演播厅 1', cp: '台内原创', play: 0 },
  { title: '新能源汽车电池回收产业链调查', desc: '记者暗访三个省份的回收网点，追踪退役电池流向，揭示小作坊拆解的环保风险。', cat: '新闻资讯', dur: 926, res: [1920, 1080], fps: 25, br: 6100, up: 'u02', tags: ['调查报道', '新能源', '电池回收', '环保'], st: 'completed', d: 27, src: '本地上传', loc: '多省 · 联合采访', cp: '台内原创', play: 14260 },
  { title: '手艺人：龙泉宝剑的锻打与淬火', desc: '记录一把宝剑从选料、折叠锻打到淬火开刃的完整流程，附匠人口述史。', cat: '纪录片', dur: 1680, res: [3840, 2160], fps: 25, br: 10800, up: 'u06', tags: ['龙泉宝剑', '锻造', '非遗', '匠人'], st: 'completed', d: 35, src: '本地上传', loc: '浙江省 · 龙泉市', cp: '联合摄制', play: 19870 },
  { title: '城市夜跑地图：沿着苏州河十公里', desc: '夜间实测一条沿河跑步路线，标注路灯、补给点与三个最佳拍摄机位。', cat: 'Vlog', dur: 658, res: [1920, 1080], fps: 30, br: 8200, up: 'u12', tags: ['夜跑', '苏州河', '城市路线', '运动'], st: 'failed', d: 5, src: '本地上传', loc: '上海市 · 苏州河', cp: '个人原创', play: 1420 },
  { title: '产品经理入门 第 2 讲：需求调研方法', desc: '讲解用户访谈、问卷设计、竞品拆解三种调研方法，并给出可直接复用的访谈提纲。', cat: '教学课程', dur: 1980, res: [1920, 1080], fps: 30, br: 3800, up: 'u08', tags: ['产品经理', '需求调研', '用户访谈', '课程'], st: 'completed', d: 14, src: '链接导入', loc: '录播室 B', cp: '知识共享', play: 28940 },
  { title: '对话非遗保护中心主任：传承的困境', desc: '围绕学徒断层、市场化难题与数字化保护，讨论非遗传承的现实路径。', cat: '人物访谈', dur: 1320, res: [1920, 1080], fps: 25, br: 5000, up: 'u02', tags: ['非遗', '访谈', '文化政策', '传承'], st: 'completed', d: 40, src: '本地上传', loc: '文化馆 · 会客厅', cp: '台内原创', play: 7640 },
  { title: '智慧工厂数字孪生系统宣传片', desc: '两分钟展示产线实时映射、设备预测性维护与能耗优化的整体方案。', cat: '企业宣传', dur: 214, res: [1920, 1080], fps: 30, br: 8600, up: 'u07', tags: ['数字孪生', '智慧工厂', '工业互联网'], st: 'completed', d: 16, src: '本地上传', loc: '—', cp: '企业自有', play: 9120 },
  { title: '川藏线自驾第 5 天：然乌湖到波密', desc: '沿 318 国道东行，途经然乌湖、米堆冰川，记录海拔下降后的植被变化。', cat: 'Vlog', dur: 812, res: [1920, 1080], fps: 30, br: 9000, up: 'u12', tags: ['自驾', '318 国道', '然乌湖', '旅行'], st: 'analyzing', d: 0, src: '本地上传', loc: '西藏 · 八宿县', cp: '个人原创', play: 960 },
  { title: '微电影《第十三次列车》', desc: '一名站台值班员在末班车后遇见多年未见的旧友，两人在空站台聊了一夜。', cat: '影视片段', dur: 1240, res: [1920, 1080], fps: 24, br: 7400, up: 'u06', tags: ['微电影', '剧情', '站台', '夜景'], st: 'completed', d: 44, src: '本地上传', loc: '本市 · 老火车站', cp: '已授权', play: 12080 },
  { title: '2026 赛季城市篮球联赛 决赛', desc: '决赛全场录像，含四节比赛、加时赛与颁奖仪式。', cat: '体育赛事', dur: 7200, res: [1920, 1080], fps: 50, br: 7000, up: 'u03', tags: ['篮球', '联赛', '决赛', '全场录像'], st: 'pending', d: 2, src: '直播回放', loc: '市体育馆', cp: '赛事授权', play: 0 },
  { title: '地下车库 B2 层 夜间监控', desc: 'B2 层西侧通道固定机位夜间录像，用于车辆剐蹭事件核查。', cat: '监控录像', dur: 3600, res: [1280, 720], fps: 25, br: 2200, up: 'u01', tags: ['监控', '车库', '夜间', '安防'], st: 'completed', d: 7, src: '接口同步', loc: '园区 · B2 车库', cp: '内部资料', play: 186 },
  { title: '秋季新品服饰直播专场回放', desc: '竖屏直播回放，含 18 套穿搭演示与面料细节特写。', cat: '直播回放', dur: 4680, res: [1080, 1920], fps: 30, br: 4400, up: 'u07', tags: ['直播', '服饰', '穿搭', '秋季新品'], st: 'completed', d: 11, src: '直播回放', loc: '直播间 1 号', cp: '企业自有', play: 26450 },
  { title: '消防应急演练教学片', desc: '完整演示火情报警、初期扑救、疏散引导与清点上报四个环节的标准动作。', cat: '教学课程', dur: 1140, res: [1920, 1080], fps: 25, br: 3400, up: 'u03', tags: ['消防', '应急演练', '安全培训'], st: 'completed', d: 21, src: '本地上传', loc: '集团总部', cp: '内部资料', play: 4820 },
  { title: '城市更新：老厂房改造成文创园', desc: '跟踪一个老纺织厂两年的改造过程，从结构加固到业态引入，讨论城市更新的成本与代价。', cat: '纪录片', dur: 2140, res: [3840, 2160], fps: 25, br: 10200, up: 'u06', tags: ['城市更新', '老厂房', '文创园', '建筑'], st: 'completed', d: 52, src: '本地上传', loc: '本市 · 纺织厂旧址', cp: '联合摄制', play: 11340 },
  { title: '2026 年三季度经济数据发布会', desc: '发布会全程，含统计数据发布、记者提问与专家解读三个部分。', cat: '新闻资讯', dur: 3240, res: [1920, 1080], fps: 25, br: 5200, up: 'u10', tags: ['经济数据', '发布会', '宏观', '记者提问'], st: 'completed', d: 13, src: '直播回放', loc: '新闻发布厅', cp: '台内原创', play: 6720 },
  { title: '咖啡师的一天：从烘焙到出杯', desc: '跟随一位咖啡师从清晨烘焙开始，记录选豆、杯测、调试与开门营业的全过程。', cat: 'Vlog', dur: 726, res: [1920, 1080], fps: 30, br: 8400, up: 'u12', tags: ['咖啡', '烘焙', '手冲', '职业记录'], st: 'analyzing', d: 0, src: '本地上传', loc: '本市 · 文创园', cp: '个人原创', play: 1240 },
  { title: '企业年会精彩集锦', desc: '三分钟年会集锦，含领导致辞、颁奖、节目表演与全场大合唱。', cat: '企业宣传', dur: 168, res: [1920, 1080], fps: 30, br: 7600, up: 'u07', tags: ['年会', '集锦', '企业文化'], st: 'completed', d: 60, src: '本地上传', loc: '宴会厅', cp: '企业自有', play: 5340 },
  { title: '访谈：一位乡村教师的二十年', desc: '在一间只有九个学生的村小，一位教师讲述留下与离开之间的反复权衡。', cat: '人物访谈', dur: 1460, res: [1920, 1080], fps: 25, br: 4800, up: 'u02', tags: ['乡村教育', '教师', '访谈', '人物'], st: 'completed', d: 66, src: '本地上传', loc: '云南省 · 山区村小', cp: '台内原创', play: 18620 },
  { title: '电视剧《长街》第 8 集片段', desc: '第 8 集完整片段，含街市冲突与主角对峙两场重头戏。', cat: '影视片段', dur: 2680, res: [3840, 2160], fps: 25, br: 9600, up: 'u06', tags: ['电视剧', '剧情', '长街', '版权内容'], st: 'completed', d: 71, src: '本地上传', loc: '影视基地', cp: '已授权', play: 34120 },
  { title: '智慧交通指挥中心大屏演示', desc: '两分半演示交通流量监测、信号配时优化与突发事件处置的联动流程。', cat: '企业宣传', dur: 246, res: [1920, 1080], fps: 30, br: 8000, up: 'u07', tags: ['智慧交通', '指挥中心', '数据大屏'], st: 'completed', d: 78, src: '本地上传', loc: '—', cp: '企业自有', play: 6280 },
]

export const videos: VideoItem[] = RAW.map((r, i) => {
  const id = `vid_${String(i + 1).padStart(3, '0')}`
  const uploader = users.find((u) => u.id === r.up) ?? users[0]
  const uploadedAt = ago(r.d, 8 + ((i * 3) % 10), (i * 7) % 60)
  const progress = r.st === 'completed' ? 100 : r.st === 'analyzing' ? 24 + ((i * 13) % 61) : r.st === 'failed' ? 18 + ((i * 5) % 40) : 0
  const cost = r.st === 'completed' ? Math.round(r.dur / 22 + (i % 9) * 3) : undefined
  return {
    id,
    title: r.title,
    description: r.desc,
    coverUrl: coverUrl(id),
    duration: r.dur,
    width: r.res[0],
    height: r.res[1],
    fps: r.fps,
    bitrate: r.br,
    fileSize: Math.round((r.br * 1000 * r.dur) / 8),
    format: r.res[1] > 2000 ? 'mov' : 'mp4',
    source: r.src,
    category: r.cat,
    tags: r.tags,
    location: r.loc,
    copyright: r.cp,
    uploaderId: uploader.id,
    uploaderName: uploader.name,
    spaceId: i % 3 === 0 ? 'sp_news' : i % 3 === 1 ? 'sp_brand' : 'sp_edu',
    uploadedAt,
    status: r.st,
    progress,
    analyzedAt: r.st === 'completed' ? new Date(new Date(uploadedAt).getTime() + (cost ?? 120) * 1000).toISOString() : undefined,
    analysisCost: cost,
    playCount: r.play,
  }
})

export const GOLDEN_ID = 'vid_003'

export const pipelineTemplates = [
  { name: '视频接入', duration: 1.2, detail: '接收源文件 3.82 GB，校验 MD5 通过' },
  { name: '抽帧采样', duration: 8.4, detail: '按 1 fps 抽取 1420 帧，关键帧 128 张' },
  { name: '语音转写', duration: 38.6, detail: 'ASR v3.2 中文，识别 412 句，置信度均值 0.94' },
  { name: '文字识别', duration: 12.9, detail: 'OCR 检测到 26 处字幕与 8 处画面文字' },
  { name: '视觉理解', duration: 96.2, detail: '场景切分 41 段，检测物体 1,284 个' },
  { name: '语义索引', duration: 14.8, detail: '生成 96 维语义向量，写入检索索引' },
]

export const tasks: AnalysisTask[] = videos.slice(0, 18).map((v, i) => {
  const stages = pipelineTemplates.map((p, idx) => ({
    name: p.name,
    duration: p.duration,
    detail: p.detail,
    status: (v.status === 'completed' ? 'done' : i < 3 ? (idx < 4 ? 'done' : idx === 4 ? 'running' : 'waiting') : idx < 2 ? 'done' : 'waiting') as 'done' | 'running' | 'waiting',
  }))
  return {
    id: `task_${String(i + 1).padStart(3, '0')}`,
    videoId: v.id,
    videoTitle: v.title,
    status: v.status,
    progress: v.progress,
    startedAt: v.uploadedAt,
    cost: v.analysisCost ?? 0,
    stages,
    model: 'Insight-MM 2.1',
  }
})

const reviewSeeds: Array<{
  vid: string
  start: number
  end: number
  cat: ReviewItem['category']
  level: ReviewItem['level']
  conf: number
  desc: string
  status: ReviewItem['status']
  reviewer?: string
  remark?: string
}> = [
  { vid: 'vid_008', start: 1284, end: 1292, cat: '广告导流', level: '中', conf: 0.82, desc: '画面右下角出现第三方平台二维码，持续 8 秒，疑似引流。', status: 'pending' },
  { vid: 'vid_008', start: 2140, end: 2151, cat: '版权风险', level: '高', conf: 0.91, desc: '背景音乐与已登记曲目《晨光序曲》声纹匹配度 91%，未见授权记录。', status: 'pending' },
  { vid: 'vid_011', start: 386, end: 402, cat: '涉暴', level: '高', conf: 0.88, desc: '第 06:26 处出现肢体冲突画面，含推搡与挥拳动作，持续 16 秒。', status: 'rejected', reviewer: '周慕白', remark: '确认存在暴力画面，需重新剪辑后送审。' },
  { vid: 'vid_011', start: 902, end: 910, cat: '隐私泄露', level: '中', conf: 0.76, desc: '画面中出现未打码的车牌号「苏 E·7K2**」，可辨识完整号码。', status: 'pending' },
  { vid: 'vid_013', start: 1820, end: 1834, cat: '隐私泄露', level: '低', conf: 0.64, desc: '监控画面中行人面部清晰可辨，未做模糊处理。', status: 'passed', reviewer: '何清野', remark: '内部安防用途，已在系统内标注权限，判定不构成外泄风险。' },
  { vid: 'vid_028', start: 412, end: 430, cat: '广告导流', level: '中', conf: 0.79, desc: '主播口播中出现"加微信领券"引导，含联系方式暗示。', status: 'pending' },
  { vid: 'vid_028', start: 1560, end: 1572, cat: '违禁品', level: '低', conf: 0.61, desc: '道具刀具被识别为管制刀具，人工复核为塑料道具。', status: 'passed', reviewer: '周慕白', remark: '误报，已加入白名单样本。' },
  { vid: 'vid_014', start: 2680, end: 2694, cat: '涉黄', level: '高', conf: 0.87, desc: '服装展示过程中出现大面积暴露画面，持续 14 秒。', status: 'pending' },
  { vid: 'vid_031', start: 620, end: 632, cat: '涉政', level: '高', conf: 0.93, desc: '背景展板出现不当表述，与规范用语不一致。', status: 'rejected', reviewer: '商行舟', remark: '已通知制作方替换画面。' },
  { vid: 'vid_035', start: 1104, end: 1120, cat: '涉暴', level: '中', conf: 0.74, desc: '街市冲突戏份含持械动作，未见血腥画面。', status: 'passed', reviewer: '何清野', remark: '剧情需要，已取得内容备案。' },
  { vid: 'vid_002', start: 96, end: 108, cat: '隐私泄露', level: '中', conf: 0.71, desc: '转移名单特写中出现村民完整姓名与身份证号后四位。', status: 'pending' },
  { vid: 'vid_004', start: 1840, end: 1852, cat: '版权风险', level: '低', conf: 0.58, desc: '引用第三方航拍素材约 12 秒，片尾字幕未标注来源。', status: 'doubt', reviewer: '周慕白', remark: '待制片确认授权文件。' },
  { vid: 'vid_019', start: 340, end: 348, cat: '违禁品', level: '低', conf: 0.62, desc: '锻造过程中出现的开刃刀具，属工艺展示范畴。', status: 'passed', reviewer: '何清野', remark: '误报，工艺记录片豁免。' },
  { vid: 'vid_022', start: 780, end: 792, cat: '涉政', level: '低', conf: 0.55, desc: '访谈中提及历史事件，语境为学术讨论。', status: 'passed', reviewer: '商行舟', remark: '语境合规，保留。' },
  { vid: 'vid_025', start: 640, end: 656, cat: '涉暴', level: '中', conf: 0.77, desc: '站台争执戏含推搡动作，无受伤特写。', status: 'pending' },
  { vid: 'vid_012', start: 4200, end: 4218, cat: '广告导流', level: '中', conf: 0.81, desc: '选手号码布上出现未报备的品牌标识，持续 18 秒。', status: 'pending' },
  { vid: 'vid_030', start: 1260, end: 1274, cat: '隐私泄露', level: '低', conf: 0.66, desc: '老照片中出现可识别的门牌号与住户姓名。', status: 'pending' },
  { vid: 'vid_018', start: 214, end: 226, cat: '版权风险', level: '中', conf: 0.72, desc: '暗访画面中播放的背景电视节目音轨疑似未授权。', status: 'pending' },
  { vid: 'vid_036', start: 88, end: 96, cat: '广告导流', level: '低', conf: 0.59, desc: '演示界面角落出现合作方 Logo，未见合同标注。', status: 'passed', reviewer: '何清野', remark: '合作方已授权露出。' },
  { vid: 'vid_015', start: 980, end: 994, cat: '涉暴', level: '中', conf: 0.73, desc: '情景剧演示欺凌行为，含推搡与言语侮辱字幕。', status: 'pending' },
  { vid: 'vid_021', start: 1520, end: 1532, cat: '广告导流', level: '低', conf: 0.57, desc: '课件页面中出现培训机构二维码。', status: 'pending' },
  { vid: 'vid_027', start: 2400, end: 2412, cat: '隐私泄露', level: '中', conf: 0.78, desc: '夜间监控中人物面部与车辆牌照均清晰可辨。', status: 'pending' },
  { vid: 'vid_033', start: 62, end: 74, cat: '版权风险', level: '中', conf: 0.84, desc: '年会节目使用的伴奏音乐未取得公开传播授权。', status: 'rejected', reviewer: '周慕白', remark: '需替换为已授权曲目。' },
  { vid: 'vid_034', start: 1120, end: 1136, cat: '隐私泄露', level: '低', conf: 0.63, desc: '学生姓名出现在教室后墙公示栏，画面可辨认。', status: 'pending' },
  { vid: 'vid_024', start: 320, end: 332, cat: '违禁品', level: '低', conf: 0.56, desc: '路边摊售卖的刀具被识别为管制器具。', status: 'passed', reviewer: '何清野', remark: '误报，为厨房用刀。' },
  { vid: 'vid_016', start: 420, end: 434, cat: '广告导流', level: '低', conf: 0.6, desc: '店主围裙上印有外卖平台推广码。', status: 'pending' },
  { vid: 'vid_020', start: 180, end: 190, cat: '版权风险', level: '中', conf: 0.75, desc: '跑步路线背景音乐为热门商业曲目，未见授权。', status: 'pending' },
  { vid: 'vid_029', start: 640, end: 652, cat: '涉暴', level: '低', conf: 0.52, desc: '演练中使用烟雾发生器，被识别为烟雾场景。', status: 'passed', reviewer: '何清野', remark: '误报。' },
  { vid: 'vid_007', start: 860, end: 872, cat: '广告导流', level: '低', conf: 0.58, desc: '访谈背景中出现企业产品陈列，无口播引导。', status: 'passed', reviewer: '周慕白', remark: '常规背景，不构成导流。' },
  { vid: 'vid_010', start: 210, end: 224, cat: '违禁品', level: '低', conf: 0.54, desc: '骑行装备中的多功能刀具被识别为管制刀具。', status: 'passed', reviewer: '何清野', remark: '误报。' },
]

export const reviews: ReviewItem[] = reviewSeeds.map((r, i) => {
  const v = videos.find((x) => x.id === r.vid)!
  return {
    id: `rv_${String(i + 1).padStart(3, '0')}`,
    videoId: v.id,
    videoTitle: v.title,
    coverUrl: v.coverUrl,
    start: r.start,
    end: r.end,
    category: r.cat,
    level: r.level,
    confidence: r.conf,
    description: r.desc,
    thumbnailUrl: coverUrl(`${v.id}_${r.start}`, 320, 180),
    status: r.status,
    reviewer: r.reviewer,
    reviewedAt: r.status !== 'pending' ? ago(1, 15, 20) : undefined,
    remark: r.remark,
  }
})

export const models: ModelItem[] = [
  { id: 'm01', name: 'Whisper-Pro ASR', type: 'ASR', version: 'v3.2.1', provider: '自研 · 语音组', accuracy: 0.962, latency: 320, calls: 12840, status: 'online', updatedAt: ago(9), description: '中文普通话与方言混合识别，支持说话人分离与时间戳对齐，适用于访谈、课程、新闻等长音频场景。', scenes: ['长音频转写', '说话人分离', '字幕生成'], trend: [82, 85, 88, 90, 92, 94, 96] },
  { id: 'm02', name: 'OCR-Plus 文档识别', type: 'OCR', version: 'v2.8.0', provider: '自研 · 视觉组', accuracy: 0.947, latency: 180, calls: 8620, status: 'online', updatedAt: ago(14), description: '画面文字检测与识别，支持竖排、艺术字、低对比度字幕，输出字符级位置信息。', scenes: ['字幕提取', '画面文字', '证件识别'], trend: [88, 89, 91, 92, 93, 94, 95] },
  { id: 'm03', name: 'Insight-VL 视觉理解', type: '视觉理解', version: 'v2.1.4', provider: '自研 · 多模态组', accuracy: 0.918, latency: 640, calls: 24160, status: 'online', updatedAt: ago(4), description: '视频帧级语义理解，输出场景描述、物体框、动作类别与画面质量评分。', scenes: ['场景描述', '物体检测', '动作识别'], trend: [79, 82, 85, 87, 89, 91, 92] },
  { id: 'm04', name: 'SceneSplit 场景切分', type: '场景识别', version: 'v1.9.2', provider: '自研 · 视觉组', accuracy: 0.931, latency: 96, calls: 18420, status: 'online', updatedAt: ago(21), description: '基于镜头边界检测与语义相似度，自动切分场景并判定景别与运镜方式。', scenes: ['镜头切分', '景别判定', '运镜分析'], trend: [86, 88, 89, 90, 91, 92, 93] },
  { id: 'm05', name: 'FaceTrack 人脸识别', type: '人脸识别', version: 'v4.0.3', provider: '自研 · 视觉组', accuracy: 0.897, latency: 72, calls: 31280, status: 'updating', updatedAt: ago(0), description: '视频内人脸检测、聚类与身份关联，支持跨镜头人物轨迹追踪。', scenes: ['人物识别', '轨迹追踪', '出场统计'], trend: [80, 83, 84, 86, 88, 89, 90] },
  { id: 'm06', name: 'EmotionVoice 语音情感', type: '语音情感', version: 'v1.4.0', provider: '自研 · 语音组', accuracy: 0.842, latency: 124, calls: 6420, status: 'online', updatedAt: ago(30), description: '从韵律与频谱特征识别说话人情绪强度，输出 0-1 的激动度曲线。', scenes: ['情绪曲线', '高潮定位', '语气分析'], trend: [74, 76, 78, 80, 81, 83, 84] },
  { id: 'm07', name: 'GuardNet 内容审核', type: '内容审核', version: 'v5.1.0', provider: '自研 · 安全组', accuracy: 0.913, latency: 210, calls: 42860, status: 'online', updatedAt: ago(2), description: '覆盖涉黄、涉暴、涉政、违禁品、广告导流、版权与隐私七类风险，输出片段级命中结果。', scenes: ['内容风控', '违规片段定位', '人工复核辅助'], trend: [85, 86, 88, 89, 90, 91, 91] },
  { id: 'm08', name: 'Insight-MM 多模态大模型', type: '多模态大模型', version: 'v2.1.0', provider: '自研 · 基础模型组', accuracy: 0.936, latency: 1180, calls: 9860, status: 'online', updatedAt: ago(6), description: '融合视觉、语音与文本的统一理解模型，负责摘要生成、事件抽取与视频问答。', scenes: ['视频摘要', '事件抽取', '内容问答'], trend: [78, 82, 85, 88, 90, 92, 94] },
  { id: 'm09', name: 'VectorSearch 语义检索', type: '语义检索', version: 'v3.0.1', provider: '自研 · 检索组', accuracy: 0.905, latency: 48, calls: 27640, status: 'offline', updatedAt: ago(48), description: '多模态向量索引与混合检索，支持自然语言、以图搜视频与跨模态对齐。', scenes: ['语义检索', '以图搜视频', '结果排序'], trend: [84, 85, 86, 88, 89, 90, 90] },
]

export const auditLogs: AuditLog[] = Array.from({ length: 60 }, (_, i): AuditLog => {
  const u = users[i % users.length]
  const actions = [
    ['登录系统', '—'],
    ['上传视频', '城市轨道交通 3 号线开通首日纪实'],
    ['提交解析任务', '非遗传承人：景泰蓝的七十二道工序'],
    ['审核处置', 'rv_003 涉暴片段'],
    ['新建用户', '韩青芜'],
    ['更新模型配置', 'Insight-VL 视觉理解'],
    ['导出报告', '2026 年 9 月内容分析报告'],
    ['删除视频', '临时素材_1024.mp4'],
    ['创建 API 密钥', '生产环境只读密钥'],
    ['修改审核规则', '广告导流阈值 0.75 → 0.80'],
  ]
  const a = actions[i % actions.length]
  return {
    id: `log_${String(i + 1).padStart(3, '0')}`,
    time: ago(i % 30, 9 + ((i * 5) % 10), (i * 11) % 60),
    user: u.name,
    action: a[0],
    target: a[1],
    ip: `10.24.${(i * 7) % 200}.${(i * 13) % 250}`,
    result: i % 17 === 0 ? '失败' : '成功',
  }
}).sort((a, b) => +new Date(b.time) - +new Date(a.time))

export const notifications: Notification[] = [
  { id: 'n01', type: '任务', title: '解析任务已完成', content: '《非遗传承人：景泰蓝的七十二道工序》解析完成，共识别 41 个场景、412 句转写。', read: false, time: ago(0, 9, 12) },
  { id: 'n02', type: '审核', title: '新增高风险违规', content: '《双十一预热直播 场次 2 回放》检测到 1 处高风险涉黄片段，请尽快处置。', read: false, time: ago(0, 8, 40) },
  { id: 'n03', type: '系统', title: '模型更新完成', content: 'FaceTrack 人脸识别已升级至 v4.0.4，识别精度提升 1.2%。', read: false, time: ago(0, 8, 5) },
  { id: 'n04', type: '任务', title: '解析任务失败', content: '《2026 城市马拉松全程直播回放》解析失败：源文件时长超限，请分段后重试。', read: true, time: ago(1, 16, 22) },
  { id: 'n05', type: '审核', title: '审核队列待处理', content: '当前有 12 条待审记录，其中 5 条为高风险。', read: true, time: ago(1, 9, 0) },
  { id: 'n06', type: '系统', title: '存储配额预警', content: '品牌空间存储使用率已达 82%，建议清理或扩容。', read: true, time: ago(2, 11, 30) },
  { id: 'n07', type: '任务', title: '批量上传完成', content: '3 个视频已加入解析队列，预计 12 分钟内完成。', read: true, time: ago(3, 14, 10) },
  { id: 'n08', type: '系统', title: '账号安全提醒', content: '检测到新设备登录，IP 10.24.8.117，如非本人操作请及时修改密码。', read: true, time: ago(4, 10, 45) },
  { id: 'n09', type: '审核', title: '复审申请', content: '周慕白提交了 rv_012 的复审申请，等待你确认。', read: true, time: ago(5, 15, 20) },
  { id: 'n10', type: '任务', title: '导出完成', content: '《企业年会精彩集锦》已导出为 1080p MP4，可前往创作列表下载。', read: true, time: ago(6, 17, 5) },
  { id: 'n11', type: '系统', title: '版本发布说明', content: '平台 v2.4 已发布：新增以图搜视频、优化时间轴缩放体验。', read: true, time: ago(8, 9, 30) },
  { id: 'n12', type: '审核', title: '误报样本入库', content: '本节共标记 14 条误报，已加入 GuardNet 训练样本池。', read: true, time: ago(9, 13, 15) },
  { id: 'n13', type: '任务', title: '解析任务已完成', content: '《老街早餐铺：三十年只做一碗面》解析完成。', read: true, time: ago(12, 10, 0) },
  { id: 'n14', type: '系统', title: 'API 密钥即将过期', content: '密钥「生产环境只读密钥」将于 7 天后过期。', read: true, time: ago(14, 8, 20) },
  { id: 'n15', type: '审核', title: '审核规则已更新', content: '广告导流阈值由 0.75 调整至 0.80，即刻生效。', read: true, time: ago(16, 16, 40) },
]

export const projects: ProjectItem[] = [
  { id: 'prj_001', name: '景泰蓝工艺 · 60 秒竖版', videoId: 'vid_003', coverUrl: coverUrl('vid_003'), duration: 62, clipCount: 5, status: '已完成', updatedAt: ago(1, 15, 20) },
  { id: 'prj_002', name: '3 号线开通 · 新闻速览', videoId: 'vid_001', coverUrl: coverUrl('vid_001'), duration: 45, clipCount: 4, status: '导出中', updatedAt: ago(0, 9, 0) },
  { id: 'prj_003', name: '新品发布会 · 高光集锦', videoId: 'vid_008', coverUrl: coverUrl('vid_008'), duration: 90, clipCount: 8, status: '草稿', updatedAt: ago(3, 11, 40) },
  { id: 'prj_004', name: '早餐铺 · 人物短片', videoId: 'vid_016', coverUrl: coverUrl('vid_016'), duration: 58, clipCount: 6, status: '草稿', updatedAt: ago(5, 16, 10) },
  { id: 'prj_005', name: '马拉松 · 赛事 30 秒', videoId: 'vid_012', coverUrl: coverUrl('vid_012'), duration: 30, clipCount: 3, status: '已完成', updatedAt: ago(8, 14, 0) },
]

export const spaces = [
  { id: 'sp_news', name: '新闻中心', desc: '时政、民生、调查报道类视频资产', memberCount: 6, videoCount: 12, quota: 320, used: 186 },
  { id: 'sp_brand', name: '品牌空间', desc: '企业宣传片、发布会与产品演示素材', memberCount: 4, videoCount: 11, quota: 240, used: 197 },
  { id: 'sp_edu', name: '教育培训', desc: '课程录像、培训教材与公开课资源', memberCount: 5, videoCount: 13, quota: 280, used: 122 },
]

export const apiKeys = [
  { id: 'key_01', name: '生产环境只读密钥', key: 'sk-live-7f2a9c4e8b1d6a3f5c0e2b8d1a4f7c9e', scope: '视频读取、检索', createdAt: ago(42), lastUsed: ago(0, 8, 12), status: 'active' },
  { id: 'key_02', name: '解析服务调用密钥', key: 'sk-live-3d8e1b5c9a2f7e4d6c0b8a1f3e5d7c2b', scope: '解析任务提交、结果读取', createdAt: ago(28), lastUsed: ago(1, 14, 30), status: 'active' },
  { id: 'key_03', name: '测试环境密钥', key: 'sk-test-9a1c4e7b2d5f8a3c6e0b9d4f1a7c2e5b', scope: '全部只读', createdAt: ago(76), lastUsed: ago(19, 10, 5), status: 'disabled' },
]

export const rolePermissions: Record<string, Record<string, boolean>> = {
  admin: { 查看: true, 新建: true, 编辑: true, 删除: true, 导出: true },
  analyst: { 查看: true, 新建: true, 编辑: true, 删除: false, 导出: true },
  reviewer: { 查看: true, 新建: false, 编辑: true, 删除: false, 导出: false },
  creator: { 查看: true, 新建: true, 编辑: true, 删除: false, 导出: true },
  viewer: { 查看: true, 新建: false, 编辑: false, 删除: false, 导出: false },
}

export const PERMISSION_MODULES = ['工作台', '视频资产库', '智能解析', '智能检索', '智能剪辑', '内容审核', '数据分析', '模型管理', '系统设置']
