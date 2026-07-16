/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#07111f',
          900: '#0c1727',
          800: '#14233a',
        },
        accent: {
          50: '#eff8ff',
          100: '#d9ecff',
          200: '#b8dcff',
          300: '#86c2ff',
          400: '#4fa1ff',
          500: '#2184ff',
          600: '#1569e0',
          700: '#1152b4',
        },
      },
      boxShadow: {
        glow: '0 20px 60px rgba(33, 132, 255, 0.18)',
      },
      backgroundImage: {
        'mesh': 'radial-gradient(circle at top left, rgba(33,132,255,0.22), transparent 30%), radial-gradient(circle at top right, rgba(111, 193, 255, 0.18), transparent 28%), linear-gradient(180deg, #07111f 0%, #0c1727 100%)',
      },
    },
  },
  plugins: [],
};
