/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bit-primary': '#1e3a8a',
        'bit-secondary': '#3b82f6',
      }
    },
  },
  plugins: [],
}