/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          base: 'var(--bg-base)',
          canvas: 'var(--bg-canvas)',
          card: 'var(--bg-card)',
          card2: 'var(--bg-card-2)',
          hover: 'var(--bg-hover)',
        },
        brand: {
          DEFAULT: 'var(--brand)',
          cyan: 'var(--brand-2)',
          violet: 'var(--violet)',
        },
        t1: 'var(--text-1)',
        t2: 'var(--text-2)',
        t3: 'var(--text-3)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Segoe UI', 'sans-serif'],
        mono: ['SF Mono', 'ui-monospace', 'Menlo', 'Consolas', 'monospace'],
      },
      borderRadius: {
        md2: '10px',
        lg2: '14px',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '100% 0' },
          '100%': { backgroundPosition: '-100% 0' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%,100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '.45', transform: 'scale(.82)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.4s linear infinite',
        fadeUp: 'fadeUp .24s ease-out both',
        pulseDot: 'pulseDot 1.8s ease-in-out infinite',
        slideDown: 'slideDown .3s ease-out both',
      },
    },
  },
  plugins: [],
};
