import React, { useEffect } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { cn } from '../lib/utils'
import type { Tone } from '../lib/constants'

/* ---------------------------------------------------------------- 按钮 */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle'
type ButtonSize = 'sm' | 'md' | 'lg'

const buttonVariant: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover border border-transparent',
  secondary: 'bg-surface2 text-ink border border-line hover:border-[#333c4c] hover:bg-[#1b2029]',
  ghost: 'bg-transparent text-muted border border-transparent hover:bg-surface2 hover:text-ink',
  danger: 'bg-[rgba(244,82,92,0.12)] text-[#ff7b83] border border-[rgba(244,82,92,0.28)] hover:bg-[rgba(244,82,92,0.18)]',
  subtle: 'bg-[#1a1f29] text-muted border border-line-subtle hover:text-ink',
}

const buttonSize: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[12px] gap-1.5 rounded-md',
  md: 'h-9 px-3.5 text-[13px] gap-2 rounded-md',
  lg: 'h-10 px-4 text-[13px] gap-2 rounded-md',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  className,
  children,
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: React.ReactNode
  loading?: boolean
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors duration-150 focus-ring disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap',
        buttonVariant[variant],
        buttonSize[size],
        className,
      )}
      {...props}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  )
}

export function IconButton({
  className,
  children,
  active,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-muted transition-colors hover:bg-surface2 hover:text-ink focus-ring',
        active && 'bg-surface2 text-ink',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn('h-3.5 w-3.5 animate-spin', className)} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

/* ---------------------------------------------------------------- 徽标 */

export function Badge({
  tone = 'neutral',
  children,
  dot,
  className,
}: {
  tone?: Tone
  children: React.ReactNode
  dot?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-[3px] text-[11px] font-medium leading-none whitespace-nowrap',
        `tone-${tone}`,
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

export function StatusDot({ tone = 'success' }: { tone?: Tone }) {
  const color =
    tone === 'success' ? 'var(--success)' : tone === 'warning' ? 'var(--warning)' : tone === 'danger' ? 'var(--danger)' : tone === 'primary' ? 'var(--primary)' : 'var(--text-dim)'
  return <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: color }} />
}

/* ---------------------------------------------------------------- 容器 */

export function Panel({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('panel', className)} {...props}>
      {children}
    </div>
  )
}

export function SectionHeader({
  title,
  desc,
  action,
  className,
}: {
  title: string
  desc?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div>
        <div className="text-[14px] font-medium text-ink">{title}</div>
        {desc && <div className="mt-1 text-[12px] text-dim">{desc}</div>}
      </div>
      {action}
    </div>
  )
}

/* ---------------------------------------------------------------- 表单 */

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-9 w-full rounded-md border border-line bg-[#0d1017] px-3 text-[13px] text-ink placeholder:text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40 transition-colors',
        className,
      )}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-md border border-line bg-[#0d1017] px-3 py-2 text-[13px] text-ink placeholder:text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40',
        className,
      )}
      {...props}
    />
  )
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          'h-9 w-full appearance-none rounded-md border border-line bg-[#0d1017] pl-3 pr-8 text-[13px] text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dim" />
    </div>
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder = '搜索',
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dim" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-md border border-line bg-[#0d1017] pl-9 pr-8 text-[13px] text-ink placeholder:text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-dim hover:text-ink"
          aria-label="清空搜索"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-5 w-9 shrink-0 rounded-full border transition-colors focus-ring',
        checked ? 'border-primary bg-primary' : 'border-line bg-[#1c2230]',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-transform',
          checked ? 'translate-x-[19px]' : 'translate-x-[3px]',
        )}
      />
    </button>
  )
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  hint,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (v: number) => void
  hint?: string
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] text-muted">{label}</span>
        <span className="mono text-[12px] text-ink">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        aria-label={label}
      />
      {hint && <div className="mt-1.5 text-[11px] text-dim">{hint}</div>}
    </div>
  )
}

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-2 text-[13px] text-muted hover:text-ink">
      <span
        className={cn(
          'flex h-4 w-4 items-center justify-center rounded border transition-colors',
          checked ? 'border-primary bg-primary text-white' : 'border-line bg-[#0d1017]',
        )}
      >
        {checked && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      {label}
    </button>
  )
}

