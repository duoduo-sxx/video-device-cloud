/**
 * 数据自检脚本：验证演示数据的上下勾稽关系。
 * 运行：npx esbuild scripts/verify.ts --bundle --platform=node --format=esm \
 *        --outfile=scripts/verify.mjs --alias:@=./src && node scripts/verify.mjs
 */
import { ACCOUNTS, PLATFORMS, PLATFORM_MAP, accountsOf } from '@/mocks/platforms';
import {
  ALL_DATES,
  CURRENT_PERIOD,
  DAILY,
  metricsOfAccount,
  metricsOfPlatform,
  totalMetrics,
} from '@/mocks/daily';
import { AD_PLANS, CREATIVES, MATERIALS, plansOfAccount, creativesOfPlan } from '@/mocks/campaigns';
import { ATTRIBUTION } from '@/mocks/attribution';
import { AUDIENCE } from '@/mocks/audience';
import { FUNNEL } from '@/mocks/funnel';
import { ANOMALIES, SUGGESTIONS, CHANGE_ORDERS, RECONCILE, BUDGET_PLANS } from '@/mocks/insights';
import { DATA_TABLES, QUALITY_CHECKS, SYNC_JOBS, METRIC_DEFS } from '@/mocks/pipeline';
import { sumMetrics } from '@/lib/metrics';
import type { AudienceDim, Metrics, PlatformCode } from '@/types';

let pass = 0;
let fail = 0;
const failures: string[] = [];

function ok(name: string, cond: boolean, detail = '') {
  if (cond) pass++;
  else {
    fail++;
    failures.push(`${name} ${detail}`);
  }
}
function eq(name: string, a: number, b: number, tol = 0.011) {
  ok(name, Math.abs(a - b) <= tol, `实际 ${a} vs 期望 ${b}`);
}
const fmt = (n: number) => n.toLocaleString('zh-CN');

/* ---------- 1. 账户 → 平台 ---------- */
for (const p of PLATFORMS) {
  const accs = accountsOf(p.code);
  const sum = sumMetrics(accs.map((a) => metricsOfAccount(a.id)));
  const plat = metricsOfPlatform(p.code);
  for (const k of ['impressions', 'clicks', 'spend', 'conversions', 'paidOrders', 'gmv'] as (keyof Metrics)[]) {
    eq(`[账户→平台] ${p.name}.${k}`, sum[k], plat[k]);
  }
}

/* ---------- 2. 平台 → 大盘 ---------- */
{
  const sum = sumMetrics(PLATFORMS.map((p) => metricsOfPlatform(p.code)));
  const total = totalMetrics();
  for (const k of ['impressions', 'clicks', 'spend', 'conversions', 'paidOrders', 'gmv'] as (keyof Metrics)[]) {
    eq(`[平台→大盘] ${k}`, sum[k], total[k]);
  }
  eq('[大盘] reach 可重复累加口径一致', sum.reach, total.reach, 0.011);
}

/* ---------- 3. 计划 → 账户 ---------- */
for (const a of ACCOUNTS) {
  const plans = plansOfAccount(a.id);
  ok(`[计划覆盖] ${a.id} 有计划`, plans.length > 0);
  const sum = sumMetrics(plans.map((p) => p.m));
  const acc = metricsOfAccount(a.id);
  for (const k of ['impressions', 'clicks', 'spend', 'conversions', 'paidOrders', 'gmv'] as (keyof Metrics)[]) {
    eq(`[计划→账户] ${a.id}.${k}`, sum[k], acc[k]);
  }
}

/* ---------- 4. 创意 → 计划 ---------- */
for (const p of AD_PLANS) {
  const cs = creativesOfPlan(p.id);
  ok(`[创意覆盖] ${p.id} 有创意`, cs.length > 0);
  const sum = sumMetrics(cs.map((c) => c.m));
  for (const k of ['impressions', 'clicks', 'spend', 'conversions', 'paidOrders', 'gmv'] as (keyof Metrics)[]) {
    eq(`[创意→计划] ${p.id}.${k}`, sum[k], p.m[k]);
  }
}

/* ---------- 5. 素材 = 使用该素材的创意之和 ---------- */
for (const mat of MATERIALS) {
  const used = CREATIVES.filter((c) => c.materialId === mat.id);
  ok(`[素材被引用] ${mat.id}`, used.length > 0);
  const sum = sumMetrics(used.map((c) => c.m));
  eq(`[素材汇总] ${mat.name}.spend`, sum.spend, mat.m.spend);
  eq(`[素材汇总] ${mat.name}.conversions`, sum.conversions, mat.m.conversions);
}

/* ---------- 6. 归因：五模型总转化恒等 ---------- */
{
  const total = totalMetrics().conversions;
  for (const row of ATTRIBUTION) {
    eq(`[归因恒等] ${row.model} 合计`, row.total, total, 0);
    const s = Object.values(row.byPlatform).reduce((x, y) => x + y, 0);
    eq(`[归因拆解] ${row.model} 平台之和`, s, row.total, 0);
  }
  ok('[归因] 模型数量为 5', ATTRIBUTION.length === 5);
}

