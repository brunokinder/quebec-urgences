import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0d1117",
          card: "#161b22",
          hover: "#1c2128",
          border: "#30363d",
          subtle: "#21262d",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
