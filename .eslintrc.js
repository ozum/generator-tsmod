module.exports = {
  extends: "./config/.eslintrc.js",

  // Do not check import location in template source code, because they are just templates before generated into their real places.
  overrides: [
    {
      files: ["**/templates/**"],
      rules: { "import/no-unresolved": "off" },
    },
  ],
};
