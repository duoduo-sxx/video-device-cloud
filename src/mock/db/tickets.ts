import type { Ticket, TicketMessage } from '@/types/models';
import type { TicketCategory, TicketLevel, TicketStatus } from '@/types/enums';
import { TICKET_LEVEL } from '@/types/enums';
import { projects } from './projects';
import { clients } from './clients';
import { users } from './users';
import { daysAgo, makeRng } from '../seed';

const rng = makeRng(20261010);

const TITLES: Record<TicketCategory, string[]> = {
  incident: [
    '线上支付回调丢失，10 分钟内 3 笔订单未到账',
    '战斗结算偶发失败，玩家反馈奖励未发放',
    '微信端大面积白屏，影响约 12% 用户',
    '抖音渠道登录后角色数据为空',
    '活动页奖励可重复领取，已产生异常发放',
    '服务器 502 持续 5 分钟，玩家批量掉线',
  ],
  integration: [
    '想确认分包加载在支付宝小游戏上的兼容配置',
    'SDK 初始化时报 1003 错误，麻烦协助排查',
    '分享接口在抖音端返回失败，需要联调',
    '联运后台的回调地址应该填哪个域名',
    '接入文档里支付签名示例和实际不一致',
    '小游戏审核要求补充隐私政策链接，格式有要求吗',
  ],
  data: [
    '后台 DAU 和我们自己统计差 8%，麻烦核对口径',
    '付费金额统计与渠道后台对不上，差约 2.3 万',
    '留存数据从 10 月 3 日起出现断层',
    '同一个用户在报表里出现两条记录',
    '埋点事件缺少关卡维度的参数',
  ],
  feature: [
    '能否在 11 月版本中加入好友排行榜？预算和排期怎么算',
    '希望增加一个节日活动模板，支持快速上线',
    '想加一个"看广告复活"的入口，需要评估',
    '排行榜能否按地区拆分，用于区域运营',
    '需要导出每日充值明细，支持按渠道筛选',
  ],
  billing: [
    '10 月账单里有一笔服务器费用重复计费',
    '发票抬头需要变更，麻烦重开',
    '结算单里的人数和我们核对的不一致',
    '季度分成比例需要按新合同调整',
  ],
  account: [
    '新增子账号后无法查看工单，权限配置有问题',
    '离职同事的账号需要回收，流程是什么',
    '需要开通只读账号给财务同事',
  ],
};

interface DialogTurn {
  side: 'client' | 'internal';
  text: string;
  internal?: boolean;
}

