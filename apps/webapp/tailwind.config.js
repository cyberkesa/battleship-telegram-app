/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Морская палитра
        'deep': '#0B1214',        // Base/Фон глубокого моря
        'graphite': '#111820',    // Графит
        'steel': '#1A232C',       // Сталь
        'edge': '#273140',        // Стальная кромка
        'sonar': '#00E08C',       // Акцент «сонар»
        'torpedo': '#FF3B3B',     // Акцент «торпеда»
        'amber': '#FFC857',       // Акцент «радио-янтарь»
        'mist': '#93A3B3',        // Туман/текст вторичный
        'foam': '#E6EEF7',        // Пена/текст основной
        'mute': '#5A728A',        // Немой синий (нейтр.)
        'success': '#2ECC71',     // Успех спокойный
        'info': '#3BA3FF',        // Инфо холодный
        
        // Telegram theme colors (fallback)
        'tg-bg': 'var(--tg-theme-bg-color, #0B1214)',
        'tg-text': 'var(--tg-theme-text-color, #E6EEF7)',
        'tg-hint': 'var(--tg-theme-hint-color, #93A3B3)',
        'tg-link': 'var(--tg-theme-link-color, #00E08C)',
        'tg-button': 'var(--tg-theme-button-color, #00E08C)',
        'tg-button-text': 'var(--tg-theme-button-text-color, #0B1214)',
        'tg-secondary-bg': 'var(--tg-theme-secondary-bg-color, #111820)',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['IBM Plex Mono', 'monospace'],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '1.4' }],
        'sm': ['13px', { lineHeight: '1.4' }],
        'base': ['14px', { lineHeight: '1.5' }],
        'lg': ['16px', { lineHeight: '1.5' }],
        'xl': ['18px', { lineHeight: '1.4' }],
        '2xl': ['20px', { lineHeight: '1.4' }],
        '3xl': ['22px', { lineHeight: '1.3' }],
      },
      spacing: {
        'cell': '36px',
        'cell-sm': '32px',
        'cell-lg': '40px',
        'cell-mini': '22px',
      },
      borderRadius: {
        'cell': '6px',
        'lg': '10px',
        'xl': '14px',
      },
      boxShadow: {
        'steel': '0 8px 24px rgba(0,0,0,0.35)',
        'steel-inset': 'inset 0 1px 0 #273140',
        'sonar': '0 0 20px rgba(0,224,140,0.3)',
        'torpedo': '0 0 20px rgba(255,59,59,0.3)',
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
        'steel-depth': 'linear-gradient(180deg, #0B1214 0%, #111820 100%)',
        'sonar-sweep': 'radial-gradient(circle, rgba(0,224,140,0.12) 0%, transparent 70%)',
        'grain': 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.02\'/%3E%3C/svg%3E")',
      },
    },
  },
  plugins: [],
}
