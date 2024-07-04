/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        "all-sides": "0 0 5px rgba(0, 0, 0, 0.25)",
      },
    },
  },
  plugins: [],
};
