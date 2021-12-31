import Generator from "../generator";
import { OptionNames } from "../options";

/** Enables LintStaged support. */
export default class extends Generator {
  protected static optionNames: OptionNames = [];

  protected configuring(): void {
    this.copyConfig("lint-staged.config.js");
    this.package.copyDependencies(this.sourcePackage, ["lint-staged"]);
  }
}
