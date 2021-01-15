import Generator from "../generator";
import type { OptionNames } from "../options";

/** Enables `.editorconfig` by copying configuration file to project root. */
export default class extends Generator {
  protected static optionNames: OptionNames = [];

  protected configuring(): void {
    this.copyTemplate(".editorconfig", ".editorconfig");
  }
}
