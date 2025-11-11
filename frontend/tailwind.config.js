/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  // Dark mode enabled by default (class strategy for future flexibility)
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        // Replace the default sans font stack with Cabinet Grotesk
        sans: ['"Cabinet Grotesk"', "system-ui", "sans-serif"],
      },
      colors: {
        "nagahama-blue": "rgb(30, 64, 175)",
        // Dark mode color palette
        "dark-bg": "#1a1a1a",
        "dark-surface": "#2d2d2d",
        "dark-border": "#3a3a3a",
        "dark-text": "#e0e0e0",
        "dark-text-secondary": "#a0a0a0",
      },
      backgroundImage: {
        "nagahama-gradient": "linear-gradient(90deg, rgba(30, 64, 175, 0) 0%, rgba(30, 64, 175, 0.4) 100%)",
        // Dark mode gradient
        "dark-gradient": "linear-gradient(90deg, rgba(26, 26, 26, 1) 0%, rgba(45, 45, 45, 1) 100%)",
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
