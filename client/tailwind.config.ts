import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        base: "#1e1b2e",
        highlight: "#2a273f",
        press: "#000",
        "elevated-highlight": "#5d6fc5",
        "elevated-hover": "#455abf",

        "text-base": "#d9bde1",
        subdued: "#a0a2b3",

        positive: "#a6a6d0",
        accent: "#7ec4cf",
        negative: "#ed2c3f",
      },
      fontFamily: {
        pixelated: ["pixelated"],
      },
    },
  },
  plugins: [],
} satisfies Config;
