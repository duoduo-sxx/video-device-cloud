export function PageLoader() {
  return (
    <div style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 108,
                borderRadius: 12,
                background: 'var(--np-bg-surface)',
                border: '1px solid var(--np-border)',
                opacity: 0.7,
              }}
            />
          ))}
        </div>
        <div
          style={{
            height: 320,
            borderRadius: 12,
            background: 'var(--np-bg-surface)',
            border: '1px solid var(--np-border)',
            opacity: 0.7,
          }}
        />
      </div>
    </div>
  );
}

export function InlineLoader({ height = 200 }: { height?: number }) {
  return (
    <div
      style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--np-text-tertiary)',
        fontSize: 12,
      }}
    >
      加载中…
    </div>
  );
}
