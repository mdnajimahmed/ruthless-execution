import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      /* System font stack — no external font services per design language */
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
        mono: [
          '"SF Mono"',
          '"Fira Code"',
          '"Cascadia Code"',
          "Consolas",
          "monospace",
        ],
      },

      colors: {
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT:              "hsl(var(--sidebar-background))",
          foreground:           "hsl(var(--sidebar-foreground))",
          primary:              "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent:               "hsl(var(--sidebar-accent))",
          "accent-foreground":  "hsl(var(--sidebar-accent-foreground))",
          border:               "hsl(var(--sidebar-border))",
          ring:                 "hsl(var(--sidebar-ring))",
        },
        rag: {
          red:          "hsl(var(--rag-red))",
          "red-light":  "hsl(var(--rag-red-light))",
          amber:        "hsl(var(--rag-amber))",
          "amber-light":"hsl(var(--rag-amber-light))",
          green:        "hsl(var(--rag-green))",
          "green-light":"hsl(var(--rag-green-light))",
        },
        day: {
          office:    "hsl(var(--day-office))",
          nonoffice: "hsl(var(--day-nonoffice))",
          today:     "hsl(var(--day-today))",
        },
        grid: {
          border: "hsl(var(--grid-border))",
          header: "hsl(var(--grid-header))",
          hover:  "hsl(var(--grid-hover))",
        },
        "time-block": {
          DEFAULT: "hsl(var(--time-block))",
          light:   "hsl(var(--time-block-light))",
        },
      },

      borderRadius: {
        /* 10px base → cards/panels/modals */
        lg: "var(--radius)",
        /* 8px → buttons, inputs */
        md: "calc(var(--radius) - 2px)",
        /* 6px → tooltips */
        sm: "calc(var(--radius) - 4px)",
      },

      boxShadow: {
        sm:           "0 1px 3px rgba(0,0,0,0.08)",
        md:           "0 4px 12px rgba(0,0,0,0.10)",
        "card-hover": "0 6px 20px rgba(20,184,166,0.15)",
        modal:        "0 20px 60px rgba(0,0,0,0.18)",
        header:       "0 2px 8px rgba(0,0,0,0.12)",
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "slide-in": {
          from: { transform: "translateY(-8px)", opacity: "0" },
          to:   { transform: "translateY(0)",    opacity: "1" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "calc(400px + 100%) 0" },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "fade-in":        "fade-in 0.2s ease-out",
        "slide-in":       "slide-in 0.2s cubic-bezier(0.16,1,0.3,1)",
        shimmer:          "shimmer 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