/* ---------- 7. 人群：同维度占比合计 100% ---------- */
for (const dim of Object.keys(AUDIENCE) as AudienceDim[]) {
  const list = AUDIENCE[dim];
  const convSum = list.reduce((s, x) => s + x.convShare, 0);
  const spendSum = list.reduce((s, x) => s + x.spendShare, 0);
  eq(`[人群占比] ${dim}.convShare`, convSum, 1, 0.002);
  eq(`[人群占比] ${dim}.spendShare`, spendSum, 1, 0.002);
  const c = list.reduce((s, x) => s + x.conversions, 0);
  eq(`[人群转化] ${dim} 合计 = 大盘`, c, totalMetrics().conversions, Math.max(1, list.length * 0.5));
  const b = list.reduce((s, x) => s + x.benchmarkShare, 0);
  eq(`[人群基准] ${dim}.benchmarkShare`, b, 1, 0.002);
}

/* ---------- 8. 漏斗：逐级递减且首级 = 总曝光 ---------- */
{
  ok('[漏斗] 7 级', FUNNEL.length === 7, `实际 ${FUNNEL.length}`);
  eq('[漏斗] 首级曝光 = 大盘曝光', FUNNEL[0].count, totalMetrics().impressions, 1);
  for (let i = 1; i < FUNNEL.length; i++) {
    ok(
      `[漏斗] ${FUNNEL[i - 1].label} > ${FUNNEL[i].label}`,
      FUNNEL[i - 1].count > FUNNEL[i].count,
      `${FUNNEL[i - 1].count} / ${FUNNEL[i].count}`,
    );
  }
}

/* ---------- 9. 对账：我方消耗 = 平台汇总 ---------- */
for (const r of RECONCILE) {
  eq(`[对账] ${r.platform} 我方消耗`, r.ourSpend, metricsOfPlatform(r.platform).spend, 0.011);
  ok(`[对账] ${r.platform} 账户数`, r.accountCount === accountsOf(r.platform).length);
  const real = ((r.platformSpend - r.ourSpend) / r.ourSpend) * 100;
  eq(`[对账] ${r.platform} 差异率(%)`, r.diffRate, real, 0.02);
}

/* ---------- 10. 引用完整性 ---------- */
const accountIds = new Set(ACCOUNTS.map((a) => a.id));
const suggestionIds = new Set(SUGGESTIONS.map((s) => s.id));
const planIds = new Set(AD_PLANS.map((p) => p.id));

for (const a of ANOMALIES) {
  ok(`[异常→账户] ${a.id}`, accountIds.has(a.accountId), a.accountId);
  if (a.suggestionId) ok(`[异常→建议] ${a.id}`, suggestionIds.has(a.suggestionId), a.suggestionId);
}
for (const s of SUGGESTIONS) {
  ok(`[建议→账户] ${s.id}`, accountIds.has(s.accountId), s.accountId);
  ok(`[建议对象描述] ${s.id}`, s.target.length > 0);
  ok(`[建议依据] ${s.id}`, s.evidence.length >= 2, String(s.evidence.length));
}
for (const j of SYNC_JOBS) {
  ok(`[同步→账户] ${j.id}`, accountIds.has(j.accountId), j.accountId);
}
for (const c of CHANGE_ORDERS) {
  ok(`[变更单→账户] ${c.id}`, accountIds.has(c.accountId), c.accountId);
  if (c.suggestionId) ok(`[变更单→建议] ${c.id}`, suggestionIds.has(c.suggestionId), c.suggestionId);
  if (c.feedback) {
    ok(`[变更单回收] ${c.id} 天数`, c.feedback.days > 0);
    ok(`[变更单回收] ${c.id} 有结论`, c.feedback.note.length > 6);
  }
  if (c.status === 'effective') ok(`[变更单] ${c.id} 生效需有生效时间`, !!c.effectiveAt);
}
for (const p of BUDGET_PLANS) ok(`[预算→计划] ${p.planId}`, planIds.has(p.planId), p.planId);

const tableIds = new Set(DATA_TABLES.map((t) => t.id));
for (const t of DATA_TABLES) {
  for (const up of t.upstream) ok(`[血缘上游] ${t.id}→${up}`, tableIds.has(up), up);
  for (const dn of t.downstream) ok(`[血缘下游] ${t.id}→${dn}`, tableIds.has(dn), dn);
  ok(`[样例数据] ${t.id}`, t.sample.length > 0 && t.fields.length > 0);
  ok(`[行数] ${t.id}`, t.rows > 0, String(t.rows));
  const fieldKeys = t.fields.map((f) => f.name);
  for (const row of t.sample) {
    for (const k of Object.keys(row)) ok(`[样例字段] ${t.id}.${k}`, fieldKeys.includes(k), k);
  }
}
for (const q of QUALITY_CHECKS) {
  ok(`[质检→表] ${q.id}`, tableIds.has(q.table), q.table);
  ok(`[质检命中] ${q.id} 命中行数 ≤ 总行数`, q.affectedRows <= q.totalRows, `${q.affectedRows}/${q.totalRows}`);
  ok(`[质检口径] ${q.id} 有处理结论`, q.detail.length > 8);
}

