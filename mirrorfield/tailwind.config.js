/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#070B14',
        elev: '#0E1526',
        panel: '#121A2C',
        hover: '#1A2438',
        brand: '#22D3EE',
        accent: '#6366F1',
        ok: '#34D399',
        warn: '#FBBF24',
        danger: '#F87171',
        info: '#60A5FA',
      },
      borderRadius: { card: '10px' },
      fontFamily: {
        sans: ['Inter', 'HarmonyOS Sans SC', 'PingFang SC', 'Microsoft YaHei', 'system-ui', 'sans-serif'],
        mono: ['SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
