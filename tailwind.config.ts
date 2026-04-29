/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:     'var(--bg)',
        card:   'var(--card)',
        card2:  'var(--card2)',
        orange: 'var(--orange)',
        hot:    'var(--hot)',
        amber:  'var(--amber)',
        yellow: 'var(--yellow)',
        cream:  'var(--white)',
        white:  'var(--white)',
        gray:   'var(--gray)',
        dim:    'var(--dim)',
        muted:  'var(--muted)',
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
        glow:    'var(--shadow-glow)',
        'glow-lg': 'var(--shadow-glow-lg)',
        card:    'var(--shadow-card)',
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
}
