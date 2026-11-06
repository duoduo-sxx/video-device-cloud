/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        surface2: 'var(--surface-2)',
        line: 'var(--border)',
        'line-subtle': 'var(--border-subtle)',
        ink: 'var(--text)',
        muted: 'var(--text-muted)',
        dim: 'var(--text-dim)',
        primary: { DEFAULT: 'var(--primary)', hover: 'var(--primary-hover)' },
        accent: 'var(--accent)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
      },
      borderRadius: { md: '8px', lg: '12px', xl: '16px' },
      fontFamily: {
        sans: ['Inter', 'PingFang SC', 'Microsoft YaHei', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        shimmer: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(320%)' } },
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.45' } },
      },
      animation: {
        shimmer: 'shimmer 1.6s linear infinite',
        fadeUp: 'fadeUp .24s cubic-bezier(.4,0,.2,1) both',
        pulseSoft: 'pulseSoft 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
