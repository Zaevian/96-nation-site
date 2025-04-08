/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: '#231F20',
          accent: '#DC4405',
        },
        fontFamily: {
          primary: ['Futura PT', 'Futura', 'sans-serif'],
        },
        animation: {
          'scroll-reveal': 'scrollReveal 1s ease-in-out forwards',
          'fade-up': 'fadeUp 0.8s ease-in-out forwards',
        },
        keyframes: {
          scrollReveal: {
            '0%': { opacity: 0, transform: 'translateY(40px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' },
          },
          fadeUp: {
            '0%': { opacity: 0, transform: 'translateY(20px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' },
          },
        },
      },
    },
    plugins: [],
  }