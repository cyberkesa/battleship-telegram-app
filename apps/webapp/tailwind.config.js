/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Базовая светлая палитра (mobile-first)
        deep: '#FFFFFF',
        graphite: '#F8FAFC',
        steel: '#F1F5F9',
        edge: '#E2E8F0',
        sonar: '#2563EB',
        torpedo: '#DC2626',
        amber: '#F59E0B',
        mist: '#64748B',
        foam: '#0F172A',
        mute: '#94A3B8',
        success: '#16A34A',
        info: '#2563EB',
        radio: '#0EA5E9',
        // Telegram theme colors (fallback)
        'tg-bg': 'var(--tg-theme-bg-color, #FFFFFF)',
        'tg-text': 'var(--tg-theme-text-color, #0F172A)',
        'tg-hint': 'var(--tg-theme-hint-color, #64748B)',
        'tg-link': 'var(--tg-theme-link-color, #2563EB)',
        'tg-button': 'var(--tg-theme-button-color, #2563EB)',
        'tg-button-text': 'var(--tg-theme-button-text-color, #FFFFFF)',
        'tg-secondary-bg': 'var(--tg-theme-secondary-bg-color, #F1F5F9)',
        // Алиасы для читаемости классов
        bg: {
          deep: '#FFFFFF',
          graphite: '#F8FAFC',
          steel: '#F1F5F9',
        },
        text: {
          foam: '#0F172A',
          mist: '#64748B',
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
          ship: '#3730a3', // Еще более яркий индиго для максимальной видимости
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
        steel: 'none',
        'steel-inset': 'inset 0 1px 0 #E2E8F0',
        sonar: 'none',
        torpedo: 'none',
      },
      animation: {
      },
      keyframes: {
      },
      backgroundImage: {
        'steel-depth': 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
        'sonar-sweep': 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)',
        grain: 'none',
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
