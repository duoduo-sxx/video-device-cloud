import type { ReactNode } from 'react';

interface Props {
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ title, description, action }: Props) {
  return (
    <div className="empty-wrap">
      <svg width="120" height="88" viewBox="0 0 120 88" fill="none" aria-hidden>
        <rect x="20" y="22" width="80" height="52" rx="8" fill="#F4F7FC" stroke="#DCE5F2" />
        <path d="M20 34h80" stroke="#DCE5F2" />
        <circle cx="29" cy="28" r="2" fill="#C9D6E8" />
        <circle cx="36" cy="28" r="2" fill="#C9D6E8" />
        <path d="M38 54h20M38 62h34" stroke="#D6E1F0" strokeLinecap="round" strokeWidth="3" />
        <path d="M78 58l8-8 8 8" stroke="#B9CDE8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
        <path d="M86 50v16" stroke="#B9CDE8" strokeLinecap="round" strokeWidth="2.4" />
        <circle cx="60" cy="8" r="1.6" fill="#DCE5F2" />
        <circle cx="103" cy="18" r="1.6" fill="#DCE5F2" />
        <circle cx="14" cy="72" r="1.6" fill="#DCE5F2" />
      </svg>
      <div className="empty-title">{title}</div>
      {description ? <div className="empty-desc">{description}</div> : null}
      {action}
    </div>
  );
}
