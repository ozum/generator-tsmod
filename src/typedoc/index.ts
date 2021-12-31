import Generator from "../generator";
import { OptionNames } from "../options";

/**  Configures project for TypeDoc. */
export default class extends Generator {
  protected static optionNames: OptionNames = [];

  protected configuring(): void {
    this.package.copyDependencies();

    // Delete dependencies added by previous versions of this generator.
    this.package.removeDependencies(["typedoc-neo-theme"]);
  }
}
