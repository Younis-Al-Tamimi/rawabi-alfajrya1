/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: { center: true, padding: { DEFAULT: '1rem', sm: '1.5rem', lg: '2rem' } },
    extend: {
      colors: {
        brand: {
          50: '#fdf5f3', 100: '#fbe6e1', 200: '#f6cdbf', 300: '#eea890',
          400: '#e07855', 500: '#d05a37', 600: '#ac3715', 700: '#8a2c12',
          800: '#5e1e0d', 900: '#421608', 950: '#260c04',
        },
        saffron: {
          50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
          400: '#f5a030', 500: '#f08018', 600: '#d96d10', 700: '#b4540c',
          800: '#8f4310', 900: '#733810', 950: '#421d04',
        },
        cream: {
          50: '#fffdf9', 100: '#fdf8ef', 200: '#faf2e0', 300: '#f4e7cc',
          400: '#ead7a8', 500: '#dcc282', 600: '#c6a45c', 700: '#a8854a',
        },
        espresso: {
          50: '#f6f5f3', 100: '#e8e3de', 200: '#d1c7be', 300: '#b0a195',
          400: '#8e7d6c', 500: '#70604f', 600: '#5a4d3f', 700: '#4a3e33',
          800: '#3d3329', 900: '#2a221b', 950: '#1a1410',
        },
        parchment: '#faf2e0',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Amiri', 'Georgia', 'serif'],
        sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
        arabic: ['Cairo', 'sans-serif'],
        arabicSerif: ['Amiri', 'serif'],
      },
      boxShadow: {
        'brand-sm': '0 1px 3px rgba(94, 30, 13, 0.12)',
        'brand': '0 4px 16px rgba(94, 30, 13, 0.15)',
        'brand-lg': '0 12px 40px rgba(94, 30, 13, 0.18)',
        'brand-xl': '0 24px 60px rgba(94, 30, 13, 0.22)',
        'amber': '0 4px 16px rgba(245, 160, 48, 0.25)',
        'amber-lg': '0 12px 40px rgba(245, 160, 48, 0.30)',
        'glass': '0 8px 32px rgba(94, 30, 13, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'shimmer': 'shimmer 1.5s infinite linear',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 10s ease-in-out infinite',
        'pulse-gentle': 'pulseGentle 3s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'bounce-soft': 'bounceSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        pulseGentle: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.7' } },
        bounceSoft: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #ac3715 0%, #de5f22 100%)',
        'amber-gradient': 'linear-gradient(135deg, #f5a030 0%, #f08018 100%)',
        'hero-gradient': 'linear-gradient(180deg, rgba(66,22,8,0.75) 0%, rgba(94,30,13,0.5) 50%, rgba(66,22,8,0.85) 100%)',
        'card-shine': 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)',
        'cream-gradient': 'linear-gradient(180deg, #fffdf9 0%, #faf2e0 100%)',
      },
    },
  },
  plugins: [],
}
