import React, {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { X, Check, AlertCircle, Info, ChevronLeft, ChevronRight, Search, Loader2 } from 'lucide-react'
import { cn } from '../lib/utils'

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  className,
  loading,
  icon,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
  icon?: React.ReactNode
}) {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-ctl font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap select-none'
  const variants: Record<string, string> = {
    primary: 'bg-brand text-white hover:bg-brand-hover',
    secondary:
      'bg-surface text-t1 border border-line hover:bg-hover hover:border-line-strong',
    ghost: 'text-t2 hover:bg-hover hover:text-t1',
    danger: 'bg-danger text-white hover:opacity-90',
    soft: 'bg-brand-soft text-brand hover:opacity-80',
  }
  const sizes: Record<string, string> = {
    sm: 'h-7 px-2.5 text-xs',
    md: 'h-8 px-3 text-sm',
    lg: 'h-9 px-4 text-sm',
    icon: 'h-8 w-8',
  }
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  )
}

export function Card({
  children,
  className,
  hover,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-card border border-line bg-surface',
        hover && 'transition-colors hover:border-line-strong',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

export function SectionTitle({
  title,
  desc,
  extra,
  className,
}: {
  title: string
  desc?: string
  extra?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-3 flex items-end justify-between gap-3', className)}>
      <div>
        <h2 className="text-[15px] font-medium text-t1">{title}</h2>
        {desc && <p className="mt-0.5 text-xs text-t3">{desc}</p>}
      </div>
      {extra}
    </div>
  )
}

export function PageHeader({
  title,
  desc,
  extra,
  back,
}: {
  title: string
  desc?: string
  extra?: React.ReactNode
  back?: React.ReactNode
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {back}
        <div>
          <h1 className="text-xl font-medium tracking-tight text-t1">{title}</h1>
          {desc && <p className="mt-1 max-w-2xl text-sm text-t2">{desc}</p>}
        </div>
      </div>
      {extra && <div className="flex shrink-0 items-center gap-2">{extra}</div>}
    </div>
  )
}

export function Badge({
  children,
  color = 'var(--text-secondary)',
  bg,
  className,
  dot,
}: {
  children: React.ReactNode
  color?: string
  bg?: string
  className?: string
  dot?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] leading-4',
        className,
      )}
      style={{ color, background: bg ?? 'var(--bg-subtle)' }}
    >
      {dot && (
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      )}
      {children}
    </span>
  )
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; pulse?: boolean }> = {
  pending: { label: '待解析', color: 'var(--text-secondary)', bg: 'var(--bg-subtle)' },
  analyzing: { label: '解析中', color: 'var(--brand)', bg: 'var(--brand-soft)', pulse: true },
  completed: { label: '已完成', color: 'var(--success)', bg: 'rgba(22,163,74,.10)' },
  failed: { label: '失败', color: 'var(--danger)', bg: 'rgba(220,38,38,.10)' },
  paused: { label: '已暂停', color: 'var(--warning)', bg: 'rgba(217,119,6,.10)' },
}

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.pending
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] leading-4"
      style={{ color: s.color, background: s.bg }}
    >
      <span
        className={cn('h-1.5 w-1.5 rounded-full', s.pulse && 'animate-pulseDot')}
        style={{ background: s.color }}
      />
      {s.label}
    </span>
  )
}

export function Input({
  className,
  icon,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }) {
  return (
    <div className={cn('relative', className)}>
      {icon && (
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-t3">
          {icon}
        </span>
      )}
      <input
        className={cn(
          'h-8 w-full rounded-ctl border border-line bg-surface px-2.5 text-sm text-t1 outline-none transition-colors placeholder:text-t3',
          'focus:border-brand focus:ring-2 focus:ring-brand/10',
          icon && 'pl-8',
        )}
        {...rest}
      />
    </div>
  )
}

export function Textarea({
  className,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-ctl border border-line bg-surface px-2.5 py-2 text-sm text-t1 outline-none transition-colors placeholder:text-t3',
        'focus:border-brand focus:ring-2 focus:ring-brand/10',
        className,
      )}
      {...rest}
    />
  )
}

export function Select({
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-8 rounded-ctl border border-line bg-surface px-2 pr-7 text-sm text-t1 outline-none transition-colors',
        'focus:border-brand focus:ring-2 focus:ring-brand/10',
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  )
}

