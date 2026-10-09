/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        base: {
          950: '#08090D',
          900: '#0B0D13',
          850: '#0F1219',
          800: '#12151D',
          750: '#161A24',
          700: '#1B202B',
          600: '#232936',
          500: '#2E3543',
          400: '#565F70',
          300: '#7A8393',
          200: '#A8AFBC',
          100: '#E4E7EC',
          50: '#F6F7F9',
        },
        accent: {
          cyan: '#22D3EE',
          blue: '#3B82F6',
          violet: '#818CF8',
        },
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #22D3EE 0%, #3B82F6 100%)',
        'accent-gradient-soft': 'linear-gradient(135deg, rgba(34,211,238,0.16) 0%, rgba(59,130,246,0.16) 100%)',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.04), 0 8px 24px -8px rgba(0,0,0,0.5)',
        'glow-accent': '0 0 20px -4px rgba(34,211,238,0.45)',
        panel: '0 4px 30px rgba(0,0,0,0.35)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        blink: {
          '0%, 80%, 100%': { transform: 'scale(0.7)', opacity: '0.4' },
          '40%': { transform: 'scale(1)', opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        blob: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -40px) scale(1.08)' },
          '66%': { transform: 'translate(-25px, 25px) scale(0.94)' },
        },
        'blob-slow': {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '50%': { transform: 'translate(-35px, 35px) scale(1.1)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'pop-in': 'pop-in 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        blink: 'blink 1.2s infinite ease-in-out',
        'slide-in-right': 'slide-in-right 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-left': 'slide-in-left 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        blob: 'blob 14s infinite ease-in-out',
        'blob-slow': 'blob-slow 20s infinite ease-in-out',
        shake: 'shake 0.4s ease-in-out',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
    addUtilities({
      '.scrollbar-hide': {
        '-ms-overflow-style': 'none',
        'scrollbar-width': 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      },
    });
  },
  ],
};



