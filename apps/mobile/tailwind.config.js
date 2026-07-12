/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Palette Armali — cf. apps/web/src/styles/element/index.scss
        primary: {
          DEFAULT: "#4873a2",
          light: "#6f94b8",
          dark: "#395c81",
        },
        success: "#4d884e",
        danger: "#ac5050",
        armali: {
          purple: "#9f6de0",
          pink: "#e06d84",
          teal: "#4d884e",
          yellow: "#caab43",
          orange: "#dc8137",
          indigo: "#3d7cd4",
        },
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "24px",
      },
    },
  },
  plugins: [],
}