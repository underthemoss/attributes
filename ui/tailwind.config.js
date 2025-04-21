module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#10B981', // teal accent for highlights
        sidebar: '#fff',   // sidebar and background white
        border: '#e5e7eb', // light gray border
        text: '#111827',   // primary text
        subtext: '#6b7280',// secondary text
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
