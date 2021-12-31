import Generator from "../generator";
import { OptionNames } from "../options";

const dependencies = [
  "@typescript-eslint/eslint-plugin",
  "@typescript-eslint/parser",
  "eslint",
  "eslint-config-airbnb-base",
  "eslint-config-prettier",
  "eslint-plugin-import",
  "eslint-plugin-jest",
  "eslint-plugin-prettier",
  "prettier",
];

export default class extends Generator {
  protected static optionNames: OptionNames = [];

  protected writing(): void {
    this.copyConfig("_.eslintrc.js");
    this.copyConfig("_prettier.config.js");
    this.copyTemplate(".prettierignore", ".prettierignore");
    this.package.copyScripts(this.sourcePackage, ["format", "lint"]);
    this.package.copyDependencies(this.sourcePackage, dependencies);
  }
}