const DIALOGS: DialogTurn[][] = [
  [
    { side: 'client', text: '今天上午开始有玩家反馈充值不到账，麻烦看一下' },
    { side: 'internal', text: '收到，我们正在查支付回调日志。方便提供 2 个订单号吗？' },
    { side: 'client', text: '订单号 20261019003821、20261019003904，都是 68 元档位' },
    { side: 'internal', text: '已经定位到了，支付宝渠道的回调地址在上次发版时被覆盖成了测试环境。' },
    { side: 'internal', text: '已恢复配置并对这两笔订单做了补单，请让玩家重新进入游戏确认。', internal: true },
    { side: 'client', text: '玩家说收到了，辛苦' },
    { side: 'internal', text: '我们加了一个回调地址的健康检查，下次发版会自动校验，应该不会再出现。' },
  ],
  [
    { side: 'client', text: '后台显示昨天 DAU 12.4 万，我们自己统计是 11.5 万，差了 8% 左右' },
    { side: 'internal', text: '这可能是统计口径差异。想确认一下你们是按设备去重还是按账号去重？' },
    { side: 'client', text: '我们是按账号，同设备切换账号算两个' },
    { side: 'internal', text: '我们后台默认按设备去重，所以会比账号口径低一些。目前看方向上反了，我拉一下明细。' },
    { side: 'internal', text: '另外跨天登录的时间边界我们用的是 UTC+8 零点，你们是不是用的自然日 24 点结算？' },
    { side: 'client', text: '我们确实是按 24 点结算的' },
    { side: 'internal', text: '那差异主要来自这里。我可以在报表里加一个"按账号口径"的切换，预计下周三上线。' },
  ],
  [
    { side: 'client', text: '抖音那边审核又被驳回了，说是"诱导分享"，具体要改哪里？' },
    { side: 'internal', text: '我看下审核意见。' },
    { side: 'internal', text: '驳回详情：分享文案含"必得奖励"等诱导性表述。需要改成中性描述。', internal: true },
    { side: 'internal', text: '目前分享按钮文案是"分享给好友，必得 100 钻石"，建议改成"分享给好友"。奖励改到邮件里发放，不写死必得。' },
    { side: 'client', text: '这样改会影响分享率吗？' },
    { side: 'internal', text: '短期会有 10%~15% 的下降，但比一直卡审核强。我们可以在分享后弹一个"好友助力"的提示，不写奖励承诺。' },
    { side: 'client', text: '行，那就按这个改，今天能提吗' },
    { side: 'internal', text: '可以，改完我们先过一遍合规自查，下午 4 点前提交。' },
  ],
  [
    { side: 'client', text: '想确认一下，支付宝小游戏的分包加载是不是有额外限制？' },
    { side: 'internal', text: '有的。支付宝小游戏单个分包上限 4MB，总包 20MB，且首次加载必须先拉主包。' },
    { side: 'client', text: '那我们现在 3 个分包的结构可以直接用吗' },
    { side: 'internal', text: '需要调整。你们第 3 个分包是 5.2MB，超限了。建议把里面的场景资源拆成两个包，或者把非首屏资源改成远程加载。' },
    { side: 'internal', text: '我把适配清单整理成文档发你，含改造工作量和排期。' },
    { side: 'client', text: '好的，麻烦今天给个初步评估' },
  ],
  [
    { side: 'client', text: '10 月账单里"云服务器 ECS"出现了两次，金额都是 12,800' },
    { side: 'internal', text: '我看一下结算明细。' },
    { side: 'internal', text: '确实重复了，是 9 月的补录单和 10 月的正常单混在一起了。', internal: true },
    { side: 'internal', text: '已确认重复计费 12,800 元，会在本月账单中冲抵，同时重新出一份对账单给你。' },
    { side: 'client', text: '好，麻烦把修正后的账单和发票一起寄过来' },
  ],
  [
    { side: 'client', text: '11 月版本想加一个好友排行榜，预算和排期大概什么量级？' },
    { side: 'internal', text: '如果只做周榜 + 总榜，复用现有账号体系，大概 8 人天，可以放进 11 月第二个迭代。' },
    { side: 'internal', text: '如果要做地区榜和好友关系链同步，需要额外接渠道的社交接口，大概 15 人天。' },
    { side: 'client', text: '先做简单版吧，预算按 8 人天报，我这边走审批' },
    { side: 'internal', text: '好的，我出个变更单，确认后进排期。' },
  ],
  [
    { side: 'client', text: '活动页的奖励好像可以重复领取，已经有玩家刷了 20 多次' },
    { side: 'internal', text: '收到，先紧急关闭活动入口，我们查一下领取记录。' },
    { side: 'internal', text: '问题定位到了：领奖接口没有做幂等，客户端重试时会重复发放。', internal: true },
    { side: 'internal', text: '已临时下线活动，正在补幂等校验。异常发放的 47 笔会做回收处理，名单稍后发你确认。' },
    { side: 'client', text: '回收会不会引起玩家投诉？' },
    { side: 'internal', text: '只回收明显异常的重复部分，正常领取的保留。我们准备了公告文案，你确认后一起发。' },
  ],
  [
    { side: 'client', text: 'SDK 初始化一直报 1003，我们这边配置检查过了' },
    { side: 'internal', text: '1003 一般是 AppID 和包名不匹配。方便发一下 AppID 和当前的包名吗？' },
    { side: 'client', text: 'AppID 是 np_live_8f3a2c，包名 com.joybox.starcommand' },
    { side: 'internal', text: '查到了，这个 AppID 绑定的是 com.joybox.starcommand.prod，少了一个 .prod 后缀。' },
    { side: 'client', text: '那我把包名改一下再试' },
    { side: 'internal', text: '可以，改完如果还有问题随时提。另外建议在灰度环境用单独的 AppID，避免和正式环境串数据。' },
  ],
];

const ASSIGNEES = ['U-013', 'U-012', 'U-026', 'U-027', 'U-014'];

export const tickets: Ticket[] = [];

const projectByClient = new Map<string, string>();
projects.forEach((p) => {
  if (!projectByClient.has(p.clientId)) projectByClient.set(p.clientId, p.id);
});

const contactByClient: Record<string, string> = {
  'CLI-001': 'C-U-001',
  'CLI-003': 'C-U-002',
  'CLI-006': 'C-U-003',
};

const clientById = new Map(clients.map((c) => [c.id, c]));
const userById = new Map(users.map((u) => [u.id, u]));

