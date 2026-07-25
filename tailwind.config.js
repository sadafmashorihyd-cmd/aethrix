/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        void:     '#03030A',
        obsidian: '#08081A',
        midnight: '#0F0D25',
        ghost:    '#EAE6F2',
        dim:      '#9490A8',
        cyan:     '#00E5FF',
        violet:   '#B57BFF',
        ember:    '#FF6B35',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans:    ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
