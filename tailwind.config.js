/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}

module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#4f46e5',      // Indigo-600, main brand color
        primaryLight: '#6366f1', // Indigo-500, lighter shade
        accent: '#fbbf24',       // Amber-400, accent/yellow
        neutralDark: '#374151',  // Gray-700, for text
        neutralLight: '#f3f4f6', // Gray-100, background
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
