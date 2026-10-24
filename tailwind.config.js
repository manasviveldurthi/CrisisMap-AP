/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f2f6fa',
          100: '#e1eaf3',
          200: '#c5d7e7',
          300: '#9cbed8',
          400: '#6ea0c5',
          500: '#4e84b1',
          600: '#3c6b97',
          700: '#31557a',
          800: '#1b324c',
          900: '#0f2035',
          950: '#081321',
        },
        crisis: {
          red: '#dc2626',
          'red-light': '#fee2e2',
          orange: '#ea580c',
          amber: '#d97706',
          emerald: '#059669',
          blue: '#2563eb',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
