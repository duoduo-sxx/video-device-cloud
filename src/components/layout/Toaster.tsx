import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import clsx from 'clsx';
import { useUIStore } from '@/store/uiStore';

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: TriangleAlert,
  info: Info,
};

const TONE = {
  success: 'text-success',
  error: 'text-danger',
  warning: 'text-warning',
  info: 'text-primary',
};

export default function Toaster() {
  const toasts = useUIStore((s) => s.toasts);
  const dismiss = useUIStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed right-5 top-16 z-[100] flex w-80 flex-col gap-2">
      {toasts.map((t) => {
        const Icon = ICONS[t.type];
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-2.5 rounded-card border border-line bg-white px-3.5 py-3 shadow-pop animate-fade-up"
          >
            <Icon size={16} className={clsx('mt-0.5 shrink-0', TONE[t.type])} />
            <div className="flex-1 text-xs leading-relaxed text-ink-1">{t.message}</div>
            <button onClick={() => dismiss(t.id)} className="text-ink-3 hover:text-ink-1">
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
