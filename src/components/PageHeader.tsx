import type { ReactNode } from 'react';

interface Props {
  title: ReactNode;
  description?: ReactNode;
  extra?: ReactNode;
}

export default function PageHeader({ title, description, extra }: Props) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {description ? <div className="page-desc">{description}</div> : null}
      </div>
      {extra ? <div className="page-extra">{extra}</div> : null}
    </div>
  );
}
