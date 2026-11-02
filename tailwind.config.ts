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
        brand: {
          red: {
            DEFAULT: "#DC2626", // Primary Merah Kopi Noka
            50: "#FEF2F2",
            100: "#FEE2E2",
            200: "#FECACA",
            300: "#FCA5A5",
            400: "#F87171",
            500: "#EF4444",
            600: "#DC2626",
            700: "#B91C1C",
            800: "#991B1B",
            900: "#7F1D1D",
          },
          white: "#FFFFFF",
          cream: "#FDFBF7",
          ivory: "#F5F0E8",
          coffee: {
            DEFAULT: "#2C1810", // Cokelat Kopi Tua
            light: "#4A2E20",
            dark: "#1A0E0A",
            muted: "#6B4423",
          },
          caramel: {
            DEFAULT: "#C87D32", // Aksen Karamel
            light: "#E09B53",
            dark: "#9E5E1C",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-outfit)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
        card: "0 0 0 1px rgba(0, 0, 0, 0.05), 0 2px 8px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
