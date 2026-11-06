import { Fragment, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Printer, ShieldCheck } from 'lucide-react'
import { api } from '../mock/api'
import { useAsync } from '../hooks/useAsync'
import { Button } from '../components/ui'
import { Skeleton } from '../components/common'
import { CHANNEL_META, GRADE_META, SEVERITY_META, SEVERITY_ORDER } from '../lib/constants'
import { dateTime, duration, gb, timecode } from '../lib/format'
import { MEMBER_MAP } from '../mock/build'
import type { Severity } from '../types'

const TYPE_LABEL = { qc: '技术质量检测报告', repair: '修复验收报告', acceptance: '交付验收单', service: '技术服务交付报告' }

export default function ReportDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, loading } = useAsync(async () => {
    const report = await api.getReport(id!)
    if (!report) return { report: undefined }
    const task = await api.getTask(report.taskId)
    const defects = task ? await api.taskDefects(task.id) : []
    const asset = task ? await api.getAsset(task.assetId) : undefined
    const repair = report.repairTaskId ? await api.getRepair(report.repairTaskId) : undefined
    return { report, task, defects, asset, repair }
  }, [id])

  const { report, task, asset, repair } = data ?? {}
  const defects = data?.defects ?? []

  const grouped = useMemo(() => {
    return SEVERITY_ORDER.map((sev) => ({
      sev,
      items: defects.filter((d) => d.severity === sev),
    })).filter((g) => g.items.length > 0)
  }, [defects])

  const channelStats = useMemo(() => {
    const keys = ['video', 'audio', 'container', 'subtitle'] as const
    return keys.map((ch) => ({
      ch,
      count: defects.filter((d) => d.channel === ch).length,
      fatal: defects.filter((d) => d.channel === ch && d.severity === 'fatal').length,
    }))
  }, [defects])

  if (loading || !report) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-[760px]" />
      </div>
    )
  }

  const p = {
    bg: '#fbfaf6',
    ink: '#1b2027',
    sub: '#4c5563',
    line: '#dcdfd8',
    soft: '#f1f0ea',
  }

  return (
    <div>
      <div className="no-print mb-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/reports')}>
          <ArrowLeft size={14} /> 返回报告中心
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[var(--text-3)]">A4 · {report.pages} 页 · 电子签章有效</span>
          <Button onClick={() => navigate(`/detection/${report.taskId}`)}>查看检测任务</Button>
          <Button variant="primary" onClick={() => window.print()}>
            <Printer size={14} /> 打印 / 另存 PDF
          </Button>
        </div>
      </div>

      <div
        className="report-paper mx-auto w-full max-w-[820px] px-[46px] py-[44px] shadow-layer"
        style={{ background: p.bg, color: p.ink }}
      >
        {/* 抬头 */}
        <div className="flex items-start justify-between border-b pb-4" style={{ borderColor: p.line }}>
          <div>
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded text-[13px] font-semibold"
                style={{ background: '#0f3f47', color: '#c9f4fa' }}
              >
                AV
              </div>
              <div>
                <div className="text-[15px] font-semibold tracking-wide">AV Repair Studio · 音视频技术质量中心</div>
                <div className="text-[11px]" style={{ color: p.sub }}>
                  自动化修补平台 / 第三方技术质检
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px]" style={{ color: p.sub }}>
              报告编号
            </div>
            <div className="mono text-[13px]">{report.no}</div>
            <div className="mt-1 text-[11px]" style={{ color: p.sub }}>
              出具日期 {dateTime(report.issuedAt)}
            </div>
          </div>
        </div>

        <h1 className="mt-5 text-center text-[19px] font-semibold tracking-wide">{TYPE_LABEL[report.type]}</h1>
        <p className="mt-1 text-center text-[12px]" style={{ color: p.sub }}>
          {report.title}
        </p>

        {/* 基本信息 */}
        <SectionTitle p={p} index="一" title="基本信息" />
        <table className="w-full border-collapse text-[12px]">
          <tbody>
            {[
              [
                { k: '项目名称', v: report.projectName },
                { k: '素材名称', v: report.assetName },
              ],
              [
                { k: '文件格式', v: asset ? `${asset.container} / ${asset.videoCodec ?? '—'}` : '—' },
                { k: '分辨率 / 帧率', v: asset ? `${asset.width}×${asset.height} · ${asset.fps}fps ${asset.scan ?? 'p'}` : '—' },
              ],
              [
                { k: '时长 / 大小', v: asset ? `${duration(asset.durationSec)} · ${gb(asset.sizeGB)}` : '—' },
                { k: '码率', v: asset ? `${asset.bitrateMbps.toFixed(1)} Mbps` : '—' },
              ],
              [
                { k: '检测规则集', v: task?.ruleSetName ?? '—' },
                { k: '检测完成时间', v: task?.finishedAt ? dateTime(task.finishedAt) : '—' },
              ],
              [
                { k: '检测人', v: task ? MEMBER_MAP[task.operatorId]?.name ?? '—' : '—' },
                { k: '出具人 / 职务', v: `${report.issuedBy} · ${MEMBER_MAP[['m6', 'm7', 'm8'][report.id.length % 3]]?.title ?? '质检'}` },
              ],
            ].map((row, i) => (
              <tr key={i}>
                {row.map((cell) => (
                  <Fragment key={cell.k}>
                    <th
                      className="w-[92px] border px-2.5 py-[7px] text-left font-normal"
                      style={{ borderColor: p.line, background: p.soft, color: p.sub }}
                    >
                      {cell.k}
                    </th>
                    <td className="border px-2.5 py-[7px]" style={{ borderColor: p.line }}>
                      {cell.v}
                    </td>
                  </Fragment>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* 结论 */}
        <SectionTitle p={p} index="二" title="综合结论" />
        <div className="flex items-stretch gap-3">
          <div
            className="flex w-[132px] shrink-0 flex-col items-center justify-center rounded border py-3"
            style={{ borderColor: p.line, background: p.soft }}
          >
            <div className="mono text-[32px] font-semibold leading-none" style={{ color: GRADE_META[report.grade].color }}>
              {report.score.toFixed(1)}
            </div>
            <div className="mt-1 text-[11px]" style={{ color: p.sub }}>
              综合评分
            </div>
            <div
              className="mt-1.5 rounded px-2 py-0.5 text-[11px]"
              style={{ color: GRADE_META[report.grade].color, background: '#fff', border: `1px solid ${p.line}` }}
            >
              {report.grade} 级 · {GRADE_META[report.grade].label}
            </div>
          </div>
          <div className="flex-1 rounded border px-3.5 py-3 text-[12px] leading-6" style={{ borderColor: p.line }}>
            <div className="mb-1 font-medium">判定结论</div>
            <p style={{ color: p.sub }}>{report.summary}</p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {[
                { k: '致命', v: defects.filter((d) => d.severity === 'fatal').length },
                { k: '严重', v: defects.filter((d) => d.severity === 'severe').length },
                { k: '一般', v: defects.filter((d) => d.severity === 'moderate').length },
                { k: '提示', v: defects.filter((d) => d.severity === 'info').length },
              ].map((s) => (
                <div key={s.k} className="rounded px-2 py-1.5" style={{ background: p.soft }}>
                  <div className="text-[10px]" style={{ color: p.sub }}>
                    {s.k}
                  </div>
                  <div className="mono text-[14px]">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 技术指标 */}
        <SectionTitle p={p} index="三" title="关键技术指标" />
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr style={{ background: p.soft, color: p.sub }}>
              {['指标项', '实测值', '标准 / 阈值', '判定'].map((h) => (
                <th key={h} className="border px-2.5 py-[6px] text-left font-normal" style={{ borderColor: p.line }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { k: '视频多方法融合质量（VMAF）', v: report.type === 'repair' && repair ? repair.scoreAfter.toFixed(1) : (68 + (report.id.length % 9)).toFixed(1), t: '≥ 80', ok: report.score >= 80 },
              { k: '峰值信噪比（PSNR）', v: '38.4 dB', t: '≥ 35 dB', ok: true },
              { k: '结构相似度（SSIM）', v: '0.962', t: '≥ 0.950', ok: true },
              { k: '积分响度', v: `${(asset?.loudnessLufs ?? -24).toFixed(1)} LKFS`, t: '-24 ± 2 LKFS', ok: Math.abs((asset?.loudnessLufs ?? -24) + 24) <= 2 },
              { k: '真峰值', v: `${(asset?.truePeakDb ?? -1.2).toFixed(1)} dBTP`, t: '≤ -1.0 dBTP', ok: (asset?.truePeakDb ?? -1.2) <= -1 },
              { k: '音画同步偏差', v: `${(24 + (defects.length % 60))} ms`, t: '≤ ±80 ms', ok: 24 + (defects.length % 60) <= 80 },
              { k: '黑场 / 静音帧', v: `${defects.filter((d) => d.code.includes('BLK')).length} 处`, t: '按场景白名单', ok: defects.filter((d) => d.code.includes('BLK')).length < 4 },
            ].map((row) => (
              <tr key={row.k}>
                <td className="border px-2.5 py-[7px]" style={{ borderColor: p.line }}>
                  {row.k}
                </td>
                <td className="mono border px-2.5 py-[7px]" style={{ borderColor: p.line }}>
                  {row.v}
                </td>
                <td className="mono border px-2.5 py-[7px]" style={{ borderColor: p.line, color: p.sub }}>
                  {row.t}
                </td>
                <td className="border px-2.5 py-[7px]" style={{ borderColor: p.line }}>
                  <span style={{ color: row.ok ? '#0f7a52' : '#b3382f' }}>{row.ok ? '合格' : '不合格'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 缺陷汇总 */}
        <SectionTitle p={p} index="四" title="缺陷分布" />
        <div className="grid grid-cols-4 gap-2">
          {channelStats.map((c) => (
            <div key={c.ch} className="rounded border px-2.5 py-2" style={{ borderColor: p.line }}>
              <div className="flex items-center justify-between">
                <span className="text-[11px]" style={{ color: p.sub }}>
                  {CHANNEL_META[c.ch].label}
                </span>
                <span className="mono text-[14px]">{c.count}</span>
              </div>
              <div className="mt-1.5 h-1 w-full rounded-full" style={{ background: p.soft }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(100, (c.count / Math.max(1, defects.length)) * 100)}%`, background: CHANNEL_META[c.ch].color }}
                />
              </div>
              {c.fatal > 0 && (
                <div className="mt-1 text-[10px]" style={{ color: '#b3382f' }}>
                  致命 {c.fatal} 条
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 缺陷明细 */}
        <SectionTitle p={p} index="五" title="缺陷明细（前 14 条，完整清单见附表）" />
        <table className="w-full border-collapse text-[11.5px]">
          <thead>
            <tr style={{ background: p.soft, color: p.sub }}>
              {['#', '时间码', '缺陷', '通道', '等级', '实测 / 阈值', '建议处理'].map((h) => (
                <th key={h} className="border px-2 py-[6px] text-left font-normal" style={{ borderColor: p.line }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {defects.slice(0, 14).map((d, i) => (
              <tr key={d.id} className="avoid-break">
                <td className="mono border px-2 py-[5px]" style={{ borderColor: p.line, color: p.sub }}>
                  {i + 1}
                </td>
                <td className="mono border px-2 py-[5px]" style={{ borderColor: p.line }}>
                  {timecode(d.startSec, asset?.fps ?? 25)}
                </td>
                <td className="border px-2 py-[5px]" style={{ borderColor: p.line }}>
                  <span className="mono mr-1 text-[10px]" style={{ color: p.sub }}>
                    {d.code}
                  </span>
                  {d.name}
                </td>
                <td className="border px-2 py-[5px]" style={{ borderColor: p.line, color: p.sub }}>
                  {CHANNEL_META[d.channel].label}
                </td>
                <td className="border px-2 py-[5px]" style={{ borderColor: p.line }}>
                  <span style={{ color: SEVERITY_META[d.severity as Severity].color }}>{SEVERITY_META[d.severity].label}</span>
                </td>
                <td className="mono border px-2 py-[5px]" style={{ borderColor: p.line }}>
                  {d.metricValue} / {d.threshold} {d.unit}
                </td>
                <td className="border px-2 py-[5px]" style={{ borderColor: p.line, color: p.sub }}>
                  {d.suggestion}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-1.5 text-[10.5px]" style={{ color: p.sub }}>
          注：完整缺陷清单共 {defects.length} 条，按严重度与时间码排序，见报告附表 A。
        </div>

        {/* 建议 */}
        <SectionTitle p={p} index="六" title="处理建议" />
        <div className="space-y-1.5 text-[12px] leading-6" style={{ color: p.sub }}>
          {grouped.slice(0, 4).map((g) => (
            <div key={g.sev} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: SEVERITY_META[g.sev].color }} />
              <span>
                <b style={{ color: p.ink }}>{SEVERITY_META[g.sev].label}级 {g.items.length} 条</b>：涉及
                {Array.from(new Set(g.items.map((d) => d.name)))
                  .slice(0, 3)
                  .join('、')}
                ，建议{SEVERITY_META[g.sev].weight >= 4 ? '优先处理，修复后须复检' : '在交付前统一处理'}。
              </span>
            </div>
          ))}
          <div className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: '#0f3f47' }} />
            <span>
              整体建议：{report.score >= 90 ? '可直接交付，无需返工。' : report.score >= 75 ? '完成一般与提示级处理后交付。' : '须完成致命 / 严重级修复并复检通过后方可交付。'}
            </span>
          </div>
        </div>

        {/* 签章 */}
        <div className="avoid-break mt-6 grid grid-cols-3 gap-4 border-t pt-4" style={{ borderColor: p.line }}>
          <div>
            <div className="text-[11px]" style={{ color: p.sub }}>
              检测 / 修复工程师
            </div>
            <div className="mt-5 border-b pb-1 text-[12px]" style={{ borderColor: p.ink }}>
              {task ? MEMBER_MAP[task.operatorId]?.name ?? '—' : '—'}
            </div>
          </div>
          <div>
            <div className="text-[11px]" style={{ color: p.sub }}>
              质检签署
            </div>
            <div className="mt-5 border-b pb-1 text-[12px]" style={{ borderColor: p.ink }}>
              {report.issuedBy}
            </div>
          </div>
          <div>
            <div className="text-[11px]" style={{ color: p.sub }}>
              出具单位（电子签章）
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <ShieldCheck size={26} style={{ color: '#0f7a52' }} />
              <div>
                <div className="text-[11px]" style={{ color: '#0f7a52' }}>
                  AVRS 技术质量中心
                </div>
                <div className="mono text-[9.5px]" style={{ color: p.sub }}>
                  {report.no} · 已存证
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t pt-2.5 text-[10px]" style={{ borderColor: p.line, color: p.sub }}>
          <span>本报告数据由 AV Repair Studio 自动采集，评分公式见《技术质量评分规范 v3.2》</span>
          <span className="mono">第 1 / {report.pages} 页</span>
        </div>
      </div>

      <div className="no-print mt-4 flex items-center justify-center gap-2 text-[11px] text-[var(--text-3)]">
        <CheckCircle2 size={12} className="text-[var(--success)]" />
        报告与任务数据一致：{defects.length} 条缺陷，评分 {report.score} 分
      </div>
    </div>
  )
}

function SectionTitle({ p, index, title }: { p: { ink: string; line: string; sub: string }; index: string; title: string }) {
  return (
    <div className="mb-2 mt-5 flex items-center gap-2 border-b pb-1.5" style={{ borderColor: p.line }}>
      <span
        className="flex h-4 w-4 items-center justify-center rounded-sm text-[10px]"
        style={{ background: '#0f3f47', color: '#c9f4fa' }}
      >
        {index}
      </span>
      <span className="text-[13px] font-medium" style={{ color: p.ink }}>
        {title}
      </span>
    </div>
  )
}
