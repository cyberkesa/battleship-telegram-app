/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Основные цвета
        'bg-deep': '#0a0a0a',
        'bg-graphite': '#1a1a1a',
        'steel': '#2a2a2a',
        'edge': '#3a3a3a',
        'mute': '#4a4a4a',
        
        // Акцентные цвета
        'foam': '#ffffff',
        'mist': '#a0a0a0',
        'sonar': '#ffc857',
        'torpedo': '#ff6b6b',
        'radio': '#4ecdc4',
        'info': '#45b7d1',
        
        // Состояния
        'sonar-sweep': 'rgba(255, 200, 87, 0.1)',
      },
      fontFamily: {
        'heading': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'h1': ['2rem', { lineHeight: '2.5rem', fontWeight: '700' }],
        'h2': ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],
        'h3': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'body': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
        'caption': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],
      },
      spacing: {
        'cell': '34px',
        'cell-sm': '28px',
        'cell-lg': '40px',
        'cell-mini': '20px',
      },
      borderRadius: {
        'card': '12px',
        'cell': '4px',
      },
      boxShadow: {
        'steel': '0 2px 4px rgba(0, 0, 0, 0.3)',
        'sonar': '0 0 8px rgba(255, 200, 87, 0.4)',
        'torpedo': '0 0 8px rgba(255, 107, 107, 0.4)',
      },
      animation: {
        'sonar-pulse': 'sonar-pulse 2s ease-in-out infinite',
        'torpedo-hit': 'torpedo-hit 0.3s ease-out',
        'miss-splash': 'miss-splash 0.2s ease-out',
      },
      keyframes: {
        'sonar-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
        'torpedo-hit': {
          '0%': { transform: 'scale(1) rotate(0deg)' },
          '50%': { transform: 'scale(1.2) rotate(180deg)' },
          '100%': { transform: 'scale(1) rotate(45deg)' },
        },
        'miss-splash': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
  safelist: [
    // Размеры ячеек
    'w-cell', 'h-cell', 'w-cell-sm', 'h-cell-sm', 'w-cell-lg', 'h-cell-lg', 'w-cell-mini', 'h-cell-mini',
    // Скругления
    'rounded-card', 'rounded-cell',
    // Цвета фона
    'bg-bg-deep', 'bg-bg-graphite', 'bg-steel', 'bg-edge', 'bg-mute',
    // Цвета текста
    'text-foam', 'text-mist', 'text-sonar', 'text-torpedo', 'text-radio', 'text-info',
    // Кольца
    'ring-edge', 'ring-sonar', 'ring-torpedo',
    // Тени
    'shadow-steel', 'shadow-sonar', 'shadow-torpedo',
    // Размеры текста
    'text-h1', 'text-h2', 'text-h3', 'text-body', 'text-caption',
    // Состояния
    'bg-sonar-sweep',
  ],
};
