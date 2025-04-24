// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      animation: {
        progressbar: "progressanim 2s linear infinite",
      },
      keyframes: {
        progressanim: {
          "0%": { backgroundPosition: "50px 50px" },
          "100%": { backgroundPosition: "0 0" },
        },
      },
    },
  },
  plugins: [],
};
