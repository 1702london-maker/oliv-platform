import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#251f19",
        cocoa: "#6f5c48",
        champagne: "#f6efe5",
        linen: "#fbf7f1",
        gold: "#b68a45"
      },
      fontFamily: {
        sans: ["Montserrat", "ui-sans-serif", "system-ui"],
        serif: ["Cormorant Garamond", "Georgia", "serif"]
      }
    }
  },
  plugins: []
};

export default config;
