import { notSync } from "not-sync";
import BaseGenerator from "../generator";
import type { OptionNames } from "../options";

interface Options {
  notSyncPaths: string;
  coverage: boolean;
  projectRoot: string;
}

/**  Configures project for TypeDoc. */
export default class extends BaseGenerator<Options> {
  protected static optionNames: OptionNames = ["notSyncPaths", "coverage", "projectRoot"];

  protected async configuring(): Promise<void> {
    const createTimePaths = ["node_modules"];
    const paths = this.options.notSyncPaths ? this.options.notSyncPaths.split(/\s*,\s*/) : [];
    paths.push(this.options.projectRoot, ...createTimePaths);
    if (this.options.coverage) paths.push("coverage");

    await notSync(createTimePaths, { cwd: this.destinationPath("."), createDirs: true });

    const sourcePkg = this.readSourcePackage();
    const notSyncVersion = sourcePkg.dependencies?.["not-sync"] as string;

    // "not-sync": "node module-files/scripts/tsmod.js not-sync dist,coverage,node_modules",
    if (!this.targetItself) this.mergePackage({ devDependencies: { "not-sync": notSyncVersion } }, { safe: false });
    this.mergePackage({
      scripts: {
        "not-sync": `npm run tsmod not-sync not-sync ${paths.join(",")}`,
      },
    });
  }
}
