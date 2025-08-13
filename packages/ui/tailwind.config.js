/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../apps/webapp/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Основная палитра
        'bg-deep': '#0B1214',        // Фон глубокого моря
        'bg-graphite': '#111820',    // Графит
        'steel': '#1A232C',          // Сталь
        'edge': '#273140',           // Стальная кромка
        'sonar': '#00E08C',          // Акцент "сонар"
        'torpedo': '#FF3B3B',        // Акцент "торпеда"
        'radio': '#FFC857',          // Акцент "радио-янтарь"
        'mist': '#93A3B3',           // Туман/текст вторичный
        'foam': '#E6EEF7',           // Пена/текст основной
        'mute': '#5A728A',           // Немой синий (нейтр.)
        'success': '#2ECC71',        // Успех спокойный
        'info': '#3BA3FF',           // Инфо холодный
        
        // Градиенты
        'steel-depth': 'linear-gradient(180deg, #0B1214 0%, #111820 100%)',
        'sonar-sweep': 'radial-gradient(circle, rgba(0,224,140,0.12) 0%, transparent 70%)',
      },
      fontFamily: {
        'heading': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['IBM Plex Mono', 'monospace'],
      },
      fontSize: {
        'h1': ['22px', { lineHeight: '1.4', fontWeight: '600' }],
        'h2': ['18px', { lineHeight: '1.4', fontWeight: '600' }],
        'h3': ['16px', { lineHeight: '1.4', fontWeight: '600' }],
        'body': ['14px', { lineHeight: '1.5' }],
        'secondary': ['13px', { lineHeight: '1.5' }],
        'caption': ['12px', { lineHeight: '1.4' }],
      },
      spacing: {
        'cell': '36px',
        'cell-sm': '32px',
        'cell-lg': '40px',
        'cell-mini': '22px',
        'cell-xs': '28px',
      },
      borderRadius: {
        'cell': '6px',
        'card': '10px',
        'modal': '14px',
      },
      boxShadow: {
        'steel': '0 8px 24px rgba(0,0,0,0.35)',
        'sonar': '0 0 12px rgba(0,224,140,0.3)',
        'torpedo': '0 0 12px rgba(255,59,59,0.3)',
        'steel-inset': 'inset 0 1px 0 #273140',
      },
      animation: {
        'sonar-ping': 'sonar-ping 2s ease-in-out infinite',
        'torpedo-hit': 'torpedo-hit 0.3s ease-out',
        'miss-splash': 'miss-splash 0.2s ease-out',
        'steel-shimmer': 'steel-shimmer 2s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'sonar-ping': {
          '0%, 100%': { 
            transform: 'scale(1)',
            opacity: '1'
          },
          '50%': { 
            transform: 'scale(1.1)',
            opacity: '0.7'
          }
        },
        'torpedo-hit': {
          '0%': { 
            transform: 'scale(0) rotate(0deg)',
            opacity: '0'
          },
          '50%': { 
            transform: 'scale(1.2) rotate(180deg)',
            opacity: '1'
          },
          '100%': { 
            transform: 'scale(1) rotate(45deg)',
            opacity: '1'
          }
        },
        'miss-splash': {
          '0%': { 
            transform: 'scale(0)',
            opacity: '0'
          },
          '100%': { 
            transform: 'scale(1)',
            opacity: '1'
          }
        },
        'steel-shimmer': {
          '0%': { 
            backgroundPosition: '-200% 0'
          },
          '100%': { 
            backgroundPosition: '200% 0'
          }
        }
      },
      backgroundImage: {
        'steel-depth': 'linear-gradient(180deg, #0B1214 0%, #111820 100%)',
        'sonar-sweep': 'radial-gradient(circle, rgba(0,224,140,0.12) 0%, transparent 70%)',
        'grain': 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.02\'/%3E%3C/svg%3E")',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [
    // Плагин для CSS-переменных
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.bg-steel-depth': {
          background: 'linear-gradient(180deg, #0B1214 0%, #111820 100%)',
        },
        '.bg-sonar-sweep': {
          background: 'radial-gradient(circle, rgba(0,224,140,0.12) 0%, transparent 70%)',
        },
        '.text-shadow-steel': {
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
        },
        '.selection-sonar': {
          '&::selection': {
            backgroundColor: 'rgba(0,224,140,0.3)',
          },
        },
      }
      addUtilities(newUtilities)
    }
  ],
}
