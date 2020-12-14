import Generator from "../generator";

/** Enables `.editorconfig` by copying configuration file to project root. */
export default class extends Generator {
  protected configuring(): void {
    this.copyTemplate(".editorconfig", ".editorconfig");
  }
}
