import Generator from "../generator";
import type { OptionNames } from "../options";

/** Enables LintStaged support. */
export default class extends Generator {
  protected static optionNames: OptionNames = [];

  protected configuring(): void {
    this.copyConfig("lint-staged.config.js");
    this.copyDependencies("lint-staged");
  }
}
