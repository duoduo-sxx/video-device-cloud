import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'text';
type Size = 'sm' | 'md';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  loading?: boolean;
  block?: boolean;
}

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-ctl font-medium transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap select-none';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'bg-white text-ink-1 border border-line hover:bg-[#F9FAFB]',
  ghost: 'bg-transparent text-ink-2 hover:bg-[#F2F4F7]',
  danger: 'bg-danger text-white hover:bg-[#991B1B]',
  text: 'bg-transparent text-primary hover:text-primary-hover px-0',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
};

export default function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  loading,
  block,
  className,
  children,
  disabled,
  ...rest
}: Props) {
  return (
    <button
      className={clsx(
        BASE,
        VARIANTS[variant],
        variant === 'text' ? 'h-auto' : SIZES[size],
        block && 'w-full',
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}
