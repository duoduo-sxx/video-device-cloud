/**
 * 业务数据字典
 * 所有生成的数据必须从这里的字典取值，保证数据真实、可读
 */

export interface RegionDict {
  province: string
  city: string
  abbr: string
  lng: number
  lat: number
  districts: string[]
}

export const REGIONS: RegionDict[] = [
  { province: '浙江省', city: '杭州市', abbr: '杭', lng: 120.155, lat: 30.274, districts: ['西湖区', '滨江区', '余杭区', '萧山区', '拱墅区'] },
  { province: '广东省', city: '深圳市', abbr: '深', lng: 114.058, lat: 22.543, districts: ['南山区', '福田区', '宝安区', '龙岗区', '龙华区'] },
  { province: '广东省', city: '广州市', abbr: '穗', lng: 113.264, lat: 23.129, districts: ['天河区', '越秀区', '番禺区', '白云区'] },
  { province: '广东省', city: '东莞市', abbr: '莞', lng: 113.752, lat: 23.021, districts: ['南城街道', '松山湖', '长安镇', '虎门镇'] },
  { province: '江苏省', city: '南京市', abbr: '宁', lng: 118.796, lat: 32.06, districts: ['鼓楼区', '建邺区', '江宁区', '玄武区'] },
  { province: '江苏省', city: '苏州市', abbr: '苏', lng: 120.619, lat: 31.299, districts: ['工业园区', '吴中区', '姑苏区', '相城区'] },
  { province: '江苏省', city: '无锡市', abbr: '锡', lng: 120.311, lat: 31.491, districts: ['梁溪区', '新吴区', '滨湖区'] },
  { province: '四川省', city: '成都市', abbr: '蓉', lng: 104.066, lat: 30.572, districts: ['高新区', '武侯区', '锦江区', '双流区'] },
  { province: '湖北省', city: '武汉市', abbr: '汉', lng: 114.305, lat: 30.593, districts: ['洪山区', '江汉区', '东湖高新区', '武昌区'] },
  { province: '陕西省', city: '西安市', abbr: '安', lng: 108.948, lat: 34.263, districts: ['雁塔区', '高新区', '未央区', '碑林区'] },
  { province: '河南省', city: '郑州市', abbr: '郑', lng: 113.625, lat: 34.746, districts: ['金水区', '郑东新区', '高新区', '中原区'] },
  { province: '山东省', city: '济南市', abbr: '济', lng: 117.0, lat: 36.665, districts: ['历下区', '高新区', '天桥区'] },
  { province: '山东省', city: '青岛市', abbr: '青', lng: 120.383, lat: 36.067, districts: ['市南区', '崂山区', '黄岛区'] },
  { province: '湖南省', city: '长沙市', abbr: '湘', lng: 112.939, lat: 28.228, districts: ['岳麓区', '芙蓉区', '雨花区'] },
  { province: '重庆市', city: '重庆市', abbr: '渝', lng: 106.551, lat: 29.563, districts: ['渝北区', '江北区', '南岸区', '九龙坡区'] },
  { province: '天津市', city: '天津市', abbr: '津', lng: 117.19, lat: 39.125, districts: ['滨海新区', '南开区', '河西区'] },
  { province: '福建省', city: '福州市', abbr: '榕', lng: 119.296, lat: 26.074, districts: ['鼓楼区', '仓山区', '晋安区'] },
  { province: '福建省', city: '厦门市', abbr: '厦', lng: 118.089, lat: 24.479, districts: ['思明区', '湖里区', '集美区'] },
  { province: '安徽省', city: '合肥市', abbr: '庐', lng: 117.227, lat: 31.821, districts: ['蜀山区', '包河区', '高新区'] },
  { province: '云南省', city: '昆明市', abbr: '昆', lng: 102.833, lat: 24.88, districts: ['五华区', '盘龙区', '官渡区'] },
  { province: '贵州省', city: '贵阳市', abbr: '筑', lng: 106.63, lat: 26.647, districts: ['观山湖区', '南明区', '云岩区'] },
  { province: '辽宁省', city: '沈阳市', abbr: '沈', lng: 123.429, lat: 41.796, districts: ['和平区', '浑南区', '铁西区'] },
  { province: '河北省', city: '石家庄市', abbr: '石', lng: 114.502, lat: 38.045, districts: ['长安区', '裕华区', '高新区'] },
  { province: '江西省', city: '南昌市', abbr: '洪', lng: 115.858, lat: 28.683, districts: ['红谷滩区', '西湖区', '青山湖区'] },
  { province: '广西壮族自治区', city: '南宁市', abbr: '邕', lng: 108.32, lat: 22.824, districts: ['青秀区', '西乡塘区', '良庆区'] },
  { province: '黑龙江省', city: '哈尔滨市', abbr: '哈', lng: 126.535, lat: 45.803, districts: ['南岗区', '松北区', '道里区'] }
]

