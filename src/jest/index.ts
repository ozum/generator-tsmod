import Generator from "../generator";
import { OptionNames } from "../options";

/** Adds Jest configuration to project. */
export default class extends Generator {
  protected static optionNames: OptionNames = [];

  /** Copy dependencies and configuration files and add `test` script to `package.json`. */
  protected configuring(): void {
    this.package.copyDependencies(this.sourcePackage, ["@types/jest", "jest", "ts-jest"]);
    this.copyConfig("jest.config.js");
    this.copyTemplate("test/tsconfig.json", "test/tsconfig.json");
    this.package.copyScripts(this.sourcePackage, ["test"]);
  }
}
