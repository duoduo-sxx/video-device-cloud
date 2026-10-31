/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1D4ED8',
          hover: '#1E40AF',
          soft: '#EFF4FF',
          ring: '#BFD3FE',
        },
        cyanx: '#0891B2',
        success: { DEFAULT: '#15803D', soft: '#ECFDF3' },
        warning: { DEFAULT: '#B45309', soft: '#FFFAEB' },
        danger: { DEFAULT: '#B91C1C', soft: '#FEF3F2' },
        page: '#F5F7FA',
        line: '#E4E7EC',
        ink: { 1: '#101828', 2: '#475467', 3: '#98A2B3' },
        sidebar: { DEFAULT: '#0B1220', hover: '#151E33', text: '#94A3B8' },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'PingFang SC',
          'Microsoft YaHei',
          'sans-serif',
        ],
        mono: ['SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['11px', '16px'],
        xs: ['12px', '18px'],
        sm: ['13px', '20px'],
        base: ['14px', '22px'],
        lg: ['16px', '24px'],
        xl: ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['30px', '38px'],
      },
      borderRadius: { card: '12px', ctl: '8px' },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.10)',
        pop: '0 8px 24px rgba(16,24,40,.12), 0 2px 6px rgba(16,24,40,.08)',
      },
    },
  },
  plugins: [],
};
