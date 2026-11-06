/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg0: 'var(--bg-0)',
        bg1: 'var(--bg-1)',
        bg2: 'var(--bg-2)',
        bg3: 'var(--bg-3)',
        line: 'var(--border)',
        linestr: 'var(--border-str)',
        t1: 'var(--text-1)',
        t2: 'var(--text-2)',
        t3: 'var(--text-3)',
        primary: 'var(--primary)',
        accent: 'var(--accent)',
        success: 'var(--success)',
        danger: 'var(--danger)',
        info: 'var(--info)',
        purple: 'var(--purple)',
      },
      fontFamily: {
        sans: ['Inter', 'PingFang SC', 'Microsoft YaHei', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        layer: '0 8px 24px rgba(0,0,0,.45)',
      },
    },
  },
  plugins: [],
}
