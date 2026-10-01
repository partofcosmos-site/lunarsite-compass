import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        space: {
          950: "#030712",
          900: "#0B0F19",
          850: "#0F172A",
          800: "#1E293B",
          700: "#334155",
          600: "#475569",
        },
        lunar: {
          gold: "#F59E0B",
          cyan: "#38BDF8",
          emerald: "#10B981",
          rose: "#F43F5E",
          violet: "#8B5CF6",
          amber: "#D97706",
          silver: "#E2E8F0",
          dim: "#64748B",
        },
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(56, 189, 248, 0.25)",
        goldGlow: "0 0 25px -5px rgba(245, 158, 11, 0.25)",
        emeraldGlow: "0 0 25px -5px rgba(16, 185, 129, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
