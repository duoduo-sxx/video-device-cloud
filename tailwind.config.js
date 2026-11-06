/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        subtle: 'var(--bg-subtle)',
        hover: 'var(--bg-hover)',
        line: 'var(--border)',
        'line-strong': 'var(--border-strong)',
        t1: 'var(--text-primary)',
        t2: 'var(--text-secondary)',
        t3: 'var(--text-tertiary)',
        brand: 'var(--brand)',
        'brand-hover': 'var(--brand-hover)',
        'brand-soft': 'var(--brand-soft)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        info: 'var(--info)',
        ai: 'var(--ai-purple)',
      },
      borderRadius: {
        card: '12px',
        ctl: '8px',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'PingFang SC',
          'Microsoft YaHei',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: ['SF Mono', 'ui-monospace', 'Menlo', 'monospace'],
      },
      fontSize: {
        xxs: ['11px', '16px'],
        xs: ['12px', '18px'],
        sm: ['13px', '20px'],
        base: ['14px', '22px'],
        lg: ['16px', '24px'],
        xl: ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['30px', '38px'],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'slide-left': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        pulseDot: {
          '0%,100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '.45', transform: 'scale(.8)' },
        },
        kenburns: {
          from: { transform: 'scale(1)' },
          to: { transform: 'scale(1.05)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        blink: {
          '0%,49%': { opacity: '1' },
          '50%,100%': { opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in .2s ease-out both',
        'scale-in': 'scale-in .18s cubic-bezier(.4,0,.2,1) both',
        'slide-up': 'slide-up .22s cubic-bezier(.4,0,.2,1) both',
        'slide-left': 'slide-left .22s cubic-bezier(.4,0,.2,1) both',
        pulseDot: 'pulseDot 1.6s ease-in-out infinite',
        kenburns: 'kenburns 22s ease-in-out infinite alternate',
        shimmer: 'shimmer 1.4s infinite',
        blink: 'blink 1s step-end infinite',
      },
    },
  },
  plugins: [],
}
