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
      keyframes: {
        pulse: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.7 },
        },
      },
      animation: {
        "pulse-slow": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
