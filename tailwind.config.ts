import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 16px 0 rgba(0,0,0,0.07)",
        "card-hover": "0 4px 24px 0 rgba(0,0,0,0.12)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateX(-50%) translateY(8px)" },
          "100%": { opacity: "1", transform: "translateX(-50%) translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease forwards",
      },
      spacing: {
        "safe-or-4": "max(1rem, env(safe-area-inset-top, 1rem))",
        "safe-or-2": "max(0.5rem, env(safe-area-inset-bottom, 0.5rem))",
      },
    },
  },
  plugins: [],
};
export default config;
