import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "var(--color-brand)",
          hover: "var(--color-brand-hover)",
          pressed: "var(--color-brand-pressed)",
          light: "var(--color-brand-light)",
          muted: "var(--color-brand-muted)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
        },
        surface: {
          primary: "var(--color-bg-primary)",
          secondary: "var(--color-bg-secondary)",
          tertiary: "var(--color-bg-tertiary)",
        },
        foreground: {
          primary: "var(--color-fg-primary)",
          secondary: "var(--color-fg-secondary)",
          tertiary: "var(--color-fg-tertiary)",
        },
        stroke: {
          primary: "var(--color-stroke-primary)",
          secondary: "var(--color-stroke-secondary)",
        },
        success: {
          DEFAULT: "var(--color-success)",
          bg: "var(--color-success-bg)",
          fg: "var(--color-success-fg)",
        },
        danger: {
          DEFAULT: "var(--color-danger)",
          bg: "var(--color-danger-bg)",
          fg: "var(--color-danger-fg)",
        },
        warning: {
          DEFAULT: "var(--color-warning)",
          bg: "var(--color-warning-bg)",
          fg: "var(--color-warning-fg)",
        },
        info: {
          DEFAULT: "#7C3AED",
          bg: "#EDE9FE",
          fg: "#5B21B6",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "Segoe UI", "sans-serif"],
      },
      fontSize: {
        display: ["2.5rem", { lineHeight: "1.2", fontWeight: "600" }],
        "title-lg": ["1.75rem", { lineHeight: "1.3", fontWeight: "600" }],
        "title-1": ["1.5rem", { lineHeight: "1.3", fontWeight: "600" }],
        "title-2": ["1.25rem", { lineHeight: "1.4", fontWeight: "600" }],
        "title-3": ["1rem", { lineHeight: "1.5", fontWeight: "600" }],
        "body-1": ["0.875rem", { lineHeight: "1.5" }],
        "body-2": ["0.75rem", { lineHeight: "1.5" }],
        "caption-1": ["0.75rem", { lineHeight: "1.5" }],
        "caption-2": ["0.625rem", { lineHeight: "1.5" }],
      },
      borderRadius: {
        card: "12px",
        button: "8px",
        input: "8px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
        "card-hover":
          "0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)",
        "card-glow":
          "0 4px 20px rgba(124, 58, 237, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)",
        "stat-card":
          "0 2px 12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.1)",
        dialog:
          "0 10px 25px rgba(0, 0, 0, 0.12), 0 4px 10px rgba(0, 0, 0, 0.08)",
        sidebar: "2px 0 8px rgba(0, 0, 0, 0.06)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
        "fade-in": "fade-in 0.3s ease-out forwards",
        "scale-in": "scale-in 0.3s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
