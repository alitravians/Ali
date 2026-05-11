import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        tajawal: ["var(--font-tajawal)", "system-ui", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#8b5cf6",
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
      },
      keyframes: {
        "fade-in": { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "pop": { "0%": { transform: "scale(0.9)" }, "60%": { transform: "scale(1.05)" }, "100%": { transform: "scale(1)" } },
      },
      animation: {
        "fade-in": "fade-in .4s ease-out both",
        "pop": "pop .4s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
