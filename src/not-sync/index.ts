import BaseGenerator from "../generator";
import type { OptionNames } from "../options";

interface Options {
  coverage: boolean;
  projectRoot: string;
}

/**  Copies "not-sync" dependency and adds custom "not-sync" paths if available. */
export default class extends BaseGenerator<Options> {
  protected static optionNames: OptionNames = ["coverage", "projectRoot"];

  protected async configuring(): Promise<void> {
    const targetsNotSyncyModule = this.readDestinationPackage().name === "not-sync";
    const targetsNotSyncyCLIModule = this.readDestinationPackage().name === "not-sync-cli";
    const bin = targetsNotSyncyModule ? "npm run not-sync" : "not-sync";

    if (targetsNotSyncyModule) {
      this.addScripts(
        { postinstall: `npm run not-sync node_modules`, "not-sync": "npm run execute src/bin/not-sync.ts" },
        { prepend: true }
      );
    } else {
      if (!targetsNotSyncyCLIModule) this.copyDependencies({ dependencies: ["not-sync"] }); // It already has it on normal dependencies.
      this.addScripts({ preinstall: `npx not-sync node_modules` }, { prepend: true });
    }

    this.addScripts({ prebuild: `${bin} ${this.options.projectRoot}` });
    this.copyScripts({ scripts: ["prepublishOnly", "postpublish"] });
    if (this.options.coverage) this.addScripts({ pretest: `${bin} coverage` }, { prepend: true });
    this.copyDependencies({ dependencies: ["@ozum/pinst", "is-ci"] });
  }
}
