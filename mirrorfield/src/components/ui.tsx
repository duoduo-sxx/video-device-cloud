import type { CSSProperties, ReactNode } from 'react'
import { Empty, Tag, Tooltip } from 'antd'
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons'

export function PageHeader({
  title,
  desc,
  extra,
  tags,
}: {
  title: string
  desc?: string
  extra?: ReactNode
  tags?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '0.01em', margin: 0 }}>{title}</h1>
          {tags}
        </div>
        {desc && (
          <p style={{ color: 'var(--text-secondary)', fontSize: 12.5, margin: '6px 0 0', lineHeight: 1.6, maxWidth: 880 }}>
            {desc}
          </p>
        )}
      </div>
      {extra && <div className="flex items-center gap-2 shrink-0">{extra}</div>}
    </div>
  )
}

export function SectionCard({
  title,
  extra,
  children,
  padding = 16,
  style,
  className = '',
  bodyStyle,
}: {
  title?: ReactNode
  extra?: ReactNode
  children: ReactNode
  padding?: number
  style?: CSSProperties
  className?: string
  bodyStyle?: CSSProperties
}) {
  return (
    <section className={`card ${className}`} style={style}>
      {(title || extra) && (
        <header
          className="flex items-center justify-between"
          style={{ padding: `12px ${padding}px`, borderBottom: '1px solid var(--border)' }}
        >
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{title}</div>
          {extra && <div className="flex items-center gap-2" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{extra}</div>}
        </header>
      )}
      <div style={{ padding, ...bodyStyle }}>{children}</div>
    </section>
  )
}

export function StatCard({
  label,
  value,
  unit,
  delta,
  hint,
  spark,
  accent = 'var(--brand)',
  onClick,
}: {
  label: string
  value: ReactNode
  unit?: string
  delta?: number
  hint?: string
  spark?: number[]
  accent?: string
  onClick?: () => void
}) {
  const up = (delta ?? 0) >= 0
  return (
    <div
      className="card card-hover"
      onClick={onClick}
      style={{ padding: '14px 16px', cursor: onClick ? 'pointer' : 'default', position: 'relative', overflow: 'hidden' }}
    >
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ width: 6, height: 6, borderRadius: 3, background: accent, opacity: 0.9 }} />
      </div>
      <div className="flex items-end gap-1.5" style={{ marginTop: 8 }}>
        <span className="num" style={{ fontSize: 26, fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
          {value}
        </span>
        {unit && <span style={{ fontSize: 12, color: 'var(--text-tertiary)', paddingBottom: 3 }}>{unit}</span>}
      </div>
      <div className="flex items-center justify-between" style={{ marginTop: 8, minHeight: 18 }}>
        <div className="flex items-center gap-1.5" style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
          {delta !== undefined && (
            <span style={{ color: up ? 'var(--ok)' : 'var(--danger)' }}>
              {up ? <ArrowUpOutlined style={{ fontSize: 10 }} /> : <ArrowDownOutlined style={{ fontSize: 10 }} />} {Math.abs(delta)}%
            </span>
          )}
          {hint && <span>{hint}</span>}
        </div>
        {spark && <MiniSpark data={spark} color={accent} />}
      </div>
    </div>
  )
}

export function MiniSpark({ data, color = 'var(--brand)', width = 72, height = 22 }: { data: number[]; color?: string; width?: number; height?: number }) {
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((v - min) / (max - min || 1)) * (height - 3) - 1.5
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  return (
    <svg width={width} height={height} style={{ opacity: 0.85 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function StatusTag({ map, value }: { map: Record<string, { label: string; color: string }>; value: string }) {
  const item = map[value] ?? { label: value, color: 'default' }
  return (
    <Tag color={item.color} style={{ marginInlineEnd: 0, fontSize: 11.5, lineHeight: '18px', paddingInline: 7, borderRadius: 4 }}>
      {item.label}
    </Tag>
  )
}

export function EmptyState({ text = '暂无数据', action }: { text?: string; action?: ReactNode }) {
  return (
    <div style={{ padding: '36px 0', textAlign: 'center' }}>
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>{text}</span>} />
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  )
}

export function Meter({ value, color = 'var(--brand)', height = 5 }: { value: number; color?: string; height?: number }) {
  return (
    <div style={{ height, borderRadius: height, background: 'rgba(148,163,184,0.18)', overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(100, Math.max(0, value))}%`, height: '100%', background: color, borderRadius: height, transition: 'width .4s ease' }} />
    </div>
  )
}

export function Field({ label, children, width }: { label: string; children: ReactNode; width?: number }) {
  return (
    <div className="flex gap-2" style={{ fontSize: 12.5, lineHeight: 1.9, width }}>
      <span style={{ color: 'var(--text-tertiary)', minWidth: 72, flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--text-primary)' }}>{children}</span>
    </div>
  )
}

export function MetricRow({ items }: { items: { label: string; value: ReactNode; color?: string }[] }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {items.map((i) => (
        <div key={i.label} style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'rgba(148,163,184,0.03)' }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>{i.label}</div>
          <div className="num" style={{ fontSize: 18, fontWeight: 600, marginTop: 4, color: i.color ?? 'var(--text-primary)' }}>{i.value}</div>
        </div>
      ))}
    </div>
  )
}

export function IconBtn({ title, onClick, children, active }: { title: string; onClick?: () => void; children: ReactNode; active?: boolean }) {
  return (
    <Tooltip title={title}>
      <button
        onClick={onClick}
        style={{
          width: 30,
          height: 30,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 6,
          border: '1px solid ' + (active ? 'var(--brand)' : 'var(--border)'),
          background: active ? 'rgba(34,211,238,0.12)' : 'transparent',
          color: active ? 'var(--brand)' : 'var(--text-secondary)',
          cursor: 'pointer',
          transition: 'all .15s',
        }}
      >
        {children}
      </button>
    </Tooltip>
  )
}
