/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Современная цветовая палитра
        'primary': {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        'secondary': {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        'accent': {
          'blue': '#3b82f6',
          'cyan': '#06b6d4',
          'teal': '#14b8a6',
          'emerald': '#10b981',
          'lime': '#84cc16',
          'yellow': '#eab308',
          'orange': '#f97316',
          'red': '#ef4444',
          'pink': '#ec4899',
          'purple': '#a855f7',
          'indigo': '#6366f1',
        },
        // Семантические цвета
        'success': '#10b981',
        'warning': '#f59e0b',
        'error': '#ef4444',
        'info': '#3b82f6',
        
        // Фоны
        'bg': {
          'primary': '#ffffff',
          'secondary': '#f8fafc',
          'tertiary': '#f1f5f9',
          'dark': '#0f172a',
          'darker': '#020617',
        },
        
        // Текст
        'text': {
          'primary': '#0f172a',
          'secondary': '#475569',
          'tertiary': '#94a3b8',
          'inverse': '#ffffff',
        },
        
        // Границы
        'border': {
          'light': '#e2e8f0',
          'medium': '#cbd5e1',
          'dark': '#94a3b8',
        },
        
        // Игровые цвета (обновленные)
        'game': {
          'water': '#0ea5e9',
          'ship': '#6366f1',
          'hit': '#ef4444',
          'miss': '#94a3b8',
          'sunk': '#dc2626',
          'highlight': '#fbbf24',
        },
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'heading': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      spacing: {
        'cell': '34px',
        'cell-sm': '28px',
        'cell-lg': '40px',
        'cell-mini': '20px',
      },
      borderRadius: {
        'none': '0px',
        'sm': '0.125rem',
        'DEFAULT': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        'full': '9999px',
        'card': '1rem',
        'cell': '0.5rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        'none': 'none',
        // Игровые тени
        'game': {
          'glow': '0 0 20px rgba(59, 130, 246, 0.3)',
          'hit': '0 0 20px rgba(239, 68, 68, 0.4)',
          'miss': '0 0 10px rgba(148, 163, 184, 0.3)',
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'bounce-in': 'bounce-in 0.6s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'hit-explosion': 'hit-explosion 0.4s ease-out',
        'miss-ripple': 'miss-ripple 0.3s ease-out',
        'ship-float': 'ship-float 3s ease-in-out infinite',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'bounce-in': {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.02)' },
        },
        'hit-explosion': {
          '0%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
          '25%': { transform: 'scale(1.3) rotate(90deg)', opacity: '0.8' },
          '50%': { transform: 'scale(1.1) rotate(180deg)', opacity: '0.6' },
          '75%': { transform: 'scale(1.05) rotate(270deg)', opacity: '0.8' },
          '100%': { transform: 'scale(1) rotate(360deg)', opacity: '1' },
        },
        'miss-ripple': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.2)', opacity: '0.6' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'ship-float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-3px)' },
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
    // Новые цвета
    'bg-primary-50', 'bg-primary-100', 'bg-primary-200', 'bg-primary-300', 'bg-primary-400', 'bg-primary-500', 'bg-primary-600', 'bg-primary-700', 'bg-primary-800', 'bg-primary-900',
    'bg-secondary-50', 'bg-secondary-100', 'bg-secondary-200', 'bg-secondary-300', 'bg-secondary-400', 'bg-secondary-500', 'bg-secondary-600', 'bg-secondary-700', 'bg-secondary-800', 'bg-secondary-900',
    'bg-accent-blue', 'bg-accent-cyan', 'bg-accent-teal', 'bg-accent-emerald', 'bg-accent-lime', 'bg-accent-yellow', 'bg-accent-orange', 'bg-accent-red', 'bg-accent-pink', 'bg-accent-purple', 'bg-accent-indigo',
    'bg-success', 'bg-warning', 'bg-error', 'bg-info',
    'bg-bg-primary', 'bg-bg-secondary', 'bg-bg-tertiary', 'bg-bg-dark', 'bg-bg-darker',
    'text-text-primary', 'text-text-secondary', 'text-text-tertiary', 'text-text-inverse',
    'border-border-light', 'border-border-medium', 'border-border-dark',
    'bg-game-water', 'bg-game-ship', 'bg-game-hit', 'bg-game-miss', 'bg-game-sunk', 'bg-game-highlight',
    // Кольца
    'ring-primary-500', 'ring-secondary-500', 'ring-accent-blue', 'ring-success', 'ring-warning', 'ring-error',
    // Тени
    'shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl', 'shadow-game-glow', 'shadow-game-hit', 'shadow-game-miss',
    // Анимации
    'animate-fade-in', 'animate-slide-up', 'animate-scale-in', 'animate-bounce-in', 'animate-pulse-glow', 'animate-hit-explosion', 'animate-miss-ripple', 'animate-ship-float',
  ],
};
