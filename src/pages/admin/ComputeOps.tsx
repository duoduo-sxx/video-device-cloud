import { useState } from 'react';
import { Activity, AlertTriangle, Cpu, RefreshCw, Server, Thermometer } from 'lucide-react';
import { Card, CardHeader, PageHeader, StatCard } from '@/components/ui/Card';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FilterBar, Select } from '@/components/ui/Form';
import { Progress, Tabs } from '@/components/ui/Overlay';
import { MultiLine } from '@/components/charts';
import { useUIStore } from '@/store/uiStore';
import { COMPUTE_SPECS, COMPUTE_SPECS as SPECS } from '@/mocks/compute';
import { ALERTS } from '@/mocks/misc';
import { money } from '@/lib/format';
import type { AlertItem } from '@/types';

/* ================= 资源池 ================= */
export function ComputePools() {
  const total = SPECS.reduce((a, s) => a + s.totalCards, 0);
  const used = SPECS.reduce((a, s) => a + s.allocatedCards, 0);

  return (
    <div>
      <PageHeader
        title="算力资源池"
        desc={`全平台 ${total} 张 GPU 在线，已分配 ${used} 张，整体分配率 ${((used / total) * 100).toFixed(1)}%`}
      />

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="在线 GPU" value={String(total)} unit="卡" hint="5 个规格 / 3 个区域" tone="primary" />
        <StatCard label="已分配" value={String(used)} unit="卡" hint={`剩余 ${total - used} 卡`} />
        <StatCard label="本月卡时产出" value="286" unit="万卡·时" hint="较上月 +9.4%" tone="success" />
        <StatCard label="平均利用率" value="78.4" unit="%" hint="扣除预留空闲后" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {SPECS.map((s) => (
          <Card key={s.id}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Cpu size={16} />
                </span>
                <div>
                  <div className="text-sm font-semibold text-ink-1">{s.gpuModel}</div>
                  <div className="mt-0.5 text-2xs text-ink-3">
                    {s.region} / {s.zone}
                  </div>
                </div>
              </div>
              <Badge tone={s.status === 'available' ? 'green' : s.status === 'tight' ? 'amber' : 'gray'} dot>
                {s.status === 'available' ? '充足' : s.status === 'tight' ? '紧张' : '售罄'}
              </Badge>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-2xs">
              <div className="rounded-ctl bg-[#F9FAFB] px-2.5 py-2">
                <div className="text-ink-3">总量</div>
                <div className="num mt-0.5 text-xs font-medium text-ink-1">{s.totalCards} 卡</div>
              </div>
              <div className="rounded-ctl bg-[#F9FAFB] px-2.5 py-2">
                <div className="text-ink-3">已分配</div>
                <div className="num mt-0.5 text-xs font-medium text-ink-1">{s.allocatedCards} 卡</div>
              </div>
              <div className="rounded-ctl bg-[#F9FAFB] px-2.5 py-2">
                <div className="text-ink-3">单价</div>
                <div className="num mt-0.5 text-xs font-medium text-ink-1">{money(s.unitPrice)}</div>
              </div>
            </div>
            <div className="mt-3">
              <Progress value={(s.allocatedCards / s.totalCards) * 100} height={5} tone={s.allocatedCards / s.totalCards > 0.85 ? 'warning' : 'primary'} showLabel />
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <CardHeader title="区域分布" desc="跨区调度会产生数据同步时延，建议训练与推理同区部署" />
        <div className="mt-3 grid grid-cols-3 gap-4">
          {[
            ['华北 2（北京）', 624, 448],
            ['华东 1（苏州）', 320, 212],
            ['华南 1（深圳）', 512, 402],
          ].map(([r, t, u]) => (
            <div key={r as string} className="rounded-ctl border border-line p-3.5">
              <div className="text-xs font-medium text-ink-1">{r as string}</div>
              <div className="num mt-1 text-2xs text-ink-3">
                {u as number} / {t as number} 卡
              </div>
              <div className="mt-2">
                <Progress value={((u as number) / (t as number)) * 100} height={4} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ================= 节点与卡 ================= */
interface NodeRow {
  id: string;
  zone: string;
  gpu: string;
  total: number;
  used: number;
  util: number;
  temp: number;
  status: 'online' | 'offline' | 'degraded';
  tenant: string;
}

const NODES: NodeRow[] = [
  { id: 'node-gpu-047', zone: 'cn-north-2a', gpu: 'A100 80G', total: 8, used: 8, util: 92, temp: 89, status: 'degraded', tenant: '恒锐零部件' },
  { id: 'node-gpu-048', zone: 'cn-north-2a', gpu: 'A100 80G', total: 8, used: 8, util: 86, temp: 74, status: 'online', tenant: '恒锐零部件' },
  { id: 'node-gpu-052', zone: 'cn-north-2a', gpu: 'A100 80G', total: 8, used: 6, util: 71, temp: 68, status: 'online', tenant: '中弘新能源' },
  { id: 'node-gpu-061', zone: 'cn-north-2b', gpu: 'L20 48G', total: 8, used: 4, util: 48, temp: 61, status: 'online', tenant: '优鲜生活' },
  { id: 'node-gpu-074', zone: 'cn-east-1b', gpu: 'H100 80G', total: 8, used: 8, util: 94, temp: 79, status: 'online', tenant: '江城农商行' },
  { id: 'node-gpu-078', zone: 'cn-east-1a', gpu: '910B 64G', total: 8, used: 3, util: 37, temp: 58, status: 'online', tenant: '康泰医疗' },
  { id: 'node-gpu-112', zone: 'cn-south-1a', gpu: '4090 24G', total: 8, used: 8, util: 88, temp: 76, status: 'offline', tenant: '星野跨境' },
  { id: 'node-gpu-118', zone: 'cn-south-1a', gpu: '4090 24G', total: 8, used: 5, util: 62, temp: 66, status: 'online', tenant: '顺捷供应链' },
];

export function ComputeNodes() {
  const toast = useUIStore((s) => s.toast);
  const [zone, setZone] = useState('all');
  const rows = NODES.filter((n) => zone === 'all' || n.zone === zone);

  const columns: Column<NodeRow>[] = [
    { key: 'id', title: '节点', width: 150, render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: 'zone', title: '可用区', width: 130, render: (r) => <span className="font-mono text-2xs text-ink-2">{r.zone}</span> },
    { key: 'gpu', title: 'GPU 规格', width: 110, render: (r) => <span className="text-xs">{r.gpu}</span> },
    { key: 'total', title: '卡数', width: 80, align: 'right', render: (r) => <span className="num text-ink-2">{r.used}/{r.total}</span> },
    {
      key: 'util',
      title: '利用率',
      width: 150,
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-20">
            <Progress value={r.util} height={4} tone={r.util > 88 ? 'danger' : r.util > 75 ? 'warning' : 'primary'} />
          </div>
          <span className="num text-2xs text-ink-2">{r.util}%</span>
        </div>
      ),
    },
    {
      key: 'temp',
      title: '温度',
      width: 90,
      align: 'right',
      render: (r) => (
        <span className={`num text-xs ${r.temp >= 85 ? 'font-medium text-danger' : 'text-ink-2'}`}>{r.temp}℃</span>
      ),
    },
    { key: 'tenant', title: '归属租户', width: 130, render: (r) => <span className="text-xs text-ink-2">{r.tenant}</span> },
    {
      key: 'status',
      title: '状态',
      width: 90,
      render: (r) => (
        <Badge tone={r.status === 'online' ? 'green' : r.status === 'degraded' ? 'amber' : 'red'} dot>
          {r.status === 'online' ? '在线' : r.status === 'degraded' ? '降频' : '离线'}
        </Badge>
      ),
    },
    {
      key: 'op',
      title: '操作',
      width: 100,
      align: 'right',
      render: (r) => (
        <button className="text-xs text-primary" onClick={() => toast(`已向 ${r.id} 下发隔离指令`, 'info')}>
          隔离
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="节点与 GPU 卡"
        desc="节点级健康状态与租户归属，温度超过 85℃ 自动降频并告警"
        actions={
          <Button icon={<RefreshCw size={14} />} onClick={() => toast('已刷新节点状态', 'info')}>
            刷新
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="节点总数" value={String(NODES.length)} unit="台" hint="含 1 台离线" />
        <StatCard label="在线节点" value={String(NODES.filter((n) => n.status === 'online').length)} unit="台" tone="success" />
        <StatCard label="高温节点" value={String(NODES.filter((n) => n.temp >= 85).length)} unit="台" hint="阈值 85℃" tone="warning" />
        <StatCard label="平均利用率" value={Math.round(NODES.reduce((a, n) => a + n.util, 0) / NODES.length).toString()} unit="%" />
      </div>

      <Card pad={false}>
        <div className="p-4">
          <FilterBar extra={<span className="text-2xs text-ink-3">共 {rows.length} 个节点</span>}>
            <Select value={zone} onChange={(e) => setZone(e.target.value)} className="w-40">
              <option value="all">全部可用区</option>
              <option value="cn-north-2a">cn-north-2a</option>
              <option value="cn-north-2b">cn-north-2b</option>
              <option value="cn-east-1a">cn-east-1a</option>
              <option value="cn-east-1b">cn-east-1b</option>
              <option value="cn-south-1a">cn-south-1a</option>
            </Select>
          </FilterBar>
        </div>
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} pageSize={10} />
      </Card>
    </div>
  );
}

/* ================= 算力告警 ================= */
export function ComputeAlerts() {
  const toast = useUIStore((s) => s.toast);
  const [tab, setTab] = useState('firing');
  const rows = ALERTS.filter((a) => (tab === 'all' ? true : a.status === tab));

  const metrics = Array.from({ length: 24 }).map((_, i) => ({
    t: `${String(i).padStart(2, '0')}:00`,
    util: 62 + Math.round(Math.abs(Math.sin(i * 0.8)) * 28),
    temp: 58 + Math.round(Math.abs(Math.sin(i * 0.5)) * 26),
  }));

  const columns: Column<AlertItem>[] = [
    {
      key: 'level',
      title: '级别',
      width: 90,
      render: (r) => (
        <Badge tone={r.level === 'critical' ? 'red' : r.level === 'warning' ? 'amber' : 'gray'} dot>
          {r.level === 'critical' ? '紧急' : r.level === 'warning' ? '警告' : '提示'}
        </Badge>
      ),
    },
    { key: 'type', title: '类型', width: 120, render: (r) => <span className="text-xs">{r.type}</span> },
    { key: 'message', title: '描述', render: (r) => <span className="text-xs leading-relaxed text-ink-2">{r.message}</span> },
    { key: 'target', title: '对象', width: 150, render: (r) => <span className="font-mono text-2xs text-ink-2">{r.target}</span> },
    { key: 'createdAt', title: '触发时间', width: 150, render: (r) => <span className="num text-xs text-ink-2">{r.createdAt.replace('T', ' ')}</span> },
    {
      key: 'status',
      title: '状态',
      width: 100,
      render: (r) => <Badge tone={r.status === 'firing' ? 'red' : 'green'}>{r.status === 'firing' ? '告警中' : '已恢复'}</Badge>,
    },
    {
      key: 'op',
      title: '操作',
      width: 110,
      align: 'right',
      render: (r) =>
        r.status === 'firing' ? (
          <button className="text-xs text-primary" onClick={() => toast('已标记为处理中', 'info')}>
            处理
          </button>
        ) : (
          <span className="text-2xs text-ink-3">—</span>
        ),
    },
  ];

  return (
    <div>
      <PageHeader title="算力告警" desc="节点、卡、接口三类告警统一收敛，支持按级别与状态筛选" />

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="告警中" value={String(ALERTS.filter((a) => a.status === 'firing').length)} unit="条" tone="warning" />
        <StatCard label="紧急" value={String(ALERTS.filter((a) => a.level === 'critical' && a.status === 'firing').length)} unit="条" tone="default" />
        <StatCard label="今日已恢复" value="1" unit="条" />
        <StatCard label="平均恢复时长" value="18" unit="分钟" hint="近 7 天" tone="success" />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="集群 GPU 利用率" desc="近 24 小时，全集群加权" extra={<Activity size={15} className="text-ink-3" />} />
          <div className="mt-3">
            <MultiLine data={metrics} xKey="t" height={200} series={[{ key: 'util', name: '利用率（%）' }]} />
          </div>
        </Card>
        <Card>
          <CardHeader title="集群温度" desc="最高温节点曲线，红线 85℃" extra={<Thermometer size={15} className="text-ink-3" />} />
          <div className="mt-3">
            <MultiLine data={metrics} xKey="t" height={200} series={[{ key: 'temp', name: '温度（℃）' }]} />
          </div>
        </Card>
      </div>

      <Card pad={false}>
        <div className="px-4 pt-2">
          <Tabs
            tabs={[
              { key: 'firing', label: '告警中', count: ALERTS.filter((a) => a.status === 'firing').length },
              { key: 'resolved', label: '已恢复', count: ALERTS.filter((a) => a.status === 'resolved').length },
              { key: 'all', label: '全部', count: ALERTS.length },
            ]}
            active={tab}
            onChange={setTab}
            className="mb-3"
          />
        </div>
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} pageSize={8} emptyTitle="当前没有告警" />
      </Card>

      <Card className="mt-4">
        <CardHeader title="告警规则" desc="阈值可在系统配置中调整，默认对全平台生效" extra={<AlertTriangle size={15} className="text-ink-3" />} />
        <div className="mt-3 space-y-2 text-xs">
          {[
            ['GPU 温度', '> 85℃ 持续 3 分钟', '降频并告警'],
            ['节点心跳', '丢失 > 5 分钟', '标记离线并告警'],
            ['利用率', '> 92% 持续 10 分钟', '告警并建议扩容'],
            ['接口延迟', 'P99 > SLA 阈值 1.5 倍', '告警并自动降级'],
            ['资源水位', '分配率 > 85%', '提示扩容'],
          ].map(([t, rule, action]) => (
            <div key={t} className="flex items-center gap-3 border-b border-line pb-2 last:border-0">
              <span className="w-24 shrink-0 font-medium text-ink-1">{t}</span>
              <span className="flex-1 font-mono text-2xs text-ink-2">{rule}</span>
              <span className="text-2xs text-ink-3">{action}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
