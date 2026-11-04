/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff1f2',
          100: '#ffe1e3',
          200: '#ffc7cb',
          300: '#ffa0a8',
          400: '#ff6b78',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
          950: '#4c0519',
        },
        ink: {
          50: '#f5f6f8',
          100: '#e9ebef',
          200: '#cfd5de',
          300: '#a8b2c2',
          400: '#73819a',
          500: '#54648a',
          600: '#3e4d70',
          700: '#2b3554',
          800: '#1c2540',
          900: '#0f1830',
          950: '#080d1f',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 8px -2px rgba(15, 24, 48, 0.08), 0 4px 16px -4px rgba(15, 24, 48, 0.06)',
        card: '0 4px 24px -8px rgba(15, 24, 48, 0.12), 0 2px 8px -2px rgba(15, 24, 48, 0.08)',
        lift: '0 12px 40px -12px rgba(15, 24, 48, 0.20), 0 4px 16px -4px rgba(15, 24, 48, 0.10)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out forwards',
        'fade-in': 'fade-in 0.6s ease-out forwards',
        'scale-in': 'scale-in 0.4s ease-out forwards',
      },
    },
  },
  plugins: [],
};
