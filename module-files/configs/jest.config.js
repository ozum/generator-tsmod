const ignorePatterns = [
  "<rootDir>/generators/",
  "<rootDir>/node_modules/",
  "<rootDir>/node_modules.nosync/",
  "/test-helper/",
  "/__test__/",
];

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ignorePatterns,
  coveragePathIgnorePatterns: ignorePatterns,
  modulePathIgnorePatterns: ["<rootDir>/node_modules.nosync/"],
};