for (let i = 0; i < 210; i += 1) {
  const category = rng.weighted([
    { value: 'incident' as TicketCategory, weight: 18 },
    { value: 'integration' as TicketCategory, weight: 28 },
    { value: 'data' as TicketCategory, weight: 18 },
    { value: 'feature' as TicketCategory, weight: 16 },
    { value: 'billing' as TicketCategory, weight: 12 },
    { value: 'account' as TicketCategory, weight: 8 },
  ]);

  const client = rng.pick(clients);
  const projectId = projectByClient.get(client.id) ?? projects[0]?.id ?? '';
  const titlePool = TITLES[category];
  const title = rng.pick(titlePool);

  const level: TicketLevel =
    category === 'incident'
      ? rng.pick<TicketLevel>(['P0', 'P0', 'P1', 'P1', 'P2'])
      : rng.pick<TicketLevel>(['P1', 'P2', 'P2', 'P2', 'P3', 'P3']);

  const r = rng.next();
  let status: TicketStatus;
  if (r < 0.36) status = 'closed';
  else if (r < 0.48) status = 'resolved';
  else if (r < 0.6) status = 'in_progress';
  else if (r < 0.68) status = 'pending_customer';
  else if (r < 0.78) status = 'assigned';
  else if (r < 0.88) status = 'new';
  else status = 'reopened';

  const createdOffset = rng.int(0, 75);
  const createdAt = daysAgo(createdOffset, rng.int(8, 19), rng.int(0, 59));

  const rule = TICKET_LEVEL[level];
  const respondDeadline = new Date(new Date(createdAt).getTime() + rule.respondMin * 60000);
  const resolveDeadline = new Date(new Date(createdAt).getTime() + rule.resolveMin * 60000);

  const responded = status !== 'new';
  const firstRespondedAt = responded
    ? new Date(new Date(createdAt).getTime() + rng.int(4, Math.max(8, Math.round(rule.respondMin * 0.9))) * 60000)
    : null;

  const resolvedAt =
    status === 'resolved' || status === 'closed'
      ? new Date(new Date(createdAt).getTime() + rng.int(30, Math.round(rule.resolveMin * 1.1)) * 60000)
      : null;

  const now = new Date('2026-10-19T10:32:00+08:00').getTime();
  const breached =
    (resolvedAt ? resolvedAt.getTime() > resolveDeadline.getTime() : now > resolveDeadline.getTime()) &&
    status !== 'closed';

  const dialog = DIALOGS[i % DIALOGS.length] as DialogTurn[];
  const contactName = clientById.get(client.id)?.contactName ?? '客户联系人';
  const clientAccountId = contactByClient[client.id] ?? 'C-U-001';

  const messages: TicketMessage[] = dialog.map((turn, idx) => {
    const base = new Date(createdAt).getTime();
    return {
      id: `TM-${i}-${idx}`,
      authorId: turn.side === 'client' ? clientAccountId : (rng.pick(ASSIGNEES) as string),
      authorType: turn.side,
      authorName: turn.side === 'client' ? contactName : (userById.get(rng.pick(ASSIGNEES))?.name ?? '技术支持'),
      content: turn.text,
      internal: Boolean(turn.internal),
      attachments:
        idx === 2 && rng.chance(0.4)
          ? [{ name: `截图_${2026101 + idx}.png`, size: rng.int(180, 980) * 1024, type: 'image/png' }]
          : [],
      createdAt: new Date(base + idx * rng.int(4, 28) * 60000).toISOString(),
    };
  });

  tickets.push({
    id: `TK-2026-${String(1000 + i)}`,
    title,
    clientId: client.id,
    projectId,
    level,
    category,
    status,
    assigneeId: status === 'new' ? null : rng.pick(ASSIGNEES),
    creatorId: clientAccountId,
    creatorName: contactName,
    sla: {
      respondDeadline: respondDeadline.toISOString(),
      resolveDeadline: resolveDeadline.toISOString(),
      firstRespondedAt: firstRespondedAt ? firstRespondedAt.toISOString() : null,
      resolvedAt: resolvedAt ? resolvedAt.toISOString() : null,
      breached,
    },
    environment:
      category === 'incident' || category === 'integration'
        ? `${rng.pick(['微信小游戏', '抖音小游戏', '支付宝小游戏', '自有 H5'])} / ${rng.pick(['iOS 17.6', 'Android 14', 'Android 13'])} / ${rng.pick(['iPhone 14', 'Redmi Note 12', '华为 Mate 60 Pro'])}`
        : null,
    relatedVersion: category === 'incident' ? (projectId ? '3.2.1' : null) : null,
    satisfaction: status === 'closed' && rng.chance(0.62) ? rng.pick([3, 4, 4, 5, 5, 5]) : null,
    messages,
    createdAt,
    updatedAt: messages[messages.length - 1]?.createdAt ?? createdAt,
  });
}

tickets.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

export const ticketsById = new Map(tickets.map((t) => [t.id, t]));

export const openTickets = tickets.filter((t) => !['closed', 'resolved'].includes(t.status));
export const breachedTickets = tickets.filter((t) => t.sla.breached);