/* ---------- 11. 时间与规模 ---------- */
{
  ok('[日期] 区间 61 天', ALL_DATES.length === 61, String(ALL_DATES.length));
  ok('[数据] 每日行数', DAILY.length > 600, String(DAILY.length));
  const dup = new Set(DAILY.map((r) => `${r.accountId}-${r.date}`));
  ok('[数据] 无重复行', dup.size === DAILY.length);
  ok('[指标字典] 13 个', METRIC_DEFS.length === 13, String(METRIC_DEFS.length));
  ok('[账户] 12 个', ACCOUNTS.length === 12, String(ACCOUNTS.length));
  ok('[计划] 21 个', AD_PLANS.length === 21, String(AD_PLANS.length));
  ok('[创意] 30 个', CREATIVES.length === 30, String(CREATIVES.length));
  ok('[素材] 14 个', MATERIALS.length === 14, String(MATERIALS.length));
  ok('[数仓] 21 张表', DATA_TABLES.length === 21, String(DATA_TABLES.length));
  ok('[数仓] 四层齐全', ['ODS','DWD','DWS','ADS'].every((l) => DATA_TABLES.some((t) => t.layer === l)));
}

/* ---------- 12. 派生指标自洽 ---------- */
{
  const t = totalMetrics();
  eq('[指标] ctr = clicks/impressions', (t.clicks / t.impressions) * 100, (t.clicks / t.impressions) * 100, 1e-9);
  eq('[指标] cpa = spend/conversions', t.spend / t.conversions, t.spend / t.conversions, 1e-9);
  ok('[指标] roi 合理区间', t.gmv / t.spend > 1.5 && t.gmv / t.spend < 8, String(t.gmv / t.spend));
  ok('[指标] cpa 合理区间', t.spend / t.conversions > 20 && t.spend / t.conversions < 600);
  ok('[口径] 平台数 6', PLATFORMS.length === 6);
  ok('[口径] 账户覆盖 6 平台', new Set(ACCOUNTS.map((a) => a.platform as PlatformCode)).size === 6);
  ok('[口径] 平台均带口径说明', PLATFORMS.every((p) => p.caliber.length > 8));
  ok('[口径] 期间一致', CURRENT_PERIOD === '2026-10');
}

/* ---------- 13. 行级合理性 ---------- */
{
  for (const r of DAILY) {
    if (!(r.clicks <= r.impressions)) failures.push(`[行级] ${r.accountId} ${r.date} 点击>曝光`);
    else pass++;
    if (!(r.conversions <= r.clicks)) failures.push(`[行级] ${r.accountId} ${r.date} 转化>点击`);
    else pass++;
    if (!(r.paidOrders <= r.conversions)) failures.push(`[行级] ${r.accountId} ${r.date} 支付>转化`);
    else pass++;
    if (!(r.gmv >= r.paidOrders * 50)) failures.push(`[行级] ${r.accountId} ${r.date} GMV 异常`);
    else pass++;
    if (r.spend <= 0 || r.impressions <= 0) {
      failures.push(`[行级] ${r.accountId} ${r.date} 消耗/曝光为 0`);
      fail++;
    } else pass++;
  }
  for (const f of failures.filter((x) => x.startsWith('[行级]')).slice(0, 5)) console.log('    ' + f);
}

/* ---------- 14. 账户状态与数据一致 ---------- */
{
  for (const a of ACCOUNTS) {
    const rows = DAILY.filter((r) => r.accountId === a.id);
    if (a.status === 'auth_expired') {
      ok(`[状态一致] ${a.id} 授权过期后无数据`, rows.length < ALL_DATES.length, `${rows.length}/${ALL_DATES.length}`);
    } else if (a.status === 'paused') {
      ok(`[状态一致] ${a.id} 停投账户仍有历史数据`, rows.length > 0);
    } else {
      ok(`[状态一致] ${a.id} 正常账户数据完整`, rows.length === ALL_DATES.length, `${rows.length}/${ALL_DATES.length}`);
    }
  }
}

/* ---------- 输出 ---------- */
const t = totalMetrics();
console.log(`\n断言：${pass} 通过 / ${fail} 失败`);
if (fail) {
  console.log('\n失败明细：');
  for (const f of failures.slice(0, 40)) console.log('  ✗ ' + f);
}
console.log('\n演示数据概览');
console.log(`  消耗 ${fmt(t.spend)} 元 / 转化 ${fmt(t.conversions)} / GMV ${fmt(t.gmv)} 元`);
console.log(`  ROI ${(t.gmv / t.spend).toFixed(2)} / CPA ${(t.spend / t.conversions).toFixed(2)} 元`);
console.log(
  `  账户 ${ACCOUNTS.length} / 计划 ${AD_PLANS.length} / 创意 ${CREATIVES.length} / 素材 ${MATERIALS.length}`,
);
console.log(`  每日行 ${DAILY.length}（${ALL_DATES.length} 天 × ${ACCOUNTS.length} 账户）`);
process.exit(fail ? 1 : 0);
