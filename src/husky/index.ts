import Generator from "../generator";
import type { OptionNames } from "../options";

/** Enables husky support. */
export default class extends Generator {
  protected static optionNames: OptionNames = [];

  protected configuring(): void {
    this.copyTemplate(".husky/commit-msg", ".husky/commit-msg");
    this.copyTemplate(".husky/pre-commit", ".husky/pre-commit");
    this.copyTemplate(".husky/prepare-commit-msg", ".husky/prepare-commit-msg");
    this.copyDependencies({ dependencies: ["husky", "@ozum/pinst", "is-ci"] });
    this.addToAddedFiles(".husky/_/husky.sh");
    this.addToAddedFiles(".husky/.gitignore");
    this.addCreatedDir(".husky");
    this.copyScripts({ scripts: ["prepublishOnly", "postpublish", "postinstall"] });
  }

  protected end(): void {
    this.spawnCommand("node_modules/.bin/husky", ["install"]);
  }
}
