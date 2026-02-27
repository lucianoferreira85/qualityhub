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
          subtle: "var(--color-brand-subtle)",
          glow: "var(--color-brand-glow)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
        },
        surface: {
          primary: "var(--color-bg-primary)",
          secondary: "var(--color-bg-secondary)",
          tertiary: "var(--color-bg-tertiary)",
          elevated: "var(--color-bg-elevated)",
        },
        foreground: {
          primary: "var(--color-fg-primary)",
          secondary: "var(--color-fg-secondary)",
          tertiary: "var(--color-fg-tertiary)",
        },
        stroke: {
          primary: "var(--color-stroke-primary)",
          secondary: "var(--color-stroke-secondary)",
          focus: "var(--color-stroke-focus)",
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
        sidebar: {
          DEFAULT: "var(--sidebar-bg)",
          hover: "var(--sidebar-bg-hover)",
          active: "var(--sidebar-bg-active)",
          fg: "var(--sidebar-fg)",
          "fg-active": "var(--sidebar-fg-active)",
          "fg-muted": "var(--sidebar-fg-muted)",
          border: "var(--sidebar-border)",
          accent: "var(--sidebar-accent)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        display: ["2.5rem", { lineHeight: "1.15", fontWeight: "700", letterSpacing: "-0.025em" }],
        "title-lg": ["1.75rem", { lineHeight: "1.25", fontWeight: "700", letterSpacing: "-0.02em" }],
        "title-1": ["1.5rem", { lineHeight: "1.3", fontWeight: "600", letterSpacing: "-0.015em" }],
        "title-2": ["1.25rem", { lineHeight: "1.4", fontWeight: "600", letterSpacing: "-0.01em" }],
        "title-3": ["1rem", { lineHeight: "1.5", fontWeight: "600" }],
        "body-1": ["0.875rem", { lineHeight: "1.5" }],
        "body-2": ["0.8125rem", { lineHeight: "1.5" }],
        "caption-1": ["0.75rem", { lineHeight: "1.5" }],
        "caption-2": ["0.625rem", { lineHeight: "1.5" }],
      },
      letterSpacing: {
        "tight-1": "-0.01em",
        "tight-2": "-0.02em",
        "tight-3": "-0.03em",
      },
      borderRadius: {
        card: "var(--radius-lg)",
        button: "var(--radius-md)",
        input: "var(--radius-md)",
        badge: "var(--radius-sm)",
        xl: "var(--radius-xl)",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        card: "var(--shadow-sm)",
        "card-hover": "var(--shadow-md)",
        "card-glow": "var(--shadow-brand)",
        "card-glow-lg": "var(--shadow-brand-lg)",
        elevated: "var(--shadow-md)",
        dialog: "var(--shadow-xl)",
        brand: "var(--shadow-brand)",
        "brand-lg": "var(--shadow-brand-lg)",
        sidebar: "1px 0 0 var(--sidebar-border)",
        "inner-glow": "inset 0 1px 0 rgba(255, 255, 255, 0.06)",
        "stat-card": "var(--shadow-sm), 0 0 0 1px var(--color-stroke-secondary)",
        "premium-card": "0 1px 3px rgba(15, 13, 26, 0.04), 0 0 0 1px var(--color-stroke-secondary)",
        "premium-card-hover": "0 8px 16px -4px rgba(15, 13, 26, 0.08), 0 4px 6px -2px rgba(15, 13, 26, 0.04), 0 0 0 1px var(--color-stroke-primary)",
        "sidebar-glow": "0 0 12px rgba(124, 58, 237, 0.15)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "dot-pattern": "radial-gradient(circle, var(--color-stroke-primary) 1px, transparent 1px)",
        shimmer:
          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 20%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 80%, transparent 100%)",
        "sidebar-gradient": "linear-gradient(180deg, var(--sidebar-gradient-from) 0%, var(--sidebar-gradient-to) 100%)",
      },
      backgroundSize: {
        "dot-sm": "24px 24px",
        "dot-md": "32px 32px",
      },
      backdropBlur: {
        xs: "4px",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-down": {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "scale-out": {
          "0%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(0.96)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 0 rgba(124, 58, 237, 0)" },
          "50%": { boxShadow: "0 0 20px rgba(124, 58, 237, 0.15)" },
        },
        "progress-indeterminate": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "fade-in-down": "fade-in-down 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "fade-in": "fade-in 0.25s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "fade-out": "fade-out 0.2s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "scale-in": "scale-in 0.25s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "scale-out": "scale-out 0.2s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "slide-in-right": "slide-in-right 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "slide-in-left": "slide-in-left 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        shimmer: "shimmer 2s linear infinite",
        "pulse-soft": "pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 3s ease-in-out infinite",
        glow: "glow 3s ease-in-out infinite",
        "progress-indeterminate": "progress-indeterminate 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        "120": "120ms",
        "250": "250ms",
        "400": "400ms",
      },
    },
  },
  plugins: [],
};

export default config;
