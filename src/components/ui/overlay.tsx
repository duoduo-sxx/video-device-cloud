import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react'
import { cn } from '@/utils/misc'
import { useUIStore } from '@/stores/uiStore'
import { Button } from './primitives'

function useEsc(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
}

const Mask = ({ onClick }: { onClick?: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.18 }}
    onClick={onClick}
    className="fixed inset-0 z-[60]"
    style={{ background: 'rgba(4,8,14,0.72)', backdropFilter: 'blur(8px)' }}
  />
)

export function Modal({
  open,
  onClose,
  title,
  desc,
  width = 560,
  footer,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  desc?: string
  width?: number
  footer?: React.ReactNode
  children: React.ReactNode
}) {
  useEsc(open, onClose)
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <Mask onClick={onClose} />
          <div className="fixed inset-0 z-[61] flex items-center justify-center p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 6 }}
              transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
              style={{ width }}
              className="pointer-events-auto bg-panel border border-strong rounded-float shadow-float overflow-hidden max-h-[85vh] flex flex-col"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-subtle">
                <div>
                  <h3 className="text-md font-medium text-ink">{title}</h3>
                  {desc && <p className="text-xs text-ink-soft mt-1">{desc}</p>}
                </div>
                <button onClick={onClose} aria-label="关闭" className="text-ink-mute hover:text-ink transition-colors p-1 focus-ring rounded">
                  <X size={16} />
                </button>
              </div>
              <div className="px-5 py-4 overflow-auto flex-1">{children}</div>
              {footer && <div className="px-5 py-3 border-t border-subtle flex justify-end gap-2">{footer}</div>}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  width = 520,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  subtitle?: React.ReactNode
  width?: number
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  useEsc(open, onClose)
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <Mask onClick={onClose} />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.26, ease: [0.32, 0.72, 0, 1] }}
            style={{ width }}
            className="fixed right-0 top-0 bottom-0 z-[61] bg-panel border-l border-strong shadow-float flex flex-col max-w-[92vw]"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between px-5 py-4 border-b border-subtle shrink-0">
              <div className="min-w-0">
                <div className="text-md font-medium text-ink truncate">{title}</div>
                {subtitle && <div className="text-xs text-ink-soft mt-1 truncate">{subtitle}</div>}
              </div>
              <button onClick={onClose} aria-label="关闭" className="text-ink-mute hover:text-ink p-1 shrink-0 focus-ring rounded">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-auto">{children}</div>
            {footer && <div className="px-5 py-3 border-t border-subtle flex gap-2 justify-end shrink-0">{footer}</div>}
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
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
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  desc?: string
  confirmText?: string
  danger?: boolean
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width={420}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-soft leading-relaxed">{desc ?? '该操作确认后立即生效。'}</p>
    </Modal>
  )
}

const TOAST_ICON = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}
const TOAST_COLOR = {
  success: 'var(--success)',
  error: 'var(--danger)',
  warning: 'var(--warning)',
  info: 'var(--info)',
}

export function ToastHost() {
  const toasts = useUIStore((s) => s.toasts)
  const dismiss = useUIStore((s) => s.dismiss)
  return createPortal(
    <div className="fixed top-4 right-4 z-[90] flex flex-col gap-2 w-[320px] pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = TOAST_ICON[t.type]
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 24, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.98 }}
              transition={{ duration: 0.22 }}
              className="pointer-events-auto bg-panel border border-strong rounded-card shadow-float px-3.5 py-3 flex items-start gap-2.5"
            >
              <Icon size={16} style={{ color: TOAST_COLOR[t.type] }} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-ink leading-snug">{t.title}</div>
                {t.desc && <div className="text-2xs text-ink-mute mt-0.5 leading-relaxed">{t.desc}</div>}
              </div>
              <button onClick={() => dismiss(t.id)} aria-label="关闭提示" className="text-ink-mute hover:text-ink shrink-0">
                <X size={13} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>,
    document.body,
  )
}
