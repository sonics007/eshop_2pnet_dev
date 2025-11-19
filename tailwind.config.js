/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0B1F3A',
          accent: '#2CD5C4',
          glow: '#9AE8DF'
        }
      },
      boxShadow: {
        card: '0 20px 45px rgba(15,23,42,0.08)'
      }
    }
  },
  plugins: []
};
