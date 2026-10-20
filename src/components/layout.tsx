import type { CSSProperties, ReactNode } from 'react';

export function PageHeader({
  title,
  desc,
  actions,
  extra,
  breadcrumb,
}: {
  title: ReactNode;
  desc?: ReactNode;
  actions?: ReactNode;
  extra?: ReactNode;
  breadcrumb?: ReactNode;
}) {
  return (
    <div className="np-page-header">
      <div style={{ minWidth: 0 }}>
        {breadcrumb}
        <div className="np-page-title">{title}</div>
        {desc && <div className="np-page-desc">{desc}</div>}
        {extra}
      </div>
      {actions && <div className="np-page-actions">{actions}</div>}
    </div>
  );
}

export function SectionCard({
  title,
  sub,
  extra,
  children,
  flush = false,
  style,
  bodyStyle,
}: {
  title?: ReactNode;
  sub?: ReactNode;
  extra?: ReactNode;
  children: ReactNode;
  flush?: boolean;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
}) {
  return (
    <section className="np-section" style={style}>
      {(title || extra) && (
        <header className="np-section-head">
          <div className="np-section-title">
            {title}
            {sub && <span className="np-section-sub">{sub}</span>}
          </div>
          {extra && <div className="np-hstack">{extra}</div>}
        </header>
      )}
      <div className={flush ? 'np-section-body-flush' : 'np-section-body'} style={bodyStyle}>
        {children}
      </div>
    </section>
  );
}