export const VENDORS = [
  { name: '海康威视', models: ['DS-2CD3T46WDV3-I3', 'DS-2CD2T47EWD-L', 'iDS-2DC7423IW-A', 'DS-8608N-K8'], prefix: 'HK' },
  { name: '大华股份', models: ['DH-IPC-HFW2439M-AS', 'DH-IPC-HDBW2431R-ZS', 'DH-SD49225XA-HNR', 'DH-NVR2108HS-8P'], prefix: 'DH' },
  { name: '宇视科技', models: ['IPC3224SR3-DUF28', 'IPC2124SR3-DUPF40', 'HIC6621EX22-5CIR', 'NVR301-08S3'], prefix: 'YS' },
  { name: '华为技术', models: ['HoloSens M2241-10-QLI', 'HoloSens X2341-VL', 'HoloSens X6241-10-Z37', 'HoloSens IVS1800-C08'], prefix: 'HW' },
  { name: '普联技术', models: ['TL-IPC544HP', 'TL-IPC632-A4', 'TL-IPC642-A4', 'TL-NVR6116K'], prefix: 'TP' },
  { name: '天地伟业', models: ['TC-C322N', 'TC-C52EN', 'TC-H326S', 'TC-NR2016K'], prefix: 'TD' },
  { name: '苏州科达', models: ['IPC2252-Gi4N', 'IPC2555-Gi4X', 'NVR2860-16H'], prefix: 'KD' }
]

export const DEVICE_CATEGORIES = [
  { name: '枪型摄像机', code: 'IPC-BULLET', ratio: 0.3 },
  { name: '半球摄像机', code: 'IPC-DOME', ratio: 0.22 },
  { name: '高速球机', code: 'IPC-PTZ', ratio: 0.12 },
  { name: '云台摄像机', code: 'IPC-PT', ratio: 0.06 },
  { name: 'NVR 录像机', code: 'NVR', ratio: 0.14 },
  { name: 'DVR 录像机', code: 'DVR', ratio: 0.06 },
  { name: '边缘智能网关', code: 'EDGE', ratio: 0.06 },
  { name: '视频解码器', code: 'DECODER', ratio: 0.04 }
]

export const PROTOCOLS = ['GB/T 28181-2016', 'ONVIF', 'RTSP', '厂商私有协议', 'GA/T 1400']

export const RESOLUTIONS = ['1920×1080', '2560×1440', '3840×2160', '1280×720']
export const CODECS = ['H.264', 'H.265', 'SVAC2.0']
export const FIRMWARE_VERSIONS = ['V5.7.3 build 240815', 'V5.7.8 build 250312', 'V6.1.2 build 250621', 'V6.2.0 build 250904']

export const INDUSTRIES = [
  '智慧园区', '平安城市', '智慧校园', '智慧交通', '智慧工地', '连锁门店', '能源电力', '智慧农业'
]

