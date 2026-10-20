import type { Client } from '@/types/models';
import { makeRng } from '../seed';

const rng = makeRng(20260202);

const seeds: Omit<Client, 'totalContractAmount' | 'satisfaction'>[] = [
  {
    id: 'CLI-001',
    name: '深圳市云跃网络科技有限公司',
    shortName: '云跃网络',
    region: '深圳',
    contactName: '邓斯远',
    contactPhone: '138****6621',
    contactEmail: 'dengsy@yunyue-tech.com',
    cooperateSince: '2023-04-12',
  },
  {
    id: 'CLI-002',
    name: '广州星合互动娱乐有限公司',
    shortName: '星合互动',
    region: '广州',
    contactName: '梁书言',
    contactPhone: '139****2087',
    contactEmail: 'liangsy@xinghe-game.com',
    cooperateSince: '2023-09-05',
  },
  {
    id: 'CLI-003',
    name: '杭州趣游数字科技有限公司',
    shortName: '趣游数字',
    region: '杭州',
    contactName: '秦朗',
    contactPhone: '137****4419',
    contactEmail: 'qinlang@quyou-digital.com',
    cooperateSince: '2022-11-21',
  },
  {
    id: 'CLI-004',
    name: '上海幻境文化传播有限公司',
    shortName: '幻境文化',
    region: '上海',
    contactName: '阮清和',
    contactPhone: '136****7734',
    contactEmail: 'ruanqh@huanjing-culture.com',
    cooperateSince: '2024-03-08',
  },
  {
    id: 'CLI-005',
    name: '北京天穹在线科技有限公司',
    shortName: '天穹在线',
    region: '北京',
    contactName: '崔亦然',
    contactPhone: '135****1192',
    contactEmail: 'cuiyr@skyline-online.com',
    cooperateSince: '2022-06-14',
  },
  {
    id: 'CLI-006',
    name: '成都熊猫互娱网络有限公司',
    shortName: '熊猫互娱',
    region: '成都',
    contactName: '温雅',
    contactPhone: '188****3320',
    contactEmail: 'wenya@panda-ent.com',
    cooperateSince: '2024-08-19',
  },
  {
    id: 'CLI-007',
    name: '厦门海豚互娱科技有限公司',
    shortName: '海豚互娱',
    region: '厦门',
    contactName: '洪立诚',
    contactPhone: '159****8846',
    contactEmail: 'honglc@dolphin-ent.com',
    cooperateSince: '2023-12-04',
  },
  {
    id: 'CLI-008',
    name: '南京数感信息技术有限公司',
    shortName: '数感信息',
    region: '南京',
    contactName: '邵敏行',
    contactPhone: '186****5517',
    contactEmail: 'shaomx@shugan-tech.com',
    cooperateSince: '2025-01-16',
  },
  {
    id: 'CLI-009',
    name: 'Rebecca Games Pte. Ltd.',
    shortName: 'Rebecca Games',
    region: '新加坡',
    contactName: 'Rebecca Tan',
    contactPhone: '+65 8123 ****',
    contactEmail: 'rebecca.tan@rebeccagames.sg',
    cooperateSince: '2024-05-27',
  },
  {
    id: 'CLI-010',
    name: 'Joybox Media Inc.',
    shortName: 'Joybox',
    region: '加拿大',
    contactName: 'Daniel Roy',
    contactPhone: '+1 604 ****',
    contactEmail: 'daniel.roy@joyboxmedia.ca',
    cooperateSince: '2025-02-11',
  },
  {
    id: 'CLI-011',
    name: '武汉两点半网络科技有限公司',
    shortName: '两点半',
    region: '武汉',
    contactName: '聂子昂',
    contactPhone: '177****9903',
    contactEmail: 'nieza@2half-pm.com',
    cooperateSince: '2025-06-23',
  },
  {
    id: 'CLI-012',
    name: '长沙橘子洲头互娱有限公司',
    shortName: '橘子洲头',
    region: '长沙',
    contactName: '谭雨桐',
    contactPhone: '150****4471',
    contactEmail: 'tanyt@juzizhou-ent.com',
    cooperateSince: '2026-02-09',
  },
];

export const clients: Client[] = seeds.map((c) => ({
  ...c,
  totalContractAmount: rng.int(45, 620) * 10000,
  satisfaction: rng.float(3.6, 5, 1),
}));

export const clientsById = new Map(clients.map((c) => [c.id, c]));

export function clientName(id: string): string {
  return clientsById.get(id)?.shortName ?? '未知客户';
}
