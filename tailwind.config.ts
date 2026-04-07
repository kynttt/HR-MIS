import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "Manrope", "Segoe UI", "sans-serif"],
        display: ["var(--font-display)", "Manrope", "Segoe UI", "sans-serif"],
        mono: ["var(--font-mono)", "Source Code Pro", "Menlo", "monospace"]
      },
      colors: {
        brand: {
          50: "#f1efff",
          100: "#d6d9fc",
          500: "#533afd",
          700: "#4434d4",
          900: "#2e2b8c"
        }
      }
    }
  },
  plugins: []
};

export default config;