export const SCENES = [
  '园区南门', '园区北门', '地下车库A区', '地下车库B区', '生产车间1号', '生产车间2号', '原料仓库',
  '教学楼走廊', '宿舍楼大厅', '图书馆入口', '实验楼走廊', '食堂门口', '运动场看台',
  '营业厅入口', '门店收银台', '商场中庭', '电梯厅', '扶梯口',
  '变电站周界', '配电房', '油罐区', '光伏阵列',
  '工地塔吊', '施工便道', '钢筋加工区', '安全教育通道',
  '地铁B口', '高速匝道', '隧道入口', '停车场出口', '加油站罩棚',
  '河道监测点', '农田灌溉渠', '大棚出入口', '养殖区通道',
  '数据中心机房', '动力机房', '办公楼大堂', '物流分拣线', '月台装卸区', '危化品库房', '周界围墙'
]

export const ALARM_TYPES = [
  { name: '设备离线', category: 'device', weight: 26, durationRange: [8, 320] },
  { name: '视频遮挡', category: 'device', weight: 8, durationRange: [3, 90] },
  { name: '移动侦测', category: 'device', weight: 12, durationRange: [1, 20] },
  { name: '区域入侵', category: 'ai', weight: 10, durationRange: [1, 30] },
  { name: '越界侦测', category: 'ai', weight: 6, durationRange: [1, 25] },
  { name: '视频信号丢失', category: 'device', weight: 7, durationRange: [5, 180] },
  { name: '硬盘异常', category: 'storage', weight: 5, durationRange: [30, 600] },
  { name: '存储空间将满', category: 'storage', weight: 5, durationRange: [60, 1440] },
  { name: '设备温度过高', category: 'device', weight: 4, durationRange: [10, 120] },
  { name: '网络抖动', category: 'network', weight: 6, durationRange: [2, 60] },
  { name: '人形检测', category: 'ai', weight: 9 },
  { name: '车辆检测', category: 'ai', weight: 6 },
  { name: '车牌识别', category: 'ai', weight: 5 },
  { name: '未戴安全帽', category: 'ai', weight: 4 },
  { name: '烟火检测', category: 'ai', weight: 3 },
  { name: '人员离岗', category: 'ai', weight: 3 },
  { name: '客流统计', category: 'ai', weight: 2 },
  { name: '电动车进电梯', category: 'ai', weight: 2 },
  { name: '垃圾满溢', category: 'ai', weight: 2 },
  { name: '人员聚集', category: 'ai', weight: 2 }
] as { name: string; category: string; weight: number; durationRange?: number[] }[]

export const ALARM_LEVELS = [
  { value: 'urgent', label: '紧急', weight: 8 },
  { value: 'major', label: '重要', weight: 22 },
  { value: 'minor', label: '次要', weight: 42 },
  { value: 'info', label: '提示', weight: 28 }
] as { value: string; label: string; weight: number }[]

export const WORK_ORDER_TYPES = [
  '设备安装调试', '故障报修', '定期巡检', '系统升级', '使用培训', '驻场服务', '定制开发'
]

export const WORK_ORDER_STATUS = [
  { value: 'pending', label: '待受理' },
  { value: 'assigned', label: '已派单' },
  { value: 'processing', label: '处理中' },
  { value: 'verifying', label: '待验收' },
  { value: 'completed', label: '已完成' },
  { value: 'closed', label: '已关闭' }
]

export const DEPARTMENTS = [
  { name: '运维服务部', children: ['华东运维组', '华南运维组', '西部运维组'] },
  { name: '技术支持部', children: ['一线支持组', '二线专家组', '现场服务组'] },
  { name: '算法研发部', children: ['算法工程组', '数据标注组'] },
  { name: '平台研发部', children: ['前端组', '后端组', '测试组'] },
  { name: '客户成功部', children: ['客户服务组', '回访组'] },
  { name: '商务部', children: [] },
  { name: '财务部', children: [] }
]

