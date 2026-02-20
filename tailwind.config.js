/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark mode (default)
        dark: {
          bg: '#0D1117',
          surface: '#161B22',
          border: '#30363D',
        },
        // Light mode
        light: {
          bg: '#FAFBFC',
          surface: '#FFFFFF',
        },
        // Accent colors
        primary: {
          DEFAULT: '#1E6853',
          50: '#E8F5F1',
          100: '#D1EBE3',
          200: '#A3D7C7',
          300: '#75C3AB',
          400: '#47AF8F',
          500: '#1E6853',
          600: '#185442',
          700: '#124032',
          800: '#0C2B21',
          900: '#061711',
        },
        secondary: {
          DEFAULT: '#C9A227',
          50: '#FCF8E8',
          100: '#F9F1D1',
          200: '#F3E3A3',
          300: '#EDD575',
          400: '#E7C747',
          500: '#C9A227',
          600: '#A1821F',
          700: '#796217',
          800: '#51410F',
          900: '#282108',
        },
        text: {
          primary: '#E6EDF3',
          secondary: '#8B949E',
          dark: '#1F2328',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        urdu: ['Noto Nastaliq Urdu', 'serif'],
        arabic: ['Amiri', 'Noto Naskh Arabic', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.25rem', { lineHeight: '1.75rem' }],
        xl: ['1.5rem', { lineHeight: '2rem' }],
        '2xl': ['2rem', { lineHeight: '2.5rem' }],
      },
      spacing: {
        'player': '60px',
        'nav': '64px',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
