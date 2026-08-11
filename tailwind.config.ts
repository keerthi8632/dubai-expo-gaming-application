import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#B31217",
          redDark: "#4A0508",
          black: "#0B0B0B",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        orbitron: ["var(--font-orbitron)", "sans-serif"],
        "space-grotesk": ["var(--font-space-grotesk)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
