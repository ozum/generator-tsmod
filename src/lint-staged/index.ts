import Generator from "../generator";

/** Enables LintStaged support. */
export default class extends Generator {
  protected configuring(): void {
    this.copyConfig("lint-staged.config.js");
    this.copyDependencies("lint-staged");
  }
}
