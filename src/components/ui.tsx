import React from 'react'
import { X } from 'lucide-react'
import { cn } from '../lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type ButtonSize = 'sm' | 'md'

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  className,
  loading,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}) {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors focus-ring disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap'
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-[var(--primary)] text-[#04161c] hover:bg-[#4be0f5]',
    secondary: 'bg-[var(--bg-2)] text-[var(--text-1)] border border-[var(--border)] hover:bg-[var(--bg-3)] hover:border-[var(--border-str)]',
    ghost: 'text-[var(--text-2)] hover:bg-[var(--bg-3)] hover:text-[var(--text-1)]',
    danger: 'bg-[rgba(248,113,113,.14)] text-[#F87171] border border-[rgba(248,113,113,.35)] hover:bg-[rgba(248,113,113,.22)]',
    success: 'bg-[rgba(52,211,153,.14)] text-[#34D399] border border-[rgba(52,211,153,.35)] hover:bg-[rgba(52,211,153,.22)]',
  }
  const sizes: Record<ButtonSize, string> = {
    sm: 'h-8 px-2.5 text-[13px]',
    md: 'h-9 px-3.5 text-[13px]',
  }
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={loading || rest.disabled} {...rest}>
      {loading && (
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}

export function Card({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('card', className)} {...rest}>
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  desc,
  right,
  className,
}: {
  title: React.ReactNode
  desc?: React.ReactNode
  right?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 px-5 pt-4 pb-3', className)}>
      <div className="min-w-0">
        <h3 className="text-[14px] font-medium text-[var(--text-1)]">{title}</h3>
        {desc && <p className="mt-0.5 text-[12px] text-[var(--text-3)]">{desc}</p>}
      </div>
      {right}
    </div>
  )
}

export function Badge({
  children,
  color = 'var(--text-2)',
  bg = 'rgba(167,180,196,.12)',
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
      className={cn('inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[12px] leading-5', className)}
      style={{ color, background: bg }}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />}
      {children}
    </span>
  )
}

export function Input({ className, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-3 text-[13px] text-[var(--text-1)] outline-none transition-colors focus:border-[var(--primary)]',
        className,
      )}
      {...rest}
    />
  )
}

export function Textarea({ className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-3 py-2 text-[13px] leading-6 text-[var(--text-1)] outline-none transition-colors focus:border-[var(--primary)]',
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
        'h-9 w-full appearance-none rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-3 pr-8 text-[13px] text-[var(--text-1)] outline-none transition-colors focus:border-[var(--primary)]',
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236E7D90' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>\")",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
      }}
      {...rest}
    >
      {children}
    </select>
  )
}

export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={cn('mb-1.5 block text-[12px] text-[var(--text-2)]', className)}>{children}</label>
}

export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: { key: string; label: React.ReactNode; count?: number }[]
  value: string
  onChange: (key: string) => void
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-1 border-b border-[var(--border)]', className)}>
      {items.map((item) => {
        const active = item.key === value
        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={cn(
              'relative px-3 pb-2.5 pt-2 text-[13px] transition-colors',
              active ? 'text-[var(--text-1)]' : 'text-[var(--text-3)] hover:text-[var(--text-2)]',
            )}
          >
            <span className="flex items-center gap-1.5">
              {item.label}
              {item.count !== undefined && (
                <span className="tnum rounded bg-[var(--bg-3)] px-1 text-[11px] text-[var(--text-3)]">{item.count}</span>
              )}
            </span>
            {active && <span className="absolute inset-x-2 -bottom-px h-[2px] rounded bg-[var(--primary)]" />}
          </button>
        )
      })}
    </div>
  )
}

export function Segmented({
  items,
  value,
  onChange,
  size = 'md',
}: {
  items: { key: string; label: React.ReactNode }[]
  value: string
  onChange: (key: string) => void
  size?: 'sm' | 'md'
}) {
  return (
    <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--bg-2)] p-0.5">
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={cn(
            'rounded-md transition-colors',
            size === 'sm' ? 'px-2 py-0.5 text-[12px]' : 'px-2.5 py-1 text-[12px]',
            item.key === value
              ? 'bg-[var(--bg-3)] text-[var(--text-1)]'
              : 'text-[var(--text-3)] hover:text-[var(--text-2)]',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export function Progress({
  value,
  color = 'var(--primary)',
  height = 6,
  className,
}: {
  value: number
  color?: string
  height?: number
  className?: string
}) {
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-[var(--bg-3)]', className)} style={{ height }}>
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
      />
    </div>
  )
}

export function Switch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-[18px] w-8 shrink-0 rounded-full transition-colors disabled:opacity-40',
        checked ? 'bg-[var(--primary)]' : 'bg-[var(--bg-3)] border border-[var(--border)]',
      )}
    >
      <span
        className={cn(
          'absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white transition-all',
          checked ? 'left-[16px]' : 'left-[2px] bg-[var(--text-3)]',
        )}
      />
    </button>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 560,
}: {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  width?: number
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(3,6,10,.72)' }}>
      <div
        className="anim-in max-h-[86vh] w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-1)] shadow-layer"
        style={{ maxWidth: width }}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5">
          <h3 className="text-[14px] font-medium">{title}</h3>
          <button onClick={onClose} className="rounded p-1 text-[var(--text-3)] hover:bg-[var(--bg-3)] hover:text-[var(--text-1)]">
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[64vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}

export function Drawer({
  open,
  onClose,
  title,
  desc,
  children,
  footer,
  width = 520,
}: {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  desc?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  width?: number
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(3,6,10,.6)' }}>
      <div className="flex-1" onClick={onClose} />
      <div
        className="anim-in flex h-full flex-col border-l border-[var(--border)] bg-[var(--bg-1)]"
        style={{ width }}
      >
        <div className="flex items-start justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <h3 className="text-[14px] font-medium">{title}</h3>
            {desc && <p className="mt-0.5 text-[12px] text-[var(--text-3)]">{desc}</p>}
          </div>
          <button onClick={onClose} className="rounded p-1 text-[var(--text-3)] hover:bg-[var(--bg-3)] hover:text-[var(--text-1)]">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-[var(--border)] px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}

export function Tooltip({ children, content }: { children: React.ReactNode; content: React.ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--bg-3)] px-2 py-1 text-[11px] text-[var(--text-2)] shadow-layer group-hover:block">
        {content}
      </span>
    </span>
  )
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-[var(--border)]', className)} />
}

export function Avatar({ name, seed, size = 28 }: { name: string; seed: number; size?: number }) {
  const hues = [190, 160, 260, 30, 210, 330, 95, 15]
  const hue = hues[seed % hues.length]
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full text-[11px] font-medium"
      style={{
        width: size,
        height: size,
        background: `hsl(${hue} 42% 26%)`,
        color: `hsl(${hue} 80% 78%)`,
        border: `1px solid hsl(${hue} 40% 38%)`,
      }}
      title={name}
    >
      {name.slice(0, 1)}
    </span>
  )
}
