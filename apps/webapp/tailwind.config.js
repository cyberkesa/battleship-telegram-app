/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Базовая тёмная палитра (mobile-first)
        deep: '#0B0F14',
        graphite: '#121821',
        steel: '#1A2330',
        edge: '#253244',
        sonar: '#00E08C',
        torpedo: '#FF3B3B',
        amber: '#FFC857',
        mist: '#93A3B3',
        foam: '#E6EEF7',
        mute: '#5A728A',
        success: '#22C55E',
        info: '#3B82F6',
        radio: '#3BA3FF',
        // Telegram theme colors (fallback)
        'tg-bg': 'var(--tg-theme-bg-color, #0B0F14)',
        'tg-text': 'var(--tg-theme-text-color, #E6EEF7)',
        'tg-hint': 'var(--tg-theme-hint-color, #93A3B3)',
        'tg-link': 'var(--tg-theme-link-color, #00E08C)',
        'tg-button': 'var(--tg-theme-button-color, #00E08C)',
        'tg-button-text': 'var(--tg-theme-button-text-color, #0B0F14)',
        'tg-secondary-bg': 'var(--tg-theme-secondary-bg-color, #121821)',
        // Алиасы для читаемости классов
        bg: {
          deep: '#0B0F14',
          graphite: '#121821',
          steel: '#1A2330',
        },
        text: {
          foam: '#E6EEF7',
          mist: '#93A3B3',
        },
        // Семантические палитры для будущего расширения
        accent: {
          blue: '#3b82f6',
          cyan: '#06b6d4',
          teal: '#14b8a6',
          emerald: '#10b981',
          lime: '#84cc16',
          yellow: '#eab308',
          orange: '#f97316',
          red: '#ef4444',
          pink: '#ec4899',
          purple: '#a855f7',
          indigo: '#6366f1',
        },
        game: {
          water: '#0ea5e9',
          ship: '#6366f1',
          hit: '#ef4444',
          miss: '#94a3b8',
          sunk: '#dc2626',
          highlight: '#fbbf24',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      // Семантическая типографика, используемая по проекту
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '18px' }],
        base: ['14px', { lineHeight: '20px' }],
        lg: ['16px', { lineHeight: '22px' }],
        xl: ['18px', { lineHeight: '24px' }],
        '2xl': ['20px', { lineHeight: '26px' }],
        '3xl': ['22px', { lineHeight: '28px' }],
        // Семантические размеры, которые используются в коде
        h1: ['28px', { lineHeight: '34px', letterSpacing: '-0.01em' }],
        h2: ['22px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
        h3: ['18px', { lineHeight: '24px' }],
        body: ['14px', { lineHeight: '20px' }],
        caption: ['12px', { lineHeight: '16px' }],
      },
      spacing: {
        cell: '36px',
        'cell-sm': '32px',
        'cell-lg': '40px',
        'cell-mini': '22px',
      },
      borderRadius: {
        cell: '6px',
        card: '12px',
        modal: '16px',
        lg: '10px',
        xl: '14px',
      },
      boxShadow: {
        steel: '0 8px 24px rgba(0,0,0,0.35)',
        'steel-inset': 'inset 0 1px 0 #253244',
        sonar: '0 0 20px rgba(0,224,140,0.3)',
        torpedo: '0 0 20px rgba(255,59,59,0.3)',
      },
      animation: {
        'sonar-pulse': 'sonar-pulse 2s ease-in-out infinite',
        'torpedo-hit': 'torpedo-hit 0.3s ease-out',
        'miss-splash': 'miss-splash 0.2s ease-out',
        'turn-transition': 'turn-transition 0.5s ease-in-out',
        'timer-warning': 'timer-warning 1s ease-in-out infinite',
      },
      keyframes: {
        'sonar-pulse': {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        'torpedo-hit': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.2)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'miss-splash': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'turn-transition': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'timer-warning': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      backgroundImage: {
        'steel-depth': 'linear-gradient(180deg, #0B0F14 0%, #121821 100%)',
        'sonar-sweep': 'radial-gradient(circle, rgba(0,224,140,0.12) 0%, transparent 70%)',
        grain: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.02\'/%3E%3C/svg%3E")',
      },
    },
  },
  plugins: [],
  safelist: [
    // размеры ячеек и скругления из общего UI
    'w-cell', 'h-cell', 'w-cell-sm', 'h-cell-sm', 'w-cell-lg', 'h-cell-lg', 'w-cell-mini', 'h-cell-mini',
    'rounded-card', 'rounded-modal', 'rounded-cell',
    // кольца и тени
    'ring-edge', 'ring-sonar', 'ring-sonar/50', 'ring-torpedo', 'shadow-steel', 'shadow-torpedo', 'shadow-sonar',
    // игровые цвета
    'bg-game-water', 'bg-game-ship', 'bg-game-hit', 'bg-game-miss', 'bg-game-sunk', 'bg-game-highlight',
    // семантические цвета
    'bg-accent-blue', 'bg-accent-cyan', 'bg-accent-teal', 'bg-accent-emerald', 'bg-accent-lime', 'bg-accent-yellow', 'bg-accent-orange', 'bg-accent-red', 'bg-accent-pink', 'bg-accent-purple', 'bg-accent-indigo',
  ],
}
