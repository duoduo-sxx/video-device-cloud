import { forwardRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { Check, ChevronDown, Copy } from 'lucide-react';
import { cn } from '@/utils/cn';
import { TONE_STYLE, type Tone } from '@/utils/constants';
import { shortHash } from '@/utils/format';

/* ---------------------------------- Button --------------------------------- */

type Variant = 'primary' | 'ghost' | 'danger' | 'text';
type Size = 'md' | 'sm' | 'xs';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'ghost', size = 'md', icon, loading, className, children, disabled, ...rest },
  ref,
) {
  const v = variant === 'text' ? 'btn-ghost border-transparent bg-transparent hover:bg-white/5' : `btn-${variant}`;
  const s = size === 'sm' ? 'btn-sm' : size === 'xs' ? 'btn-xs' : '';
  return (
    <button
      ref={ref}
      className={cn('btn', v, s, className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className="h-3 w-3 animate-spin rounded-full border border-white/40 border-t-white" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
});

/* ---------------------------------- Field ---------------------------------- */

export function Field({
  label,
  required,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="label">
        {label}
        {required && <span className="ml-0.5 text-[var(--danger)]">*</span>}
      </label>
      {children}
      {error ? <div className="err">{error}</div> : hint ? <div className="mt-1 text-[11px] text-[var(--text-3)]">{hint}</div> : null}
    </div>
  );
}

/* ---------------------------------- Input ---------------------------------- */

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  invalid?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, className, prefix, suffix, ...rest },
  ref,
) {
  if (prefix || suffix) {
    return (
      <div
        className={cn(
          'flex h-[34px] items-center gap-2 rounded-lg border border-[var(--stroke)] bg-[var(--bg-card-2)] px-3 transition-all focus-within:border-[rgba(61,125,255,.7)] focus-within:shadow-[0_0_0_3px_rgba(61,125,255,.14)]',
          invalid && 'border-[rgba(255,92,122,.7)]',
          className,
        )}
      >
        {prefix && <span className="text-[var(--text-3)]">{prefix}</span>}
        <input
          ref={ref}
          className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-[var(--text-1)] outline-none placeholder:text-[var(--text-3)]"
          {...rest}
        />
        {suffix}
      </div>
    );
  }
  return <input ref={ref} className={cn('input', invalid && 'input-error', className)} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return <textarea ref={ref} className={cn('textarea', className)} {...rest} />;
  },
);

/* --------------------------------- Select ---------------------------------- */

export interface SelectOption {
  value: string;
  label: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  className,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  invalid?: boolean;
}) {
  return (
    <div className={cn('relative', className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn('input appearance-none pr-8', invalid && 'input-error')}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[var(--bg-card-2)]">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-3)]"
      />
    </div>
  );
}

/* --------------------------------- Checkbox -------------------------------- */

export function Checkbox({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-2 select-none', disabled && 'cursor-not-allowed opacity-50')}>
      <span
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'flex h-[15px] w-[15px] flex-none items-center justify-center rounded-[4px] border transition-all',
          checked
            ? 'border-transparent bg-[var(--brand)] text-white'
            : 'border-[var(--stroke-strong)] bg-[var(--bg-card-2)]',
        )}
      >
        {checked && <Check size={11} strokeWidth={3} />}
      </span>
      {label && <span className="text-[12.5px] text-[var(--text-2)]">{label}</span>}
    </label>
  );
}

/* --------------------------------- Switch ---------------------------------- */

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <label className={cn('inline-flex items-center gap-2.5', disabled ? 'opacity-50' : 'cursor-pointer')}>
      <span
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative h-[18px] w-[32px] rounded-full transition-colors duration-150',
          checked ? 'bg-[var(--brand)]' : 'bg-white/12',
        )}
      >
        <span
          className={cn(
            'absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white transition-all duration-150',
            checked ? 'left-[16px]' : 'left-[2px]',
          )}
        />
      </span>
      {label && <span className="text-[12.5px] text-[var(--text-2)]">{label}</span>}
    </label>
  );
}

/* --------------------------------- RadioCard -------------------------------- */

