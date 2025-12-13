/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // This forces Tailwind to use 'Inter' as the default font
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}