export function Checkbox({
  checked,
  onChange,
  label,
  indeterminate,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: React.ReactNode
  indeterminate?: boolean
}) {
  return (
    <label className="inline-flex cursor-pointer select-none items-center gap-2 text-sm text-t1">
      <span
        onClick={(e) => {
          e.preventDefault()
          onChange(!checked)
        }}
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
          checked || indeterminate
            ? 'border-brand bg-brand text-white'
            : 'border-line-strong bg-surface',
        )}
      >
        {indeterminate && !checked ? (
          <span className="h-0.5 w-2 rounded bg-white" />
        ) : checked ? (
          <Check size={11} strokeWidth={3} />
        ) : null}
      </span>
      {label}
    </label>
  )
}

export function Switch({
  checked,
  onChange,
  size = 'md',
}: {
  checked: boolean
  onChange: (v: boolean) => void
  size?: 'sm' | 'md'
}) {
  const w = size === 'sm' ? 'w-8 h-4' : 'w-9 h-5'
  const k = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
  const t = checked ? (size === 'sm' ? 'translate-x-4' : 'translate-x-4') : 'translate-x-0.5'
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'relative shrink-0 rounded-full transition-colors',
        w,
        checked ? 'bg-brand' : 'bg-line-strong',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 rounded-full bg-white shadow-sm transition-transform duration-150',
          k,
          t,
        )}
      />
    </button>
  )
}

