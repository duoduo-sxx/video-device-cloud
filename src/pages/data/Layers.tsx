import { useState } from 'react';
import { ArrowRight, Database, GitBranch, Table2 } from 'lucide-react';
import { Card, CardHeader, PageHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Drawer } from '@/components/ui/Overlay';
import { DAG_STEPS, DATA_TABLES, TABLE_MAP } from '@/mocks/pipeline';
import { LAYER_LABEL, type DataTable, type LayerCode } from '@/types';
import { num, qty } from '@/lib/format';

const LAYERS: LayerCode[] = ['ODS', 'DWD', 'DWS', 'ADS'];

const LAYER_DESC: Record<LayerCode, string> = {
  ODS: '原样落库，不做任何口径转换，保证可回溯',
  DWD: '清洗、去重、口径统一、时区归一，是可信分析的地基',
  DWS: '按账户 / 计划 / 人群 / 素材 / 漏斗做多维汇总',
  ADS: '模型输出的洞察、归因、诊断与建议，直接服务前端',
};

export default function Layers() {
  const [active, setActive] = useState<DataTable | null>(null);

  return (
    <>
      <PageHeader
        title="数仓分层"
        desc={`${DATA_TABLES.length} 张表按 ODS → DWD → DWS → ADS 四层组织；上游改了字段下游会立刻报错，血缘关系让「这个指标从哪来」可被追溯`}
        breadcrumb="数据资产 / 数仓分层"
        actions={<Badge tone="blue">{DATA_TABLES.length} 张表 · 增量更新</Badge>}
      />

      <Card className="mb-4">
        <CardHeader title="今日加工链路" desc="每一步都记录行数与耗时，任一步失败会阻断下游" />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {DAG_STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className="rounded-ctl border border-line px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <span className="num text-2xs text-ink-3">{s.start}</span>
                  <Badge tone="green">成功</Badge>
                </div>
                <div className="mt-0.5 text-xs font-medium text-ink-1">{s.name}</div>
                <div className="mt-0.5 max-w-[220px] text-2xs leading-snug text-ink-3">{s.note}</div>
              </div>
              {i < DAG_STEPS.length - 1 && <ArrowRight size={13} className="text-ink-3" />}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {LAYERS.map((layer) => {
          const tables = DATA_TABLES.filter((t) => t.layer === layer);
          const rows = tables.reduce((s, t) => s + t.rows, 0);
          return (
            <div key={layer} className="flex flex-col gap-2">
              <div className="rounded-card border border-line bg-white px-4 py-3 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-1">
                    <Database size={13} className="text-primary" />
                    {LAYER_LABEL[layer]}
                  </span>
                  <span className="num text-2xs text-ink-3">{tables.length} 张</span>
                </div>
                <div className="mt-1 text-2xs leading-relaxed text-ink-3">{LAYER_DESC[layer]}</div>
                <div className="num mt-1.5 text-2xs text-ink-2">合计 {qty(rows)} 行</div>
              </div>

              {tables.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActive(t)}
                  className="rounded-card border border-line bg-white px-4 py-3 text-left shadow-card transition-colors hover:border-primary-ring hover:bg-primary-soft/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium leading-snug text-ink-1">{t.cnName}</span>
                    <Table2 size={12} className="mt-0.5 shrink-0 text-ink-3" />
                  </div>
                  <div className="num mt-0.5 truncate text-2xs text-ink-3">{t.name}</div>
                  <div className="mt-2 flex items-center justify-between text-2xs">
                    <span className="num text-ink-2">{qty(t.rows)} 行</span>
                    <span className="text-ink-3">{t.size}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-2xs text-ink-3">
                    <span>{t.updateFreq}</span>
                    <span>{t.owner.split('·')[1]?.trim() ?? t.owner}</span>
                  </div>
                </button>
              ))}
            </div>
          );
        })}
      </div>

      <Card className="mt-4">
        <CardHeader
          title="为什么要分层"
          desc="这不是为了好看，而是为了让「口径对不上」这件事有唯一解"
        />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['口径统一只做一次', '各平台转化口径在 DWD 层折算一次，DWS 及以上都不再处理口径，避免每张报表各算一遍。'],
            ['问题定位有路径', '总览数字异常时，按 DWS → DWD → ODS 逐层下钻，能直接定位到是哪个账户、哪天、哪条创意。'],
            ['重跑成本可控', 'ODS 保留原始数据，口径调整后只需重跑 DWD 及以下，不必重新调平台接口。'],
            ['模型输入稳定', 'ADS 层的模型只依赖 DWS 宽表，字段变更可控，模型不会因为上游平台改字段而静默失效。'],
          ].map(([t, d]) => (
            <div key={t} className="rounded-ctl border border-line px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-ink-1">
                <GitBranch size={12} className="text-primary" />
                {t}
              </div>
              <div className="mt-1 text-2xs leading-relaxed text-ink-3">{d}</div>
            </div>
          ))}
        </div>
      </Card>

      <Drawer
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.cnName ?? ''}
        subtitle={active ? `${active.name} · ${LAYER_LABEL[active.layer]} · ${num(active.rows)} 行 · ${active.size}` : ''}
        width={720}
      >
        {active && (
          <div className="space-y-4">
            <p className="rounded-ctl bg-[#F9FAFB] px-3 py-2 text-xs leading-relaxed text-ink-2">{active.desc}</p>

            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              {[
                ['更新频率', active.updateFreq],
                ['负责人', active.owner],
                ['最近更新', active.updatedAt.slice(5, 16).replace('T', ' ')],
                ['数据量', `${num(active.rows)} 行`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-ctl border border-line px-3 py-2">
                  <div className="text-2xs text-ink-3">{k}</div>
                  <div className="mt-0.5 text-ink-1">{v}</div>
                </div>
              ))}
            </div>

            <div>
              <div className="mb-1.5 text-xs font-semibold text-ink-1">血缘</div>
              <div className="flex flex-wrap items-center gap-2 text-2xs">
                {active.upstream.length ? (
                  active.upstream.map((u) => (
                    <span key={u} className="rounded-ctl border border-line bg-white px-2 py-1 text-ink-2">
                      {TABLE_MAP[u]?.cnName ?? u}
                    </span>
                  ))
                ) : (
                  <span className="text-ink-3">源头表（无上游）</span>
                )}
                <ArrowRight size={11} className="text-ink-3" />
                <span className="rounded-ctl bg-primary px-2 py-1 text-white">{active.cnName}</span>
                <ArrowRight size={11} className="text-ink-3" />
                {active.downstream.length ? (
                  active.downstream.map((d) => (
                    <span key={d} className="rounded-ctl border border-line bg-white px-2 py-1 text-ink-2">
                      {TABLE_MAP[d]?.cnName ?? d}
                    </span>
                  ))
                ) : (
                  <span className="text-ink-3">应用层（无下游）</span>
                )}
              </div>
            </div>

            <div>
              <div className="mb-1.5 text-xs font-semibold text-ink-1">字段（{active.fields.length}）</div>
              <div className="overflow-hidden rounded-ctl border border-line">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#FCFCFD] text-left text-2xs text-ink-3">
                      <th className="px-3 py-2 font-normal">字段</th>
                      <th className="px-3 py-2 font-normal">类型</th>
                      <th className="px-3 py-2 font-normal">说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {active.fields.map((f) => (
                      <tr key={f.name} className="border-t border-line/60">
                        <td className="num px-3 py-1.5 text-ink-1">
                          {f.name}
                          {f.pii && <span className="ml-1 rounded bg-danger-soft px-1 py-px text-[10px] text-danger">PII</span>}
                        </td>
                        <td className="num px-3 py-1.5 text-ink-3">{f.type}</td>
                        <td className="px-3 py-1.5 text-ink-2">{f.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {active.sample.length > 0 && (
              <div>
                <div className="mb-1.5 text-xs font-semibold text-ink-1">样例数据</div>
                <div className="overflow-x-auto rounded-ctl border border-line">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#FCFCFD] text-left text-2xs text-ink-3">
                        {Object.keys(active.sample[0]).map((k) => (
                          <th key={k} className="num whitespace-nowrap px-3 py-2 font-normal">
                            {k}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {active.sample.map((row, i) => (
                        <tr key={i} className="border-t border-line/60">
                          {Object.values(row).map((v, j) => (
                            <td key={j} className="num whitespace-nowrap px-3 py-1.5 text-ink-1">
                              {String(v)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </>
  );
}
