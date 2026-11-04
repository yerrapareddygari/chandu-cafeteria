/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        kpit: {
          green: {
            primary: "#B0FF45",
            bright: "#8FDB00",
            dark: "#428003",
            50: "#F4FFE0",
            100: "#E6FFC2",
            200: "#CFFF8F",
          },
          purple: {
            primary: "#753DFF",
            dark: "#622AD8",
            50: "#F0E8FF",
            100: "#E3D8FF",
            200: "#AB8AFF",
          },
          black: "#161718",
          "dark-gray": "#4D5154",
          "light-gray": "#E6E7E8",
          "mid-gray": "#7F7F7F",
        },
      },
      fontFamily: {
        sans: ["Work Sans", "Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-soft": "pulseSoft 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [],
};