export function RadioCard({
  checked,
  onClick,
  title,
  desc,
  icon,
  disabled,
}: {
  checked: boolean;
  onClick: () => void;
  title: string;
  desc?: string;
  icon?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative w-full rounded-[10px] border p-4 text-left transition-all duration-150',
        checked
          ? 'border-[rgba(34,211,238,.55)] bg-[rgba(34,211,238,.06)] shadow-[0_0_0_1px_rgba(34,211,238,.25),0_0_24px_rgba(34,211,238,.12)]'
          : 'border-[var(--stroke)] bg-[var(--bg-card-2)] hover:border-[var(--stroke-strong)] hover:bg-[var(--bg-hover)]',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <div className="flex items-start gap-3">
        {icon && <span className={cn('mt-0.5', checked ? 'text-[var(--brand-2)]' : 'text-[var(--text-3)]')}>{icon}</span>}
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-[var(--text-1)]">{title}</div>
          {desc && <div className="mt-1 text-[11.5px] leading-relaxed text-[var(--text-3)]">{desc}</div>}
        </div>
        <span
          className={cn(
            'mt-0.5 flex h-[14px] w-[14px] flex-none items-center justify-center rounded-full border',
            checked ? 'border-[var(--brand-2)]' : 'border-[var(--stroke-strong)]',
          )}
        >
          {checked && <span className="h-[6px] w-[6px] rounded-full bg-[var(--brand-2)]" />}
        </span>
      </div>
    </button>
  );
}

/* ---------------------------------- Tag ------------------------------------ */

export function Tag({ children, tone, className }: { children: ReactNode; tone?: Tone; className?: string }) {
  if (!tone) return <span className={cn('tag', className)}>{children}</span>;
  const t = TONE_STYLE[tone];
  return (
    <span
      className={cn('tag', className)}
      style={{ color: t.color, background: t.bg, borderColor: t.border }}
    >
      {children}
    </span>
  );
}

export function StatusPill({ label, tone, dot = true }: { label: string; tone: Tone; dot?: boolean }) {
  const t = TONE_STYLE[tone];
  return (
    <span className="pill" style={{ color: t.color, background: t.bg, borderColor: t.border }}>
      {dot && <span className="pill-dot" />}
      {label}
    </span>
  );
}

/* --------------------------------- Avatar ---------------------------------- */

export function Avatar({ name, color = '#3D7DFF', size = 26 }: { name: string; color?: string; size?: number }) {
  return (
    <span
      className="inline-flex flex-none items-center justify-center rounded-full font-medium text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `linear-gradient(135deg, ${color}, ${color}88)`,
        boxShadow: `0 0 0 1px ${color}44`,
      }}
    >
      {name.slice(0, 1)}
    </span>
  );
}

/* -------------------------------- Progress --------------------------------- */

export function Progress({ value, tone = 'brand', height = 6 }: { value: number; tone?: 'brand' | 'danger' | 'ok'; height?: number }) {
  const color =
    tone === 'danger' ? 'var(--danger)' : tone === 'ok' ? 'var(--ok)' : 'linear-gradient(90deg,#3D7DFF,#22D3EE)';
  return (
    <div className="w-full overflow-hidden rounded-full bg-white/8" style={{ height }}>
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
      />
    </div>
  );
}

/* -------------------------------- HashText --------------------------------- */

export function HashText({ value, head = 6, tail = 4, full = false }: { value: string; head?: number; tail?: number; full?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard?.writeText(value).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <span
      className="group inline-flex items-center gap-1.5 font-mono text-[11.5px] text-[var(--brand-2)]"
      title={value}
    >
      <span className="cursor-pointer hover:underline" onClick={copy}>
        {full ? value : shortHash(value, head, tail)}
      </span>
      <button
        type="button"
        onClick={copy}
        className="opacity-0 transition-opacity group-hover:opacity-100"
        title="复制"
      >
        {copied ? <Check size={11} className="text-[var(--ok)]" /> : <Copy size={11} className="text-[var(--text-3)]" />}
      </button>
    </span>
  );
}

export function CopyButton({ value, size = 13 }: { value: string; size?: number }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="text-[var(--text-3)] transition-colors hover:text-[var(--text-1)]"
      title="复制"
      onClick={() => {
        navigator.clipboard?.writeText(value).catch(() => undefined);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
    >
      {copied ? <Check size={size} className="text-[var(--ok)]" /> : <Copy size={size} />}
    </button>
  );
}
