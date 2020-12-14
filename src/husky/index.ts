import Generator from "../generator";

/** Enables husky support. */
export default class extends Generator {
  protected configuring(): void {
    const sourceScripts = this.readSourcePackage().scripts || {};
    this.copyTemplate(".husky/commit-msg", ".husky/commit-msg");
    this.copyTemplate(".husky/pre-commit", ".husky/pre-commit");
    this.copyTemplate(".husky/prepare-commit-msg", ".husky/prepare-commit-msg");
    this.copyDependencies("husky", "pinst", "is-ci");
    this.addToAddedFiles(".husky/_/husky.sh");
    this.addToAddedFiles(".husky/.gitignore");
    this.addCreatedDir(".husky");
    this.copyScripts("prepublishOnly", "postpublish");
    this.copyDependencies("husky");
    this.mergePackage({ scripts: { postinstall: sourceScripts.postinstall ?? sourceScripts._postinstall } });
  }

  protected end(): void {
    this.spawnCommand("node_modules/.bin/husky", ["install"]);
  }
}
