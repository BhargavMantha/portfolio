const colors = require("tailwindcss/colors");

module.exports = {
  prefix: "",
  purge: {
    content: ["./src/**/*.{html,ts}"]
  },
  darkMode: "class", // or 'media' or 'class'
  variants: {
    extend: {}
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
  function({ addUtilities }) {
    const extendUnderline = {
      ".underline": {
        textDecoration: "underline",
        "text-decoration-color": rgba(16, 185, 129)
      }
    };
    addUtilities(extendUnderline);
  },
  theme: {
    screens: {
      sm: "480px",
      md: "768px",
      lg: "976px",
      xl: "1440px"
    }
  }
};
