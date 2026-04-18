/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:     '#080705',
        card:   '#111009',
        card2:  '#181510',
        orange: '#FF5500',
        hot:    '#FF8C00',
        amber:  '#FFAA3B',
        yellow: '#FFD166',
        cream:  '#FDFAF4',
        gray:   '#6b6055',
        dim:    '#2a2318',
        muted:  '#8a7e6a',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['Bricolage Grotesque', 'sans-serif'],
        mono:    ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        full: '100px',
      },
      boxShadow: {
        glow:    '0 8px 32px rgba(255,85,0,0.32)',
        'glow-lg': '0 16px 48px rgba(255,85,0,0.42)',
        card:    '0 24px 60px rgba(0,0,0,0.5)',
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
}
