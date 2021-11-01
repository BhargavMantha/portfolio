const colors = require("tailwindcss/colors");

module.exports = {
  mode: "jit",
  prefix: "",
  purge: {
    content: ["./src/**/*.{html,ts}"]
  },
  darkMode: "class", // or 'media' or 'class'
  variants: {
    extend: {
      transitionProperty: { width: "width" },
      animation: ["group-hover"]
    }
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
      sm: "320px",
      md: "768px",
      lg: "976px",
      xl: "1440px"
    },
    colors: {
      gray: colors.coolGray,
      cobalt: { 600: "#193549" },
      blue: colors.blue,
      red: colors.rose,
      pink: colors.fuchsia,
      white: colors.white,
      green: colors.green
    }
  }
};
