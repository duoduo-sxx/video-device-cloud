import type { GenRecord } from '@/types';

const TEMPLATES = [
  { name: '商品详情页文案', model: 'CopyGen-CN', unit: '篇' },
  { name: '短视频口播脚本', model: 'Qwen3-72B-Instruct', unit: '篇' },
  { name: '营销图·促销卡片', model: 'ImageGen-Mkt', unit: '张' },
  { name: '售后回复话术', model: 'Qwen3-14B-Chat', unit: '篇' },
  { name: '质检报告摘要', model: 'Qwen3-72B-Instruct', unit: '篇' },
];

const CONTENTS = [
  '【产品标题】高强度汽车紧固件 M12×60 法兰面螺栓 10.9 级\n\n【卖点提炼】\n1. 采用 40Cr 合金钢调质处理，抗拉强度达 1040MPa，疲劳寿命较普通件提升 42%\n2. 螺纹精度 6g，配合扭矩稳定，装配一次合格率 99.3%\n3. 表面达克罗涂层，中性盐雾试验 720 小时无红锈\n\n【适用场景】新能源整车底盘、电池包支架、副车架连接。',
  '【开场 3 秒】一辆车从 0 到 100 只要 3.9 秒，但很少有人知道，撑住这个加速的，是 128 颗螺丝。\n\n【正文】我们给国内 6 家新能源主机厂供货，从原材料光谱分析到成品扭矩测试，每一颗都要过 11 道检。\n\n【结尾】恒锐零部件，让每一次加速都稳得住。',
  '【主标】秋季保养季 · 底盘件全场 8 折\n【副标】原厂同源供应商 · 支持 48 小时发货\n【行动点】立即领取企业采购券\n【尺寸】1080×1080 / 3:4 竖版',
  '您好，感谢您的反馈。经查该批次（BT-20260912）扭矩值波动属装配工装校准偏差，我们已对 3 号工位重新标定，并为该批次提供免费复检。预计 2 个工作日内工程师上门，给您带来不便我们深表歉意。',
  '本批次共检验 12,480 件，合格 12,392 件，合格率 99.29%，较上批次提升 0.34 个百分点。主要缺陷为表面划伤（42 件）与螺纹通规不过（46 件），已定位至 2 号产线抛光工序，建议更换抛光轮并调整进给速度。',
];

function seeded(seed: number): number {
  const x = Math.sin(seed * 78.233 + 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const records: GenRecord[] = [];
for (let i = 0; i < 128; i++) {
  const tpl = TEMPLATES[i % TEMPLATES.length];
  const r = seeded(i + 1);
  const status: GenRecord['status'] = i % 41 === 0 ? 'blocked' : i % 17 === 0 ? 'reviewing' : 'success';
  const units = tpl.unit === '张' ? 1 : 1;
  records.push({
    id: `GEN-${String(1000 + i)}`,
    tenantId: 'TEN-0001',
    modelName: tpl.model,
    template: tpl.name,
    content: CONTENTS[i % CONTENTS.length],
    units,
    unitLabel: tpl.unit,
    cost: tpl.unit === '张' ? 1.2 : Number((2.2 + r * 3.6).toFixed(2)),
    status,
    createdAt: `2026-10-${String(31 - (i % 28)).padStart(2, '0')}T${String(8 + (i % 12)).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}:00`,
    latencyMs: Math.round(1800 + r * 5200),
  });
}

export const GEN_RECORDS = records.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

export function gensOf(tenantId: string): GenRecord[] {
  return GEN_RECORDS.filter((g) => g.tenantId === tenantId);
}

export const GEN_TEMPLATES = TEMPLATES;
