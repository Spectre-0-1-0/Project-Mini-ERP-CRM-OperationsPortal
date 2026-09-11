/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        enterprise: {
          50: '#F0F7F7',
          100: '#DDEFEF',
          500: '#1D827F',
          600: '#176B68', // Deep Enterprise Teal Accent per spec
          700: '#125452',
          800: '#0E403F',
          900: '#0B3332',
        },
        surface: {
          bg: '#F4F5F2',
          card: '#FFFFFF',
          ink: '#17202A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
