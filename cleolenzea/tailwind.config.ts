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
        background: "#FFFDF5",
        surface: "#FFF5E1",
        primary: "#D4A574",
        "primary-dark": "#C4905E",
        accent: "#8BA888",
        "accent-dark": "#7A9777",
        "warm-charcoal": "#2D2A26",
        "soft-rose": "#E8C4B8",
        "muted-sky": "#B5C7D3",
        "light-moss": "#C5D5C5",
        "warm-gray": "#9A9590",
      },
      fontFamily: {
        heading: ["var(--font-lora)", "serif"],
        body: ["var(--font-dm-sans)", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        "card-lg": "25px",
        button: "12px",
      },
      transitionDuration: {
        DEFAULT: "300ms",
      },
      animation: {
        "float-slow": "float 6s ease-in-out infinite",
        "float-slower": "float 8s ease-in-out infinite",
        "breathe": "breathe 4s ease-in-out infinite",
        "fade-in": "fadeIn 0.6s ease-out",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
