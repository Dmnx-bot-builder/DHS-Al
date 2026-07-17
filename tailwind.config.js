export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter','system-ui','sans-serif'], mono: ['"JetBrains Mono"','ui-monospace','monospace'] },
      colors: {
        ink: { 950:'#070A12', 900:'#0B0F1A', 850:'#0F1422', 800:'#141A2B', 750:'#1A2236', 700:'#222B42', 600:'#2E3A57' },
        brand: { 300:'#4DC1FF', 400:'#1AAEFF', 500:'#0099F0', 600:'#007ABD', 700:'#005C8A' },
        gold: { 400:'#FFD27A', 500:'#F5B544', 600:'#D4952C' },
        bull: { 400:'#34E2A1', 500:'#16C784', 600:'#0FA56B' },
        bear: { 400:'#FF6B81', 500:'#EA3943', 600:'#C42D35' },
      },
      backgroundImage: {
        'grid-faint': 'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
        'radial-glow': 'radial-gradient(circle at 50% 0%, rgba(0,153,240,0.15), transparent 60%)',
      },
      backgroundSize: { grid: '48px 48px' },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0,0,0,0.37)', 'glass-sm': '0 4px 16px 0 rgba(0,0,0,0.35)',
        glow: '0 0 24px rgba(0,153,240,0.25)', 'glow-gold': '0 0 24px rgba(245,181,68,0.25)',
        'glow-bull': '0 0 24px rgba(22,199,132,0.25)', 'glow-bear': '0 0 24px rgba(234,57,67,0.25)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity:'0', transform:'translateY(8px)' }, '100%': { opacity:'1', transform:'translateY(0)' } },
        'fade-in-scale': { '0%': { opacity:'0', transform:'scale(0.96)' }, '100%': { opacity:'1', transform:'scale(1)' } },
        'pulse-ring': { '0%': { transform:'scale(0.8)', opacity:'0.7' }, '100%': { transform:'scale(2.4)', opacity:'0' } },
        ticker: { '0%': { transform:'translateX(0)' }, '100%': { transform:'translateX(-50%)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out both', 'fade-in-scale': 'fade-in-scale 0.4s ease-out both',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.4,0,0.6,1) infinite', ticker: 'ticker 40s linear infinite',
      },
    },
  },
  plugins: [],
};
