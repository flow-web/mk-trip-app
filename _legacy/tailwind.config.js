/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#F5F5F7",
          dark: "#0F0F11",
        },
        card: {
          DEFAULT: "#FFFFFF",
          dark: "#1C1C1E",
        },
        surface: {
          dark: "#2C2C2E",
        },
        primary: {
          DEFAULT: "#FF6B4A",
          muted: "rgba(255, 107, 74, 0.15)",
        },
        secondary: {
          DEFAULT: "#2EC4A8",
          muted: "rgba(46, 196, 168, 0.12)",
        },
        txt: {
          main: "#F2F2F7",
          muted: "#8E8E93",
          dark: "#1C1C1E",
        },
        success: "#34C759",
        warning: "#FFD60A",
        danger: "#FF453A",
      },
      borderRadius: {
        bento: "24px",
        pill: "50px",
      },
      fontFamily: {
        sans: ["Inter", "System"],
      },
    },
  },
  plugins: [],
};
