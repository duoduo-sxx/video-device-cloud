import type { User } from '@/types/models';
import { makeRng } from '../seed';

const rng = makeRng(20260101);

interface Seed {
  id: string;
  name: string;
  enName: string;
  email: string;
  role: User['role'];
  level: string;
  skills: string[];
  status: User['status'];
  joinDate: string;
}

const seeds: Seed[] = [
  { id: 'U-001', name: '陈嘉禾', enName: 'Alex', email: 'alex.chen@nexusplay.studio', role: 'director', level: 'P8', skills: ['项目管理', '客户经营', '成本核算'], status: 'active', joinDate: '2019-03-11' },
  { id: 'U-002', name: '林知远', enName: 'Ryan', email: 'ryan.lin@nexusplay.studio', role: 'pm', level: 'P6', skills: ['小游戏全流程', '需求分析', '排期'], status: 'active', joinDate: '2021-06-08' },
  { id: 'U-003', name: '周砚青', enName: 'Iris', email: 'iris.zhou@nexusplay.studio', role: 'pm', level: 'P6', skills: ['海外发行', '合规', '英语'], status: 'active', joinDate: '2020-09-02' },
  { id: 'U-004', name: '方旬', enName: 'Xun', email: 'xun.fang@nexusplay.studio', role: 'pm', level: 'P5', skills: ['策略品类', '版本管理'], status: 'active', joinDate: '2022-04-18' },
  { id: 'U-005', name: '苏牧', enName: 'Momo', email: 'momo.su@nexusplay.studio', role: 'client_dev', level: 'P6', skills: ['Cocos', '性能优化', '渲染'], status: 'active', joinDate: '2021-02-22' },
  { id: 'U-006', name: '沈亦舟', enName: 'York', email: 'york.shen@nexusplay.studio', role: 'client_dev', level: 'P5', skills: ['LayaAir', '动画系统', 'WebGL'], status: 'active', joinDate: '2022-08-15' },
  { id: 'U-007', name: '许星野', enName: 'Star', email: 'star.xu@nexusplay.studio', role: 'client_dev', level: 'P7', skills: ['Unity WebGL', 'Shader', '包体优化'], status: 'active', joinDate: '2020-05-06' },
  { id: 'U-008', name: '邵川', enName: 'River', email: 'river.shao@nexusplay.studio', role: 'client_dev', level: 'P5', skills: ['PixiJS', '小游戏适配'], status: 'active', joinDate: '2023-01-09' },
  { id: 'U-009', name: '贺临川', enName: 'Ethan', email: 'ethan.he@nexusplay.studio', role: 'client_dev', level: 'P5', skills: ['Cocos', '战斗系统'], status: 'active', joinDate: '2023-07-03' },
  { id: 'U-010', name: '崔明澈', enName: 'Miles', email: 'miles.cui@nexusplay.studio', role: 'client_dev', level: 'P6', skills: ['LayaAir', '物理引擎', '网络同步'], status: 'active', joinDate: '2021-11-29' },
  { id: 'U-011', name: '孟川', enName: 'Marco', email: 'marco.meng@nexusplay.studio', role: 'client_dev', level: 'P5', skills: ['PixiJS', 'TypeScript'], status: 'active', joinDate: '2024-03-12' },
  { id: 'U-012', name: '陆停云', enName: 'Cloud', email: 'cloud.lu@nexusplay.studio', role: 'dev', level: 'P6', skills: ['构建工具链', 'CI/CD', 'Node'], status: 'active', joinDate: '2021-08-16' },
  { id: 'U-013', name: '温子越', enName: 'Yue', email: 'yue.wen@nexusplay.studio', role: 'dev', level: 'P5', skills: ['SDK', '埋点', '支付接入'], status: 'active', joinDate: '2023-02-20' },
  { id: 'U-014', name: '蒋屿森', enName: 'Jason', email: 'jason.jiang@nexusplay.studio', role: 'dev', level: 'P6', skills: ['服务端', '数据统计', '风控'], status: 'active', joinDate: '2022-01-10' },
  { id: 'U-015', name: '柏川', enName: 'Bowen', email: 'bowen.bai@nexusplay.studio', role: 'dev', level: 'P4', skills: ['自动化脚本', 'Python'], status: 'active', joinDate: '2024-06-04' },
  { id: 'U-016', name: '顾南乔', enName: 'Jo', email: 'jo.gu@nexusplay.studio', role: 'artist', level: 'P5', skills: ['UI 设计', '动效', 'Figma'], status: 'active', joinDate: '2022-05-23' },
  { id: 'U-017', name: '程一鸣', enName: 'Ming', email: 'ming.cheng@nexusplay.studio', role: 'artist', level: 'P6', skills: ['角色原画', '骨骼动画', 'Spine'], status: 'active', joinDate: '2020-12-01' },
  { id: 'U-018', name: '黎安', enName: 'Ann', email: 'ann.li@nexusplay.studio', role: 'artist', level: 'P4', skills: ['场景美术', '地图编辑'], status: 'active', joinDate: '2023-10-17' },
  { id: 'U-019', name: '白鹭', enName: 'Lily', email: 'lily.bai@nexusplay.studio', role: 'artist', level: 'P5', skills: ['像素美术', '图标'], status: 'active', joinDate: '2022-09-05' },
  { id: 'U-020', name: '裴清', enName: 'Qing', email: 'qing.pei@nexusplay.studio', role: 'artist', level: 'P5', skills: ['3D 建模', '材质', 'Blender'], status: 'active', joinDate: '2021-07-19' },
  { id: 'U-021', name: '叶知秋', enName: 'Autumn', email: 'autumn.ye@nexusplay.studio', role: 'qa', level: 'P5', skills: ['兼容性测试', '自动化测试'], status: 'active', joinDate: '2022-03-28' },
  { id: 'U-022', name: '唐小满', enName: 'Manman', email: 'manman.tang@nexusplay.studio', role: 'qa', level: 'P4', skills: ['功能测试', '用例设计'], status: 'leave', joinDate: '2023-05-15' },
  { id: 'U-023', name: '卓一苇', enName: 'Wei', email: 'wei.zhuo@nexusplay.studio', role: 'qa', level: 'P4', skills: ['性能测试'], status: 'resigned', joinDate: '2021-04-07' },
  { id: 'U-024', name: '钱屿', enName: 'Chester', email: 'chester.qian@nexusplay.studio', role: 'qa', level: 'P5', skills: ['弱网测试', '抓包分析'], status: 'resigned', joinDate: '2020-10-26' },
  { id: 'U-025', name: '傅时雨', enName: 'Rain', email: 'rain.fu@nexusplay.studio', role: 'qa', level: 'P4', skills: ['回归测试', '缺陷管理'], status: 'active', joinDate: '2024-01-22' },
  { id: 'U-026', name: '江照白', enName: 'Bai', email: 'bai.jiang@nexusplay.studio', role: 'ops', level: 'P6', skills: ['多渠道发布', '监控告警', 'CDN'], status: 'active', joinDate: '2021-09-13' },
  { id: 'U-027', name: '阮星洲', enName: 'Nick', email: 'nick.ruan@nexusplay.studio', role: 'ops', level: 'P5', skills: ['灰度策略', '回滚预案'], status: 'active', joinDate: '2023-04-11' },
  { id: 'U-028', name: '宋清和', enName: 'Qinghe', email: 'qinghe.song@nexusplay.studio', role: 'finance', level: 'P5', skills: ['合同结算', '开票', '成本核算'], status: 'active', joinDate: '2021-12-06' },
  { id: 'U-029', name: '简宁', enName: 'Jane', email: 'jane.jian@nexusplay.studio', role: 'finance', level: 'P4', skills: ['回款跟踪'], status: 'active', joinDate: '2024-02-19' },
  { id: 'U-030', name: '季岚', enName: 'Lan', email: 'lan.ji@nexusplay.studio', role: 'admin', level: 'P7', skills: ['系统运维', '权限管理'], status: 'active', joinDate: '2019-11-04' },
  { id: 'U-031', name: '夏眠', enName: 'Mia', email: 'mia.xia@nexusplay.studio', role: 'pm', level: 'P5', skills: ['休闲品类', '客户沟通'], status: 'active', joinDate: '2022-06-27' },
  { id: 'U-032', name: '骆川', enName: 'Chuan', email: 'chuan.luo@nexusplay.studio', role: 'client_dev', level: 'P4', skills: ['Cocos', 'UI 开发'], status: 'active', joinDate: '2024-08-05' },
  { id: 'U-033', name: '屈南', enName: 'Nan', email: 'nan.qu@nexusplay.studio', role: 'client_dev', level: 'P4', skills: ['LayaAir', '小游戏分包'], status: 'active', joinDate: '2024-09-23' },
  { id: 'U-034', name: '燕来', enName: 'Yan', email: 'yan.lai@nexusplay.studio', role: 'dev', level: 'P5', skills: ['数据埋点', '日志分析'], status: 'leave', joinDate: '2023-03-06' },
  { id: 'U-035', name: '路遥', enName: 'Yao', email: 'yao.lu@nexusplay.studio', role: 'artist', level: 'P4', skills: ['UI 切图', '资源整理'], status: 'leave', joinDate: '2024-04-15' },
  { id: 'U-036', name: '卓不凡', enName: 'Fan', email: 'fan.zhuo@nexusplay.studio', role: 'pm', level: 'P6', skills: ['SLG', '版本规划', '数据分析'], status: 'active', joinDate: '2020-07-21' },
];

export const users: User[] = seeds.map((s) => ({
  ...s,
  monthlyHours: s.status === 'resigned' ? 0 : rng.int(92, 208),
  workload: s.status === 'resigned' ? 0 : rng.float(0.62, 1.42, 2),
}));

export const usersById = new Map(users.map((u) => [u.id, u]));

export function userName(id: string): string {
  return usersById.get(id)?.name ?? '未分配';
}

/** 客户侧联系人账号，独立于内部成员 */
export interface ClientAccount {
  id: string;
  name: string;
  clientId: string;
  title: string;
  email: string;
}

export const clientAccounts: ClientAccount[] = [
  { id: 'C-U-001', name: '邓斯远', clientId: 'CLI-001', title: '技术负责人', email: 'dengsy@yunyue-tech.com' },
  { id: 'C-U-002', name: '秦朗', clientId: 'CLI-003', title: '产品总监', email: 'qinlang@quyou-digital.com' },
  { id: 'C-U-003', name: '温雅', clientId: 'CLI-006', title: '运营经理', email: 'wenya@panda-ent.com' },
];

export const clientAccountsById = new Map(clientAccounts.map((c) => [c.id, c]));
