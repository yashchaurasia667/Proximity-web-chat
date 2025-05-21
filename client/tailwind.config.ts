/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "base": "#1e1b2e",
        "highlight": "#2a273f",
        "elevated-highlight": "#5d6fc5",
        "press": "#000",

        "text-base": "d9dbe1",
        "subdued": "#a0a2b3",
        "positive": "#a6a6d0",
        "accent": "#7ec4cf",
        "negative": "#ed2c3f",
      },
    },
  },
  plugins: [],
};
