import Generator from "../generator";

/** Enables husky support. */
export default class extends Generator {
  protected configuring(): void {
    this.copyTemplate(".husky/commit-msg", ".husky/commit-msg");
    this.copyTemplate(".husky/pre-commit", ".husky/pre-commit");
    this.copyTemplate(".husky/prepare-commit-msg", ".husky/prepare-commit-msg");
    this.copyDependencies("husky", "pinst", "is-ci");
    this.addToAddedFiles(".husky/_/husky.sh");
    this.addToAddedFiles(".husky/.gitignore");
    this.addCreatedDir(".husky");
    this.copyScripts("postinstall", "prepublish", "postpublish");
    this.copyDependencies("husky");
  }
}
