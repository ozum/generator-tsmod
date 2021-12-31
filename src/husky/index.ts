import Generator from "../generator";
import { OptionNames } from "../options";

/** Enables husky support. */
export default class extends Generator {
  protected static optionNames: OptionNames = [];

  protected configuring(): void {
    this.copyTemplate(".husky/commit-msg", ".husky/commit-msg");
    this.copyTemplate(".husky/pre-commit", ".husky/pre-commit");
    this.copyTemplate(".husky/prepare-commit-msg", ".husky/prepare-commit-msg");

    this.package.copyDependencies(this.sourcePackage, ["husky", "pinst", "is-ci"]);
    this.package.copyScripts(this.sourcePackage, ["prepublishOnly", "postpublish", "postinstall"]);
  }

  protected end(): void {
    this.spawnCommand("node_modules/.bin/husky", ["install"]);
  }
}
