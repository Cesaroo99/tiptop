/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        ink: "var(--text)",
        muted: "var(--text-secondary)",
        accent: "var(--accent)",
        yellow: "var(--yellow)",
        danger: "var(--danger)",
        success: "var(--success)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        display: ["2.5rem", { lineHeight: "1.08", letterSpacing: "-0.04em", fontWeight: "700" }],
        h1: ["1.75rem", { lineHeight: "1.2", letterSpacing: "-0.03em", fontWeight: "700" }],
        stat: ["2.25rem", { lineHeight: "1.05", letterSpacing: "-0.045em", fontWeight: "700" }],
      },
      borderRadius: {
        card: "20px",
        pill: "999px",
      },
      boxShadow: {
        card: "0 10px 28px rgba(28, 50, 90, 0.07)",
      },
    },
  },
  plugins: [],
};
