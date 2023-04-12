module.exports = {
  content: ["./ext/**/*.{html,js,mjs}", "./src/**/*.{js,mjs,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/typography")],
};
