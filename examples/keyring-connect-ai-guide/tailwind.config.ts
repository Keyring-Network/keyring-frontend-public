import type { Config } from "tailwindcss";

const config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        keyring: {
          dark: "#1a2332",
          "dark-alt": "#1B3A4B",
          body: "#4b5563",
          muted: "#6b7280",
          "muted-light": "#9ca3af",
          label: "#71717A",
          heading: "#111827",
          border: "#e5e7eb",
          "bg-page": "#eff3f8",
          "bg-light": "#f3f4f6",
          "bg-badge-expired": "#f0f4f8",
          "bg-valid": "#dcfce7",
          "border-valid": "#bbf7d0",
          "text-valid": "#166534",
          "border-expired": "#374151",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
      },
      keyframes: {
        spin: {
          to: { transform: "rotate(360deg)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
