import Generator from "../generator";
import type { OptionNames } from "../options";

/** Enables and configures ESLint by adding scripts and dependebcies from this module's `package.json`.  */
export default class extends Generator {
  protected static optionNames: OptionNames = [];

  /** Copies dependencies from this module to target module's package.json. Also modifies configurations. */
  protected configuring(): void {
    this.copyDependencies(
      "@typescript-eslint/eslint-plugin",
      "@typescript-eslint/parser",
      "eslint",
      "eslint-config-airbnb-base",
      "eslint-config-prettier",
      "eslint-plugin-import",
      "eslint-plugin-jest",
      "eslint-plugin-prettier",
      "prettier"
    );
    this.copyScripts("format", "lint");
    this.copyTemplate(".prettierignore", ".prettierignore");
    this.copyConfig("_eslintrc.js", ".eslintrc.js");
    this.copyConfig("_prettier.config.js", "prettier.config.js");
  }
}