/* ---------------------------------------------------------------- 进度 */

export function Progress({
  value,
  tone = 'primary',
  animated,
  className,
}: {
  value: number
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'muted'
  animated?: boolean
  className?: string
}) {
  const color =
    tone === 'success'
      ? 'var(--success)'
      : tone === 'warning'
        ? 'var(--warning)'
        : tone === 'danger'
          ? 'var(--danger)'
          : tone === 'muted'
            ? 'var(--text-dim)'
            : 'var(--primary)'
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-[#1c2230]', className)}>
      <div
        className="relative h-full rounded-full transition-[width] duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
      >
        {animated && (
          <span className="absolute inset-0 overflow-hidden rounded-full">
            <span className="absolute inset-y-0 w-8 animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </span>
        )}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- 标签页 */

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: { key: T; label: string; count?: number }[]
  value: T
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-1 border-b border-line', className)}>
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => onChange(it.key)}
          className={cn(
            'relative -mb-px flex items-center gap-1.5 px-3 py-2.5 text-[13px] transition-colors',
            value === it.key ? 'text-ink' : 'text-muted hover:text-ink',
          )}
        >
          {it.label}
          {typeof it.count === 'number' && (
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] tnum',
                value === it.key ? 'bg-[rgba(61,125,255,0.16)] text-[#8db3ff]' : 'bg-[#1b212c] text-dim',
              )}
            >
              {it.count}
            </span>
          )}
          {value === it.key && <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-primary" />}
        </button>
      ))}
    </div>
  )
}

/* ---------------------------------------------------------------- 弹层 */

export function Modal({
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
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]" style={{ background: 'rgba(0,0,0,.55)' }}>
      <div
        className="animate-fadeUp w-full overflow-hidden rounded-xl border border-line bg-surface"
        style={{ maxWidth: width, boxShadow: '0 12px 32px rgba(0,0,0,.45)' }}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line-subtle px-5 py-4">
          <div>
            <div className="text-[15px] font-medium text-ink">{title}</div>
            {desc && <div className="mt-1 text-[12px] text-dim">{desc}</div>}
          </div>
          <IconButton onClick={onClose} className="-mr-1 -mt-1">
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        <div className="max-h-[58vh] overflow-auto px-5 py-4">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-line-subtle bg-[#0e1118] px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  width = 480,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  width?: number
  footer?: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,.55)' }} onClick={onClose}>
      <div
        className="absolute right-0 top-0 flex h-full flex-col border-l border-line bg-surface"
        style={{ width, animation: 'fadeUp .2s cubic-bezier(.4,0,.2,1) both' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-line-subtle px-5 py-3.5">
          <div className="text-[14px] font-medium text-ink">{title}</div>
          <IconButton onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        <div className="flex-1 overflow-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-line-subtle bg-[#0e1118] px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- 状态占位 */

export function EmptyState({
  title,
  desc,
  action,
  icon,
}: {
  title: string
  desc?: string
  action?: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-surface2 text-dim">
        {icon ?? <Search className="h-5 w-5" />}
      </div>
      <div className="text-[14px] text-ink">{title}</div>
      {desc && <div className="mt-1 max-w-[320px] text-[12px] leading-5 text-dim">{desc}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulseSoft rounded-md bg-[#1a1f29]', className)} />
}

export function Avatar({ name, hue, size = 28 }: { name: string; hue: number; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full text-[11px] font-medium"
      style={{
        width: size,
        height: size,
        background: `hsl(${hue} 42% 26%)`,
        color: `hsl(${hue} 70% 82%)`,
        border: `1px solid hsl(${hue} 40% 36%)`,
      }}
      title={name}
    >
      {name.slice(-2)}
    </span>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { key: T; icon: React.ReactNode; label?: string }[]
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-md border border-line bg-[#0d1017] p-0.5">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          aria-label={o.label}
          className={cn(
            'flex h-7 items-center gap-1.5 rounded px-2 text-[12px] transition-colors',
            value === o.key ? 'bg-surface2 text-ink' : 'text-dim hover:text-ink',
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ---------------------------------------------------------------- 键值 */

export function KV({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="shrink-0 text-[12px] text-dim">{label}</span>
      <span className={cn('text-right text-[12px] text-ink', mono && 'mono')}>{children}</span>
    </div>
  )
}
