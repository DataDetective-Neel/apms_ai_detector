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
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Custom competition status colors
        status: {
          authentic: {
            bg: "#ecfdf5",
            border: "#10b981",
            text: "#065f46"
          },
          review: {
            bg: "#fefce8",
            border: "#eab308",
            text: "#854d0e"
          },
          suspected: {
            bg: "#fef2f2",
            border: "#ef4444",
            text: "#991b1b"
          },
          unavailable: {
            bg: "#f3f4f6",
            border: "#9ca3af",
            text: "#374151"
          }
        }
      },
    },
  },
  plugins: [],
};
export default config;
