import { join } from "path";
import BaseGenerator from "../generator";
import type { OptionNames } from "../options";

interface Options {
  projectRoot: string;
  importHelpers: boolean;
}

/**  Configures project for TypeScript. */
export default class extends BaseGenerator<Options> {
  protected static optionNames: OptionNames = ["projectRoot", "importHelpers"];

  /** Adds `main`, `types` and `files` entries to `package.json` and  copies `tsconfig.json` (if not exists)  and `tsconfig.base.json` (overwrites) files. */
  protected configuring(): void {
    this.mergePackage({
      main: join(this.options.projectRoot, "index.js").replace(/\\/g, "/"),
      types: join(this.options.projectRoot, "index.d.ts").replace(/\\/g, "/"),
      files: ["@types"],
    });

    const dependencies = ["@types/node", "ts-node-dev", "typescript"];
    if (this.options.importHelpers) dependencies.push("tslib");

    const tsconfig = {
      extends: "./module-files/configs/tsconfig.json",
      compilerOptions: {
        outDir: this.options?.projectRoot !== "dist" ? this.options?.projectRoot : undefined,
        importHelpers: this.options?.importHelpers === false ? false : undefined,
      },
    };

    this.copyScripts("watch", "execute", "build");
    this.copyDependencies(...dependencies);
    this.copyConfig("tsconfig.json", undefined, { ...this.options, tsconfig });
  }
}