export const SURNAMES = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛奚范彭郎鲁韦昌马苗凤花方俞任袁柳唐罗薛伍余米贝姚孟高夏蔡田樊胡凌霍虞万支柯昝管卢莫经房裘缪干解应宗丁宣邓郁单杭洪包诸左石崔吉龚程嵇邢滑裴陆荣翁荀羊甄曲家封芮羿储靳汲邴糜松井段富巫乌焦巴弓牧隗山谷车侯宓蓬全郗班仰秋仲伊宫宁仇栾暴甘钭历戎祖武符刘景詹束龙叶幸司韶郜黎蓟薄印宿白怀蒲台从鄂索咸籍赖卓蔺屠蒙池乔阴郁胥能苍双闻莘党翟谭贡劳逄姬申扶堵冉宰郦雍却璩桑桂濮牛寿通边扈燕冀郏浦尚农温别庄晏柴瞿阎充慕连茹习宦艾鱼容向古易慎戈廖庾终暨居衡步都耿满弘匡国文寇广禄阙东欧殳沃利蔚越夔隆师巩厍聂晁勾敖融冷訾辛阚那简饶空曾毋沙乜养鞠须丰巢关蒯相查后荆红游竺权逯盖益桓公'
export const GIVEN_NAMES = ['建国', '志强', '伟东', '晓明', '海涛', '雪莲', '雅琴', '俊杰', '文博', '嘉怡', '子涵', '思远', '宇航', '浩然', '梓萱', '若曦', '天成', '立诚', '德明', '国栋', '丽娜', '秀英', '桂芳', '梦琪', '玉洁', '宏伟', '振华', '守义', '寒松', '云帆']

export const COMPANY_PREFIX = ['华', '中', '东', '南', '北', '新', '金', '宏', '润', '恒', '瑞', '泰', '嘉', '联', '远', '正', '博', '安', '晟', '德']
export const COMPANY_MID = ['天', '信', '科', '宇', '通', '盛', '达', '联', '创', '智', '泰', '源', '盛', '邦', '越', '尊', '睿', '捷', '威', '诚']
export const COMPANY_SUFFIX = ['科技有限公司', '信息技术有限公司', '智能科技有限公司', '实业有限公司', '网络科技有限公司', '电子科技有限公司', '系统工程有限公司']

export const KNOWLEDGE_CATEGORIES = ['故障排查', '安装调试', '平台使用', 'AI 算法', '网络通信', '安全加固', '产品选型']
export const KNOWLEDGE_TITLES = [
  'IPC 频繁掉线排查指引（GB28181 心跳超时）',
  'NVR 硬盘异常告警处理流程与更换标准',
  '摄像机夜间画面偏暗的参数调优方案',
  '云平台设备接入失败常见错误码对照表',
  '球机预置位偏移的原因分析与校准方法',
  '如何配置区域内入侵检测的 ROI 与阈值',
  '存储池写入速率下降的定位思路',
  '视频流花屏卡顿的链路排查清单',
  '大规模设备批量升级的风险控制要点',
  '算法误报率偏高的参数调整建议',
  '边缘网关离线后的数据补传机制说明',
  '弱电井交换机端口环路导致的全网抖动案例',
  '如何通过抓包定位 RTSP 拉流失败问题',
  '车牌识别准确率受补光影响的实测数据',
  '机房断电恢复后设备自动重连策略',
  '视频水印功能的配置与合规要求',
  '跨网段设备接入的端口映射配置说明',
  '如何评估云存储容量需求与生命周期策略',
  '摄像机防护等级与室外安装注意事项',
  '平台告警风暴的收敛与降噪实践',
  'AI 任务 GPU 资源争抢的调度优化',
  '录像缺失的三种典型原因与恢复办法',
  '新装设备上线前的标准化验收清单',
  '如何为连锁门店做统一视频巡检模板',
  '第三方平台对接接口鉴权失败排查',
  '边缘节点带宽跑满的限流方案',
  '摄像机时间与平台时间不同步的修复',
  '如何用巡检报告量化运维服务质量',
  '设备台账批量导入失败的原因汇总',
  '安全帽识别在逆光场景下的优化记录'
]

