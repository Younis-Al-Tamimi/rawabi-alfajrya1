/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: { center: true, padding: { DEFAULT: '1rem', sm: '1.5rem', lg: '2rem' } },
    extend: {
      colors: {
        forest: {
          50: '#f5f7f3', 100: '#e8ebe4', 200: '#cdd4c6', 300: '#a8b59e',
          400: '#7d8e72', 500: '#5a6d50', 600: '#46543f', 700: '#3f4b3c',
          800: '#333c30', 900: '#2a3127', 950: '#1a1f17',
        },
        ivory: {
          50: '#ffffff', 100: '#fefdfb', 200: '#faf7ef', 300: '#f5f0e3', 400: '#efe9dc', 500: '#e3dac6',
        },
        gold: {
          50: '#faf6ed', 100: '#f0e6cf', 200: '#e0cd9f', 300: '#cbb477',
          400: '#b99b6b', 500: '#a8854f', 600: '#8a6c3e', 700: '#6b5330',
        },
        parchment: '#efe9dc',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Jost', 'Poppins', 'system-ui', 'sans-serif'],
        arabicSerif: ['Marhey', 'serif'],
        arabicSans: ['Marhey', 'sans-serif'],
      },
      boxShadow: {
        'forest-sm': '0 1px 3px rgba(63, 75, 60, 0.12)',
        'forest': '0 4px 16px rgba(63, 75, 60, 0.15)',
        'forest-lg': '0 12px 40px rgba(63, 75, 60, 0.18)',
      },
      animation: { 'fade-in': 'fadeIn 0.4s ease-out', 'shimmer': 'shimmer 1.5s infinite linear' },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
}
