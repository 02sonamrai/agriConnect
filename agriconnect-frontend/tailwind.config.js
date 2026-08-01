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
          light: '#4d7c0f', // Lime green
          DEFAULT: '#3f6212', // Olive green
          dark: '#1e293b', // Slate
        }
      }
    },
  },
  plugins: [],
}