export const SPARE_PART_CATALOG = [
  { name: '网络枪型摄像机', model: 'DS-2CD3T46WDV3-I3', category: '摄像机', price: 780 },
  { name: '半球摄像机', model: 'DH-IPC-HDBW2431R-ZS', category: '摄像机', price: 690 },
  { name: '高速球机', model: 'iDS-2DC7423IW-A', category: '摄像机', price: 4680 },
  { name: 'NVR 录像机 8 路', model: 'DS-8608N-K8', category: '录像机', price: 1580 },
  { name: '企业级硬盘 8TB', model: 'ST8000VX004', category: '存储介质', price: 1180 },
  { name: '企业级硬盘 4TB', model: 'WD40PURZ', category: '存储介质', price: 690 },
  { name: 'PoE 交换机 8 口', model: 'TL-SG1210P', category: '网络设备', price: 460 },
  { name: 'PoE 交换机 16 口', model: 'TL-SG1218P', category: '网络设备', price: 880 },
  { name: '光纤收发器', model: 'TL-FC311A/B', category: '网络设备', price: 180 },
  { name: '摄像机电源适配器 12V2A', model: 'DS-2FA1202-B', category: '配件', price: 45 },
  { name: '防水尾线套件', model: 'DS-1275ZJ', category: '配件', price: 68 },
  { name: '壁装支架', model: 'DS-1212ZJ', category: '配件', price: 85 },
  { name: '抱杆支架', model: 'DS-1602ZJ', category: '配件', price: 140 },
  { name: '边缘智能网关', model: 'HoloSens IVS1800-C08', category: '智能设备', price: 8600 },
  { name: '视频解码器', model: 'DS-6904UDI', category: '智能设备', price: 3200 },
  { name: '网线超五类 305m', model: 'CAT5E-305', category: '线缆', price: 320 },
  { name: '光缆 4 芯 1000m', model: 'GYTA-4B1.3', category: '线缆', price: 1150 },
  { name: 'UPS 电源 3KVA', model: 'C3K', category: '电源', price: 4200 },
  { name: '防雷器', model: 'DS-BNC-2', category: '配件', price: 165 },
  { name: '硬盘录像机 16 路', model: 'DH-NVR4216-16P-4KS3', category: '录像机', price: 2680 }
]

