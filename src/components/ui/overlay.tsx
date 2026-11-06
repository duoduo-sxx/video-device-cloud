import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './core';

function useLock(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
}

export function Modal({
  open,
  onClose,
  title,
  desc,
  width = 520,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  desc?: string;
  width?: number;
  footer?: ReactNode;
  children: ReactNode;
}) {
  useLock(open);
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(3,6,12,.72)] px-4 py-[8vh] backdrop-blur-[4px]">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className="relative w-full animate-[fadeUp_.2s_ease-out] rounded-[14px] border border-[var(--stroke-strong)] bg-[var(--bg-card)] shadow-[0_40px_80px_-30px_rgba(0,0,0,.9)]"
        style={{ maxWidth: width }}
      >
        <div className="flex items-start justify-between border-b border-[var(--stroke)] px-5 py-4">
          <div>
            <h3 className="text-[14px] font-semibold text-[var(--text-1)]">{title}</h3>
            {desc && <p className="mt-1 text-[12px] text-[var(--text-3)]">{desc}</p>}
          </div>
          <button onClick={onClose} className="mt-0.5 text-[var(--text-3)] transition-colors hover:text-[var(--text-1)]">
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[64vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-[var(--stroke)] px-5 py-3.5">{footer}</div>}
      </div>
    </div>
  );
}

export function Drawer({
  open,
  onClose,
  title,
  desc,
  width = 480,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  desc?: string;
  width?: number;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useLock(open);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-[rgba(3,6,12,.66)] backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="absolute right-0 top-0 flex h-full flex-col border-l border-[var(--stroke-strong)] bg-[var(--bg-card)] shadow-[-30px_0_60px_-30px_rgba(0,0,0,.9)]"
        style={{ width }}
      >
        <div className="flex items-start justify-between border-b border-[var(--stroke)] px-5 py-4">
          <div>
            <h3 className="text-[14px] font-semibold">{title}</h3>
            {desc && <p className="mt-1 text-[12px] text-[var(--text-3)]">{desc}</p>}
          </div>
          <button onClick={onClose} className="text-[var(--text-3)] hover:text-[var(--text-1)]">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-[var(--stroke)] px-5 py-3.5">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  desc,
  confirmText = '确认',
  danger,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  desc: string;
  confirmText?: string;
  danger?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width={420}
      footer={
        <>
          <Button onClick={onClose}>取消</Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <p className="text-[13px] leading-relaxed text-[var(--text-2)]">{desc}</p>
    </Modal>
  );
}

export function Empty({
  icon,
  title,
  desc,
  action,
  compact,
}: {
  icon?: ReactNode;
  title: string;
  desc?: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'py-8' : 'py-16')}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--stroke)] bg-white/[0.03] text-[var(--text-3)]">
        {icon ?? <span className="text-[18px]">⌁</span>}
      </div>
      <div className="text-[13px] font-medium text-[var(--text-2)]">{title}</div>
      {desc && <div className="mt-1 max-w-[320px] text-[12px] leading-relaxed text-[var(--text-3)]">{desc}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