export function Progress({
  value,
  color = 'var(--brand)',
  height = 4,
  className,
  showLabel,
}: {
  value: number
  color?: string
  height?: number
  className?: string
  showLabel?: boolean
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className="w-full overflow-hidden rounded-full"
        style={{ height, background: 'var(--bg-subtle)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
        />
      </div>
      {showLabel && <span className="num shrink-0 text-[11px] text-t3">{Math.round(value)}%</span>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-md', className)} />
}

export function SkeletonTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-ctl border border-line px-3 py-3">
          <Skeleton className="h-10 w-16" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  desc,
  action,
  className,
}: {
  icon?: React.ReactNode
  title: string
  desc?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-subtle text-t3">
        {icon ?? <Info size={20} />}
      </div>
      <p className="text-sm font-medium text-t1">{title}</p>
      {desc && <p className="mt-1 max-w-sm text-xs leading-5 text-t3">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

function Portal({ children }: { children: React.ReactNode }) {
  return createPortal(children, document.body)
}

export function Dialog({
  open,
  onClose,
  title,
  desc,
  children,
  footer,
  width = 560,
}: {
  open: boolean
  onClose: () => void
  title: string
  desc?: string
  children?: React.ReactNode
  footer?: React.ReactNode
  width?: number
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <Portal>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-black/35 animate-fade-in" onClick={onClose} />
        <div
          className="relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-card border border-line bg-elevated shadow-2xl animate-scale-in"
          style={{ maxWidth: width }}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div>
              <h3 className="text-[15px] font-medium text-t1">{title}</h3>
              {desc && <p className="mt-1 text-xs text-t3">{desc}</p>}
            </div>
            <button onClick={onClose} className="rounded p-1 text-t3 hover:bg-hover hover:text-t1">
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-auto px-5 py-4">{children}</div>
          {footer && (
            <div className="flex items-center justify-end gap-2 border-t border-line bg-subtle/50 px-5 py-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </Portal>
  )
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  width = 480,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
  width?: number
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <Portal>
      <div className="fixed inset-0 z-[80]">
        <div className="absolute inset-0 bg-black/30 animate-fade-in" onClick={onClose} />
        <div
          className="absolute right-0 top-0 flex h-full w-full flex-col border-l border-line bg-elevated shadow-2xl animate-slide-left"
          style={{ maxWidth: width }}
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h3 className="text-sm font-medium text-t1">{title}</h3>
            <button onClick={onClose} className="rounded p-1 text-t3 hover:bg-hover hover:text-t1">
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-auto">{children}</div>
          {footer && <div className="border-t border-line px-4 py-3">{footer}</div>}
        </div>
      </div>
    </Portal>
  )
}

export function Tabs({
  tabs,
  value,
  onChange,
  className,
  variant = 'line',
}: {
  tabs: { key: string; label: string; count?: number }[]
  value: string
  onChange: (k: string) => void
  className?: string
  variant?: 'line' | 'pill'
}) {
  if (variant === 'pill') {
    return (
      <div className={cn('inline-flex items-center gap-1 rounded-ctl bg-subtle p-1', className)}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs transition-colors',
              value === t.key
                ? 'bg-surface text-t1 shadow-sm'
                : 'text-t2 hover:text-t1',
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="num ml-1 text-[10px] text-t3">{t.count}</span>
            )}
          </button>
        ))}
      </div>
    )
  }
  return (
    <div className={cn('flex items-center gap-0 border-b border-line', className)}>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            'relative -mb-px whitespace-nowrap px-3 py-2 text-sm transition-colors',
            value === t.key
              ? 'border-b-2 border-brand font-medium text-brand'
              : 'border-b-2 border-transparent text-t2 hover:text-t1',
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span className="num ml-1 text-[11px] text-t3">{t.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: React.ReactNode }[]
  value: T
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div className={cn('inline-flex rounded-ctl border border-line bg-subtle p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-[6px] px-2.5 py-1 text-xs transition-colors',
            value === o.value ? 'bg-surface text-t1 shadow-sm' : 'text-t2 hover:text-t1',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Tooltip({
  content,
  children,
  side = 'top',
}: {
  content: React.ReactNode
  children: React.ReactNode
  side?: 'top' | 'bottom'
}) {
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span
        className={cn(
          'pointer-events-none absolute left-1/2 z-50 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-t1 px-2 py-1 text-[11px] font-normal leading-4 text-white shadow-lg group-hover/tt:block',
          side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
        )}
      >
        {content}
      </span>
    </span>
  )
}

export function ConfidenceBar({ value, width = 56 }: { value: number; width?: number }) {
  const color =
    value >= 0.9 ? 'var(--success)' : value >= 0.75 ? 'var(--brand)' : value >= 0.65 ? 'var(--warning)' : 'var(--danger)'
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-1 w-10 overflow-hidden rounded-full" style={{ background: 'var(--bg-subtle)', width }}>
        <span className="block h-full rounded-full" style={{ width: `${value * 100}%`, background: color }} />
      </span>
      <span className="num text-[11px] text-t2">{(value * 100).toFixed(0)}%</span>
    </span>
  )
}

export function Pagination({
  page,
  pageSize,
  total,
  onPage,
  onPageSize,
}: {
  page: number
  pageSize: number
  total: number
  onPage: (p: number) => void
  onPageSize?: (s: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const nums: number[] = []
  const start = Math.max(1, page - 2)
  const end = Math.min(pages, start + 4)
  for (let i = start; i <= end; i++) nums.push(i)
  return (
    <div className="flex items-center justify-between gap-3 pt-3">
      <div className="flex items-center gap-3 text-xs text-t3">
        <span>
          共 <span className="num text-t2">{total}</span> 条
        </span>
        {onPageSize && (
          <select
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            className="h-6 rounded border border-line bg-surface px-1 text-xs text-t2"
          >
            {[12, 24, 48].map((n) => (
              <option key={n} value={n}>
                {n} 条/页
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-t2 disabled:opacity-40 hover:bg-hover"
        >
          <ChevronLeft size={14} />
        </button>
        {nums.map((n) => (
          <button
            key={n}
            onClick={() => onPage(n)}
            className={cn(
              'num h-7 min-w-7 rounded-md px-1.5 text-xs transition-colors',
              n === page
                ? 'bg-brand text-white'
                : 'border border-line text-t2 hover:bg-hover',
            )}
          >
            {n}
          </button>
        ))}
        <button
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-t2 disabled:opacity-40 hover:bg-hover"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder = '搜索…',
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      icon={<Search size={13} />}
      className={className}
    />
  )
}

export function MetricCard({
  label,
  value,
  unit,
  delta,
  deltaGood = 'up',
  spark,
  icon,
}: {
  label: string
  value: string
  unit?: string
  delta?: number
  deltaGood?: 'up' | 'down'
  spark?: number[]
  icon?: React.ReactNode
}) {
  const positive = delta !== undefined && delta > 0
  const good = delta === undefined ? true : deltaGood === 'up' ? positive : !positive
  const color = delta === undefined ? 'var(--text-tertiary)' : good ? 'var(--success)' : 'var(--danger)'
  const path = spark
    ? spark
        .map((v, i) => {
          const max = Math.max(...spark)
          const min = Math.min(...spark)
          const x = (i / (spark.length - 1)) * 100
          const y = 24 - ((v - min) / Math.max(1, max - min)) * 20
          return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
        })
        .join(' ')
    : null
  return (
    <Card className="p-4" hover>
      <div className="flex items-start justify-between">
        <span className="text-xs text-t2">{label}</span>
        {icon && <span className="text-t3">{icon}</span>}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="num text-[26px] font-medium leading-none tracking-tight text-t1">{value}</span>
        {unit && <span className="text-xs text-t3">{unit}</span>}
      </div>
      <div className="mt-2.5 flex items-end justify-between">
        {delta !== undefined ? (
          <span className="num inline-flex items-center gap-0.5 text-[11px]" style={{ color }}>
            {positive ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}%
            <span className="ml-1 text-t3">环比</span>
          </span>
        ) : (
          <span className="text-[11px] text-t3">—</span>
        )}
        {path && (
          <svg width="72" height="26" viewBox="0 0 100 26" className="shrink-0 opacity-80">
            <path d={path} fill="none" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </div>
    </Card>
  )
}

type ToastKind = 'success' | 'error' | 'info'
interface ToastItem {
  id: number
  msg: string
  kind: ToastKind
}

let toastSeq = 0
const toastListeners = new Set<(list: ToastItem[]) => void>()
let toastList: ToastItem[] = []

function emit() {
  toastListeners.forEach((fn) => fn([...toastList]))
}

export function toast(msg: string, kind: ToastKind = 'success') {
  const item = { id: ++toastSeq, msg, kind }
  toastList = [...toastList, item]
  emit()
  setTimeout(() => {
    toastList = toastList.filter((t) => t.id !== item.id)
    emit()
  }, 2800)
}

export function Toaster() {
  const [list, setList] = useState<ToastItem[]>([])
  useEffect(() => {
    toastListeners.add(setList)
    return () => {
      toastListeners.delete(setList)
    }
  }, [])
  return createPortal(
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2">
      {list.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-2 rounded-ctl border border-line bg-elevated px-3.5 py-2.5 text-sm text-t1 shadow-lg animate-fade-in"
        >
          {t.kind === 'success' && <Check size={15} color="var(--success)" />}
          {t.kind === 'error' && <AlertCircle size={15} color="var(--danger)" />}
          {t.kind === 'info' && <Info size={15} color="var(--info)" />}
          {t.msg}
        </div>
      ))}
    </div>,
    document.body,
  )
}

export function Tag({ children, onRemove }: { children: React.ReactNode; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-subtle px-2 py-0.5 text-[11px] text-t2">
      {children}
      {onRemove && (
        <button onClick={onRemove} className="text-t3 hover:text-danger">
          <X size={10} />
        </button>
      )}
    </span>
  )
}

export function TagInput({
  value,
  onChange,
  placeholder = '输入后按回车添加',
}: {
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
}) {
  const [text, setText] = useState('')
  const id = useId()
  return (
    <div className="flex min-h-8 flex-wrap items-center gap-1.5 rounded-ctl border border-line bg-surface px-2 py-1">
      {value.map((t) => (
        <Tag key={t} onRemove={() => onChange(value.filter((x) => x !== t))}>
          {t}
        </Tag>
      ))}
      <input
        id={id}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && text.trim()) {
            e.preventDefault()
            if (!value.includes(text.trim())) onChange([...value, text.trim()])
            setText('')
          }
          if (e.key === 'Backspace' && !text && value.length) {
            onChange(value.slice(0, -1))
          }
        }}
        placeholder={placeholder}
        className="min-w-[120px] flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-t3"
      />
    </div>
  )
}

export function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs text-t2">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-t3">{hint}</p>}
    </div>
  )
}

export function useClickOutside<T extends HTMLElement>(handler: () => void) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handler()
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [handler])
  return ref
}

export const PopoverCtx = createContext<{ close: () => void }>({ close: () => {} })
export const usePopover = () => useContext(PopoverCtx)