export const ALGORITHMS = [
  { name: '人形检测', code: 'ALG_PERSON_DET', type: '目标检测', vendor: '云眸智能', accuracy: 96.8, gpuCost: 0.8, price: 120, scenes: ['园区周界', '校园', '厂区'] },
  { name: '车辆检测', code: 'ALG_VEHICLE_DET', type: '目标检测', vendor: '云眸智能', accuracy: 95.4, gpuCost: 0.9, price: 130, scenes: ['停车场', '卡口', '物流园'] },
  { name: '车牌识别', code: 'ALG_LPR', type: '图像识别', vendor: '智行科技', accuracy: 97.2, gpuCost: 1.2, price: 200, scenes: ['出入口', '卡口'] },
  { name: '安全帽佩戴检测', code: 'ALG_HELMET', type: '目标检测', vendor: '安捷智造', accuracy: 94.1, gpuCost: 0.9, price: 150, scenes: ['施工工地', '生产车间'] },
  { name: '反光衣识别', code: 'ALG_VEST', type: '目标检测', vendor: '安捷智造', accuracy: 93.6, gpuCost: 0.9, price: 150, scenes: ['施工工地', '车间'] },
  { name: '烟火检测', code: 'ALG_FIRE_SMOKE', type: '目标检测', vendor: '云眸智能', accuracy: 92.5, gpuCost: 1.1, price: 180, scenes: ['林区', '仓库', '油罐区'] },
  { name: '周界入侵检测', code: 'ALG_INTRUSION', type: '行为分析', vendor: '宇视智算', accuracy: 95.9, gpuCost: 1.0, price: 160, scenes: ['园区周界', '变电站'] },
  { name: '人员离岗检测', code: 'ALG_OFF_DUTY', type: '行为分析', vendor: '宇视智算', accuracy: 93.2, gpuCost: 0.7, price: 110, scenes: ['消控室', '值班岗'] },
  { name: '客流统计', code: 'ALG_CROWD_FLOW', type: '统计分析', vendor: '智汇数据', accuracy: 94.8, gpuCost: 1.3, price: 220, scenes: ['商场', '景区', '地铁'] },
  { name: '电动车进电梯检测', code: 'ALG_EBIKE', type: '目标检测', vendor: '智汇数据', accuracy: 96.1, gpuCost: 0.6, price: 90, scenes: ['住宅小区', '写字楼'] },
  { name: '垃圾满溢检测', code: 'ALG_GARBAGE', type: '图像识别', vendor: '智汇数据', accuracy: 91.7, gpuCost: 0.5, price: 80, scenes: ['市政道路', '园区'] },
  { name: '人员聚集检测', code: 'ALG_GATHER', type: '行为分析', vendor: '宇视智算', accuracy: 93.0, gpuCost: 1.0, price: 170, scenes: ['广场', '车站'] },
  { name: '打电话行为识别', code: 'ALG_PHONE', type: '行为分析', vendor: '安捷智造', accuracy: 92.8, gpuCost: 0.9, price: 140, scenes: ['加油站', '生产车间'] },
  { name: '抽烟行为识别', code: 'ALG_SMOKING', type: '行为分析', vendor: '安捷智造', accuracy: 91.4, gpuCost: 0.9, price: 140, scenes: ['加油站', '危化品库'] },
  { name: '跌倒检测', code: 'ALG_FALL', type: '行为分析', vendor: '康养智联', accuracy: 92.0, gpuCost: 1.0, price: 190, scenes: ['养老院', '医院'] },
  { name: '穿越警戒线告警', code: 'ALG_TRIPWIRE', type: '行为分析', vendor: '云眸智能', accuracy: 95.1, gpuCost: 0.8, price: 150, scenes: ['高速公路', '隧道'] },
  { name: '积水检测', code: 'ALG_WATERLOG', type: '图像识别', vendor: '市政智眼', accuracy: 90.6, gpuCost: 0.5, price: 85, scenes: ['下穿隧道', '地下车库'] },
  { name: '设备遮挡智能识别', code: 'ALG_OCCLUSION', type: '图像识别', vendor: '云眸智能', accuracy: 94.4, gpuCost: 0.6, price: 95, scenes: ['全场景'] }
]

export const API_GROUPS = ['设备管理', '通道管理', '告警中心', 'AI 分析', '云存储', '技术服务', '组织与权限']

export const MICRO_SERVICES = [
  { name: '设备接入服务', code: 'device-gateway', depends: [] },
  { name: '流媒体服务', code: 'media-server', depends: ['device-gateway'] },
  { name: '云存储服务', code: 'storage-service', depends: ['device-gateway', 'media-server'] },
  { name: 'AI 调度服务', code: 'ai-scheduler', depends: ['media-server'] },
  { name: '告警中心服务', code: 'alarm-center', depends: ['device-gateway', 'ai-scheduler'] },
  { name: '消息推送服务', code: 'notify-service', depends: ['alarm-center'] },
  { name: '数据同步服务', code: 'data-sync', depends: ['device-gateway', 'storage-service'] },
  { name: '开放平台网关', code: 'openapi-gateway', depends: ['device-gateway', 'alarm-center'] }
]

export const PATROL_ITEMS = [
  '设备在线状态核查', '录像完整性抽检', '存储容量水位检查', '固件版本一致性检查',
  '镜头清洁度检查', '网络时延与丢包检测', 'AI 任务运行状态检查', '告警处置及时性核查',
  '机柜供电与散热检查', '标签与台账一致性核对'
]

export const PLAN_NAMES = ['基础版', '专业版', '旗舰版'] as const
