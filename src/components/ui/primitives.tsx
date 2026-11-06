import React from 'react'
import { cn } from '@/utils/misc'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'text'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary:
    'text-canvas font-medium bg-gradient-to-br from-brand to-brand-deep hover:brightness-110 active:brightness-95 border border-transparent',
  secondary:
    'bg-panel2 text-ink border border-strong hover:bg-elevated hover:border-brand/40',
  ghost: 'text-ink-soft hover:text-ink hover:bg-panel2 border border-transparent',
  danger: 'bg-bad/10 text-bad border border-bad/30 hover:bg-bad/20',
  text: 'text-brand hover:text-brand-deep px-0',
}

const SIZES: Record<Size, string> = {
  sm: 'h-7 px-2.5 text-xs gap-1.5 rounded-ctrl',
  md: 'h-9 px-3.5 text-sm gap-2 rounded-ctrl',
  lg: 'h-11 px-5 text-base gap-2 rounded-card',
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
}

export function Button({ variant = 'secondary', size = 'md', loading, icon, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap transition-all duration-150 focus-ring select-none',
        'disabled:opacity-45 disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  )
}

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  active?: boolean
}

export function IconButton({ label, active, className, children, ...rest }: IconButtonProps) {
  return (
    <button
      {...rest}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center w-8 h-8 rounded-ctrl transition-colors focus-ring',
        active ? 'bg-brand/15 text-brand' : 'text-ink-soft hover:text-ink hover:bg-panel2',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function Input({
  className,
  icon,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }) {
  return (
    <div className={cn('relative flex items-center', className)}>
      {icon && <span className="absolute left-2.5 text-ink-mute pointer-events-none">{icon}</span>}
      <input
        {...rest}
        className={cn(
          'w-full h-9 rounded-ctrl bg-panel2 border border-strong text-sm text-ink placeholder:text-ink-mute',
          'px-3 transition-colors focus-ring focus:border-brand/60 focus:bg-elevated',
          icon ? 'pl-8' : '',
        )}
      />
    </div>
  )
}

export function Textarea({ className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...rest}
      className={cn(
        'w-full min-h-[80px] rounded-ctrl bg-panel2 border border-strong text-sm text-ink placeholder:text-ink-mute',
        'px-3 py-2 transition-colors focus-ring focus:border-brand/60 focus:bg-elevated resize-none',
        className,
      )}
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
      {...rest}
      className={cn(
        'h-9 rounded-ctrl bg-panel2 border border-strong text-sm text-ink px-2.5 focus-ring focus:border-brand/60',
        'appearance-none bg-no-repeat pr-7 cursor-pointer',
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238FA3BF' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>\")",
        backgroundPosition: 'right 8px center',
      }}
    >
      {children}
    </select>
  )
}

export function Switch({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative w-9 h-5 rounded-full transition-colors duration-200 focus-ring shrink-0',
        checked ? 'bg-brand' : 'bg-panel2 border border-strong',
        disabled && 'opacity-40 cursor-not-allowed',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow',
          checked ? 'translate-x-[18px]' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  accent = 'var(--brand)',
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  accent?: string
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1.5 appearance-none rounded-full cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-ring"
      style={{
        background: `linear-gradient(to right, ${accent} ${pct}%, var(--bg-panel-2) ${pct}%)`,
      }}
    />
  )
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  size = 'md',
  className,
}: {
  options: Array<{ label: string; value: T }>
  value: T
  onChange: (v: T) => void
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <div className={cn('inline-flex p-0.5 rounded-ctrl bg-panel2 border border-subtle', className)}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-[4px] transition-all duration-150 focus-ring',
            size === 'sm' ? 'h-6 px-2 text-xs' : 'h-7 px-3 text-xs',
            value === o.value ? 'bg-brand/18 text-brand font-medium' : 'text-ink-soft hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Tag({
  children,
  color,
  className,
  dot,
}: {
  children: React.ReactNode
  color?: string
  className?: string
  dot?: boolean
}) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 h-5 px-1.5 rounded text-2xs border whitespace-nowrap', className)}
      style={{
        color: color ?? 'var(--text-secondary)',
        backgroundColor: `color-mix(in srgb, ${color ?? 'var(--text-secondary)'} 12%, transparent)`,
        borderColor: `color-mix(in srgb, ${color ?? 'var(--text-secondary)'} 28%, transparent)`,
      }}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />}
      {children}
    </span>
  )
}

export function Tooltip({ content, children }: { content: string; children: React.ReactNode }) {
  return (
    <span className="relative group inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded bg-elevated border border-strong text-2xs text-ink whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-float">
        {content}
      </span>
    </span>
  )
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: Array<{ key: T; label: string; count?: number }>
  value: T
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-1 border-b border-subtle', className)}>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            'relative h-10 px-3 text-sm transition-colors focus-ring',
            value === t.key ? 'text-brand font-medium' : 'text-ink-soft hover:text-ink',
          )}
        >
          {t.label}
          {typeof t.count === 'number' && (
            <span className="ml-1.5 text-2xs text-ink-mute num">{t.count}</span>
          )}
          {value === t.key && <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-brand rounded-full" />}
        </button>
      ))}
    </div>
  )
}

export function Field({ label, hint, children, required }: { label: string; hint?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="block text-xs text-ink-soft mb-1.5">
        {label}
        {required && <span className="text-bad ml-0.5">*</span>}
      </span>
      {children}
      {hint && <span className="block text-2xs text-ink-mute mt-1">{hint}</span>}
    </label>
  )
}
