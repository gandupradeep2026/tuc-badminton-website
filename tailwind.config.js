/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        tuc: {
          brand: '#005A36', // Official TU Chemnitz Corporate Forest Green
          dark: '#003D24',
          darker: '#002617',
          light: '#007849',
          accent: '#10B981',
          50: '#f0fdf6',
          100: '#dbfbe8',
          200: '#b8f5d1',
          300: '#7fe8ae',
          400: '#3dd186',
          500: '#14b866',
          600: '#09944f',
          700: '#097540',
          800: '#005A36', // TU Chemnitz official forest green
          850: '#004c2d',
          900: '#003e24',
          950: '#002516',
        },
        slate: {
          850: '#151f32',
          950: '#0b1120',
        },
        athletic: {
          yellow: '#facc15',
          lime: '#84cc16',
          cyan: '#06b6d4',
          orange: '#f97316',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
        din: ['DIN Alternate', 'DIN Pro', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-tuc': '0 0 25px -5px rgba(0, 90, 54, 0.4)',
        'glow-mint': '0 0 25px -5px rgba(16, 185, 129, 0.4)',
      },
      animation: {
        'shuttle-float': 'float 3s ease-in-out infinite',
        'pulse-subtle': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
