/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--bg-canvas-rgb) / <alpha-value>)',
        panel: 'rgb(var(--bg-panel-rgb) / <alpha-value>)',
        panel2: 'rgb(var(--bg-panel2-rgb) / <alpha-value>)',
        elevated: 'rgb(var(--bg-elevated-rgb) / <alpha-value>)',
        ink: {
          DEFAULT: 'rgb(var(--text-primary-rgb) / <alpha-value>)',
          soft: 'rgb(var(--text-secondary-rgb) / <alpha-value>)',
          mute: 'rgb(var(--text-muted-rgb) / <alpha-value>)',
        },
        brand: {
          DEFAULT: 'rgb(var(--brand-rgb) / <alpha-value>)',
          deep: 'rgb(var(--brand-deep-rgb) / <alpha-value>)',
          soft: 'var(--brand-soft)',
        },
        accent: 'rgb(var(--accent-rgb) / <alpha-value>)',
        ok: 'rgb(var(--success-rgb) / <alpha-value>)',
        warn: 'rgb(var(--warning-rgb) / <alpha-value>)',
        bad: 'rgb(var(--danger-rgb) / <alpha-value>)',
        info: 'rgb(var(--info-rgb) / <alpha-value>)',
      },
      borderColor: {
        subtle: 'var(--border-subtle)',
        strong: 'var(--border-strong)',
      },
      fontFamily: {
        sans: ['PingFang SC', 'HarmonyOS Sans SC', 'Microsoft YaHei', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'DIN Alternate', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        '2xs': ['11px', '16px'],
        xs: ['12px', '18px'],
        sm: ['13px', '20px'],
        base: ['14px', '22px'],
        md: ['16px', '24px'],
        lg: ['18px', '26px'],
        xl: ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['32px', '40px'],
        '4xl': ['40px', '44px'],
      },
      borderRadius: {
        ctrl: '6px',
        card: '10px',
        panel: '12px',
        float: '16px',
      },
      boxShadow: {
        panel: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        float: '0 16px 48px -12px rgba(0,0,0,0.55)',
        glow: '0 0 0 1px var(--brand-soft), 0 0 24px -6px var(--brand)',
      },
      keyframes: {
        pulseRing: {
          '0%': { transform: 'scale(0.9)', opacity: '0.55' },
          '100%': { transform: 'scale(1.9)', opacity: '0' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        floatY: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        softPulse: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        ring: 'pulseRing 1.8s cubic-bezier(0.24,0,0.38,1) infinite',
        shimmer: 'shimmer 1.6s infinite',
        floatY: 'floatY 6s ease-in-out infinite',
        softPulse: 'softPulse 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
