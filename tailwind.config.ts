import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        elder: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          500: "#0284c7",
          600: "#0369a1",
          700: "#075985",
          900: "#0c4a6e",
        },
        care: {
          emerald: "#059669",
          amber: "#d97706",
          rose: "#e11d48",
          indigo: "#4f46e5",
        },
      },
      fontSize: {
        "elder-base": "1.25rem", // 20px
        "elder-lg": "1.5rem",   // 24px
        "elder-xl": "1.875rem", // 30px
        "elder-2xl": "2.25rem", // 36px
        "elder-3xl": "3rem",    // 48px
      },
    },
  },
  plugins: [],
};

export default config;
