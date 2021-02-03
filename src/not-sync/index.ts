import BaseGenerator from "../generator";
import type { OptionNames } from "../options";

interface Options {
  notSyncPaths: string;
  coverage: boolean;
  projectRoot: string;
}

/**  Copies "not-sync" dependency and adds custom "not-sync" paths if available. */
export default class extends BaseGenerator<Options> {
  protected static optionNames: OptionNames = ["notSyncPaths", "coverage", "projectRoot"];

  protected async configuring(): Promise<void> {
    // if (!this.targetItself) this._copyPackage();
    const targetsNotSyncyModule = this.readDestinationPackage().name === "not-sync";
    const installScriptName = targetsNotSyncyModule ? "postinstall" : "preinstall";
    const bin = targetsNotSyncyModule ? "npm run not-sync-bin" : "not-sync";
    const installBin = targetsNotSyncyModule ? bin : "npx not-sync";

    if (!targetsNotSyncyModule) this.copyDependencies({ dependencies: ["not-sync"] });

    this.addScripts(
      { [installScriptName]: `${installBin} node_modules`, prebuild: `${bin} ${this.options.projectRoot}` },
      { prepend: true }
    );
    if (this.options.coverage) this.addScripts({ pretest: `${bin} coverage` }, { prepend: true });
    if (this.options.notSyncPaths) this.addScripts({ "not-sync": `not-sync ${this._pathsCSV}` });
  }

  /** not-sync paths as CSV */
  protected get _pathsCSV(): string {
    const customPaths = (this.options.notSyncPaths ?? "").split(",");
    const paths = ["node_modules", this.options.projectRoot, ...customPaths];
    if (this.options.coverage) paths.push("coverage");
    return paths.join(",");
  }
}
