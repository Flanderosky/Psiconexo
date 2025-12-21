/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Esto fuerza a usar Inter como la fuente principal "sans"
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Opcional: Definimos un negro "Apple" (no es #000000 puro, es un gris muy profundo)
        // Usaremos zinc-950 de Tailwind que ya es muy bueno, pero aquí podrías personalizar.
      }
    },
  },
  plugins: [],
}