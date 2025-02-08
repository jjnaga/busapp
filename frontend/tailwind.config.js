/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        "nagahama-blue": "rgb(30, 64, 175)",
      },
      backgroundImage: {
        "nagahama-gradient": "linear-gradient(90deg, rgba(30, 64, 175, 0) 0%, rgba(30, 64, 175, 0.4) 100%)",
      },
    },
  },
  plugins: [],
};
