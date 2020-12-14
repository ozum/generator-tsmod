module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["<rootDir>/generators/", "<rootDir>/node_modules/", "/test-helper/", "/__test__/", "<rootDir>/.eslintrc.js"],
};
