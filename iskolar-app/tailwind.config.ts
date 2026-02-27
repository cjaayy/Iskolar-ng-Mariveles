import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FFFAF5",
          100: "#FDF4F5",
          200: "#FBE9E7",
          300: "#F5D6CC",
        },
        ocean: {
          50: "#EBF1F8",
          100: "#D0DEF0",
          200: "#A3BFE0",
          300: "#7BA3D1",
          400: "#4A6FA5",
          500: "#3A5A8A",
          600: "#2D4770",
          700: "#1F3355",
          800: "#14213D",
          900: "#0B1526",
        },
        peach: {
          50: "#FFF5EE",
          100: "#FFECD8",
          200: "#FFD9B3",
          300: "#E6B89C",
          400: "#D4956E",
          500: "#C17A4E",
        },
        sage: {
          50: "#F0F5F0",
          100: "#D8E8D8",
          200: "#B5D4B5",
          300: "#8FBE8F",
          400: "#6BA56B",
          500: "#4D8B4D",
        },
        coral: {
          50: "#FFF0EE",
          100: "#FFD9D4",
          200: "#FFB3A8",
          300: "#FF8A7A",
          400: "#E86555",
          500: "#D14D3D",
        },
        amber: {
          50: "#FFF8E6",
          100: "#FFEDB3",
          200: "#FFE080",
          300: "#FFD24D",
          400: "#F5C026",
          500: "#E0A800",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
        "card-bg": "var(--card-bg)",
        "card-border": "var(--card-border)",
        "input-bg": "var(--input-bg)",
        "input-border": "var(--input-border)",
        muted: "var(--muted)",
        "muted-fg": "var(--muted-fg)",
        accent: "var(--accent)",
        "accent-fg": "var(--accent-fg)",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        blob: "30% 70% 70% 30% / 30% 30% 70% 70%",
        "blob-2": "60% 40% 30% 70% / 60% 30% 70% 40%",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "blob-morph": {
          "0%": { borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%" },
          "25%": { borderRadius: "58% 42% 75% 25% / 76% 46% 54% 24%" },
          "50%": { borderRadius: "50% 50% 33% 67% / 55% 27% 73% 45%" },
          "75%": { borderRadius: "33% 67% 58% 42% / 63% 68% 32% 37%" },
          "100%": { borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
        "progress-fill": {
          "0%": { width: "0%" },
          "100%": { width: "var(--progress-width)" },
        },
        "check-pop": {
          "0%": { transform: "scale(0)" },
          "50%": { transform: "scale(1.2)" },
          "100%": { transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "toast-in": {
          "0%": { opacity: "0", transform: "translateX(100%) scale(0.95)" },
          "100%": { opacity: "1", transform: "translateX(0) scale(1)" },
        },
        "spinner-rotate": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
        "slide-in-right": "slide-in-right 0.4s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        float: "float 6s ease-in-out infinite",
        "blob-morph": "blob-morph 8s ease-in-out infinite",
        wiggle: "wiggle 3s ease-in-out infinite",
        "progress-fill": "progress-fill 1s ease-out forwards",
        "check-pop": "check-pop 0.3s ease-out",
        shimmer: "shimmer 2s infinite linear",
        "toast-in": "toast-in 0.4s ease-out",
        "spinner-rotate": "spinner-rotate 1s linear infinite",
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
        "soft-lg": "0 10px 40px -10px rgba(0, 0, 0, 0.1)",
        glow: "0 0 20px rgba(74, 111, 165, 0.15)",
        "inner-soft": "inset 0 2px 4px 0 rgba(0, 0, 0, 0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
